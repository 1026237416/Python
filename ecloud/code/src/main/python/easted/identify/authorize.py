# -*- coding: utf-8 -*-
import logging

from tornado import gen

from easted import config
from easted.core import dbpools
from easted.core import openstack
from easted.identify import user
from easted.identify.exception import Forbidden, ActivateUserFailed
from easted.utils import required
from eldap import auth

__author__ = 'gaoshan@easted.com.cn'

__all__ = ["login", "logout"]

config.register("identify.enable_super_user", default=True, setting_type=config.TYPE_BOOL, secret=True)
config.register("identify.super_user_name", default="ecloud", setting_type=config.TYPE_STR, secret=True)
config.register("ldap.enable", default="False", setting_type=config.TYPE_STR, secret=True)
config.register("keystone.password", default="password", secret=True)

CONF = config.CONF
LOG = logging.getLogger('system')


@gen.coroutine
@required("username", "password")
def login(username, password):
    if CONF.keystone.username == username:
        raise Forbidden()
    if CONF.identify.super_user_name == username and not CONF.identify.enable_super_user:
        raise Forbidden()

    if CONF.ldap.enable:
        if CONF.identify.super_user_name != username:
            if not auth(username, password):
                raise Forbidden()
            password = CONF.keystone.password

    token = yield __create_token(username, password)
    user_id = token['user']['id']
    u = yield user.get_user_by_id(user_id)
    if u['role']['name'] == CONF.identify.internal_user_role:
        user_admin_tenant = yield openstack.list_user_tenants_role(user_id)
        if not user_admin_tenant:
            raise Forbidden()
        u['role']['name'] = CONF.identify.internal_tenant_admin_role
    try:
        yield __activate_user(token['token']['id'], user_id)
    except Exception, e:
        LOG.error("login error! %s" % e)
        yield __delete_token(token['token']['id'])
        raise ActivateUserFailed()
    out_token = {"token": token['token'].get("id"), "user": u}
    raise gen.Return(out_token)


@gen.coroutine
def logout(token):
    try:
        yield __delete_token(token)
    except Exception, e:
        LOG.error("logout token error! %s" % token, e.message)


@gen.coroutine
def __activate_user(token_id, user_id):
    db = dbpools.get_pool(dbpools.COMMON_DB)
    cur = yield db.execute("select token from token where user_id = %s ", (user_id,))
    old_token = cur.fetchone()
    if old_token:
        yield __delete_token(old_token['token'])
    yield dbpools.execute_commit(
        db,
        "insert into token (token, user_id) values (%s, %s)",
        (token_id, user_id)
    )


@gen.coroutine
def __delete_token(token_id):
    yield dbpools.execute_commit(
        dbpools.get_common(),
        "delete from token where token = %s",
        (token_id,)
    )
    try:
        session = yield openstack.get_session()
        yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IDENTITY,
            url="/tokens/%s" % token_id,
            method=openstack.METHOD_DELETE
        )
    except Exception, e:
        LOG.error("this token has deleted %s" % e)


@gen.coroutine
def del_expires_token():
    yield dbpools.execute_commit(
        dbpools.get_keystone(),
        "delete from token where expires < utc_timestamp() limit 1000"
    )


@gen.coroutine
def __create_token(name, password):
    body = {"auth": {
        "tenantName": CONF.keystone.tenant_name,
        "passwordCredentials": {
            "username": name,
            "password": password
        }}}
    try:
        session = yield openstack.get_session()
        token = yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IDENTITY,
            url="/tokens",
            method=openstack.METHOD_POST,
            body=body,
            response_key='access'
        )
    except Exception as e:
        raise e
        raise Forbidden()
    raise gen.Return({'token': token['token'], 'user': token['user']})


@gen.coroutine
def main():
    t = yield login('sec2', 'password')
    print t
    yield logout(t['token'])


if __name__ == '__main__':
    from tornado import ioloop

    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
