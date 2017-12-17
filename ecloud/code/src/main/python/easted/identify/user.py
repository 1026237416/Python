# -*- coding: utf-8 -*-
import json
import logging
import os

import six
from easted.core import dbpools
from easted import log
from easted import config
from easted.core import openstack
from easted.core import region
from easted.core import mail
from eldap import users
from easted.core.openstack import OpenStackException
import tenant_users
from exception import Forbidden, UserExists, UserOperationFailed, UserNotExist, UnknownRoleName, \
    QueryUserTenantRoleFailed
from tornado import gen

from easted.utils import required, RedisCache, trace

__author__ = 'gaoshan@easted.com.cn'

config.register("identify.public_roles", default=["tenant_admin", "user"],
                setting_type=config.TYPE_LIST, secret=True)
config.register("identify.admin_roles", default=["sys_admin", "user"],
                setting_type=config.TYPE_LIST, secret=True)
config.register("identify.send_password_mail", default=True, setting_type=config.TYPE_BOOL)
config.register("identify.internal_tenant_admin_role", default="tenant_admin", secret=True)

CONF = config.CONF
LOG = logging.getLogger('system')

__all__ = [
    "list_users",
    "get_user_role",
    "get_user_by_id",
    "create_user",
    "update_user",
    "delete_user",
    "set_user_role",
    "update_user_password",
    "update_user_own_password",
    "update_user_enable",
    "get_user_by_name",
    "user_mapping"
]

__USER_CACHE = RedisCache("user")


@gen.coroutine
def list_users(admin=False):
    ret = []
    try:
        admin_tenant_id = yield openstack.get_admin_tenant_id()
        t_users = yield tenant_users.list_tenant_users(admin_tenant_id, admin)
        __USER_CACHE.clear()
        user_role = yield __list_users_admin_role()
        member_role = {
            "id": openstack.get_role_by_name(CONF.identify.internal_user_role),
            "name": CONF.identify.internal_user_role
        }
        u_r = {}
        for u in t_users:
            u['role'] = user_role.get(u['id'])
            u_r[u['name']] = {
                "role": u['role'],
                "id": u['id']
            }
            __USER_CACHE.set(u['id'], u)
            if not CONF.ldap.enable:
                ret.append(u)

        if CONF.ldap.enable:
            ret = users()
            l_u = []
            for lu in ret:
                if lu['name']:
                    lu["role"] = member_role
                    l_u.append(lu['name'])
                    if lu["name"] in u_r:
                        lu["role"] = u_r[lu["name"]]["role"]
                        lu["id"] = u_r[lu["name"]]["id"]
            for r in t_users:
                if r['name'] not in l_u:
                    if r['name'] != 'ecloud':
                        yield delete_user(r["id"])
                    else:
                        ret.append(r)
    except OpenStackException, e:
        LOG.error('list users raise an error: %s' % e.message)
        LOG.error(trace())
        raise UserOperationFailed()
    raise gen.Return(ret)


@gen.coroutine
def __list_users_admin_role():
    db = dbpools.get_keystone()
    admin_tenant_id = yield openstack.get_admin_tenant_id()
    try:
        cur = yield db.execute(
            "select  actor_id as user ,target_id as tenant , role_id as role from assignment where target_id = %s ",
            (admin_tenant_id,))
        user_tenant_role = cur.fetchall()
        user_role = {}
        for item in user_tenant_role:
            user_role[item['user']] = yield openstack.get_role_by_id(item['role'])
    except Exception:
        raise QueryUserTenantRoleFailed
    raise gen.Return(user_role)


@gen.coroutine
def get_user_role(user_id, tenant_id=None):
    db = dbpools.get_keystone()
    if not tenant_id:
        tenant_id = yield openstack.get_admin_tenant_id()
    try:
        cur = yield db.execute(
            "select role_id as role from assignment where actor_id = %s  and target_id = %s ",
            (user_id, tenant_id,))
        user_role = cur.fetchone()
        role = {}
        if user_role:
            role['id'] = user_role.get("role")
            role_name = yield openstack.get_role_by_id(user_role.get("role"))
            role['name'] = role_name.get("name")
    except Exception:
        raise QueryUserTenantRoleFailed
    raise gen.Return(role)


@gen.coroutine
def get_user_by_id(user_id):
    @gen.coroutine
    def f():
        try:
            url = "/users/%s" % user_id
            session = yield openstack.get_session()
            user = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_IDENTITY,
                url=url,
                method=openstack.METHOD_GET,
                response_key="user")
            user['role'] = yield get_user_role(user_id)
        except Exception, e:
            LOG.error("get user error: %s" % e)
            raise UserNotExist(args=[user_id])
        raise gen.Return(user)

    u = yield __USER_CACHE.get(user_id, f)
    if "role" in u:
        if not isinstance(u.get("role"), dict):
            u["role"] = eval(u.get("role"))
    raise gen.Return(u)


@gen.coroutine
def user_mapping(name):
    """
    :param name:
    :return: {
          "id":"",
          "name":"",
          "displayname":""
    }
    """
    user = yield get_user_by_name(name=name)
    if not user:
        i = users(username=name)
        i.pop("name")
        i.pop("dn")
        user = yield create_user(name=name, password=CONF.keystone.password, **i)
    raise gen.Return(user)


@gen.coroutine
def get_user_by_name(name):
    try:
        pool = dbpools.get_keystone()
        sql = 'select id,`name`,extra from user  where name = %s '
        cur = yield pool.execute(sql, (name,))
        user = cur.fetchone()
        if user:
            extra = json.loads(user["extra"])  ##获取数据库中的字符串，解析成为字典
            user.pop("extra")
            user["displayname"] = extra.get("displayname")
    except Exception, e:
        LOG.error("get user by name %s error %s", name, e)
    raise gen.Return(user)


@gen.coroutine
@required("name")
def create_user(name, password=None, enabled=True, **kwargs):
    password = __random_password() if not password else password
    params = {"user": {"name": name,
                       "password": password,
                       "enabled": enabled}}
    for k, v in six.iteritems(kwargs):
        if k not in params['user']:
            params['user'][k] = v
    LOG.debug("create user params: %s", params)
    try:
        session = yield openstack.get_session()
        u = yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IDENTITY,
            url="/users",
            method=openstack.METHOD_POST,
            body=params,
            response_key="user"
        )

        role_id = openstack.get_role_by_name(CONF.identify.internal_user_role)
        yield tenant_users.add_tenant_user(session.tenant_id, u['id'], role_id)

        u['role'] = {
            "id": role_id,
            "name": CONF.identify.internal_user_role
        }
        __USER_CACHE.set(u['id'], u)

        if CONF.identify.send_password_mail and "email" in u and u['email']:
            rg = yield region.get_current_region()
            mparams = {
                "name": name,
                "password": password,
                "url": rg['url'],
                'user': u['displayname'] if "displayname" in u else u['name']
            }
            mail.send_mail_task(
                to_list=[u['email']],
                subject="欢迎使用EASTED ECloud云平台",
                template="create_user.html",
                params=mparams)
    except Exception, e:
        LOG.error("create user '%s' failed: %s" % (name, e.message))
        if e.message.code == 409:
            raise UserExists()
        raise UserOperationFailed()
    raise gen.Return(u)


@gen.coroutine
@required("user_id")
def update_user(user_id, **kwargs):
    params = {"user": kwargs}
    params['user']['id'] = user_id
    url = "/users/%s" % user_id
    LOG.debug("update user params: %s", params)
    try:
        session = yield openstack.get_session()
        u = yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IDENTITY,
            url=url,
            method=openstack.METHOD_PUT,
            body=params,
            response_key="user"
        )
        u['role'] = yield get_user_role(u['id'])
        __USER_CACHE.set(u['id'], u)
    except openstack.OpenStackException, e:
        LOG.error("update user '%s' failed: %s" % (user_id, e.message))
        raise UserOperationFailed()
    raise gen.Return(u)


@gen.coroutine
@required("user_id")
def delete_user(user_id):
    try:
        url = "/users/%s" % user_id
        session = yield openstack.get_session()
        yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IDENTITY,
            url=url,
            method=openstack.METHOD_DELETE)
        __USER_CACHE.remove(user_id)
    except Exception, e:
        LOG.error("delete user '%s' raise an error: %s" % (user_id, e))
        raise UserOperationFailed()
    else:
        try:
            nova = dbpools.get_nova()
            sql = 'delete from instance_metadata where value = %s'
            yield nova.execute(sql, (user_id,))
            cinder = dbpools.get_cinder()
            sql = 'delete from volume_metadata where value = %s'
            yield cinder.execute(sql, (user_id,))
        except Exception, e:
            LOG.error("delete metadata user '%s' raise an error: %s" % (user_id, e))
            raise UserNotExist


@gen.coroutine
@required("user_id", "role_name")
def set_user_role(user_id, role_name, tenant_id=None):
    try:
        admin_tenant_id = yield openstack.get_admin_tenant_id()
        flag = False
        if not tenant_id or (tenant_id == admin_tenant_id):
            flag = True
            tenant_id = admin_tenant_id
        if flag:
            if role_name not in CONF.identify.admin_roles:
                raise UnknownRoleName(args=(role_name,))
        else:
            if role_name not in CONF.identify.public_roles:
                raise UnknownRoleName(args=(role_name,))
        role = yield get_user_role(user_id, tenant_id)

        yield tenant_users.remove_tenant_user(tenant_id=tenant_id, user_id=user_id, role_id=role['id'])
        rid = openstack.get_role_by_name(role_name)
        yield tenant_users.add_tenant_user(tenant_id=tenant_id, user_id=user_id, role_id=rid)
        if flag:
            u = __USER_CACHE.get_by_id(user_id)
            u['role'] = {
                "id": rid,
                "name": str(role_name)
            }
            __USER_CACHE.set(user_id, u)
    except BaseException, e:
        LOG.error(trace())
        LOG.error("grant role '%s' to user '%s' raise an error: %s" % (role_name, user_id, e.message))
        raise UserOperationFailed()


@gen.coroutine
@required("user_id")
def update_user_password(user_id, password=None):
    password = __random_password() if not password else password
    params = {"user": {"id": user_id, "password": password}}
    url = "/users/%s/OS-KSADM/password" % user_id
    try:
        session = yield openstack.get_session()
        u = yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IDENTITY,
            url=url,
            method=openstack.METHOD_PUT,
            body=params,
            response_key="user"
        )
        if CONF.identify.send_password_mail and "email" in u and u['email']:
            rg = yield region.get_current_region()
            mparams = {
                "name": u['name'],
                "password": password,
                "url": rg['url'],
                'user': u['displayname'] if "displayname" in u else u['name']
            }
            mail.send_mail_task(
                to_list=[u['email']],
                subject="EASTED ECloud - 您的密码已被重置",
                template="reset_user_password.html",
                params=mparams)
    except openstack.OpenStackException, e:
        LOG.error("reset user '%s's password failed: %s" % (user_id, e.message))
        raise UserOperationFailed()


@gen.coroutine
@required("token", "user_id", "orig_pwd", "new_pwd")
def update_user_own_password(token, user_id, orig_pwd, new_pwd):
    params = {"user": {"password": new_pwd, "original_password": orig_pwd}}
    url = "/OS-KSCRUD/users/%s" % user_id
    try:
        session = yield openstack.get_session()
        yield openstack.connect_request(
            session=session,
            token=token,
            type=openstack.TYPE_IDENTITY,
            url=url,
            method=openstack.METHOD_PATCH,
            body=params,
            interface=openstack.INTF_TYPE_PUBLIC
        )
    except openstack.OpenStackException, e:
        LOG.error("update user '%s's password failed: %s" % (user_id, e.message))
        if e.message.code == 401:
            raise Forbidden()
        raise UserOperationFailed()


def __random_password(length=8):
    return ''.join(map(lambda xx: (hex(ord(xx))[2:]), os.urandom(16)))[:length]


@gen.coroutine
@required("user_id")
def update_user_enable(user_id, enabled=True):
    params = {"user": {"id": user_id, "enabled": enabled}}
    url = "/users/%s/OS-KSADM/enabled" % user_id
    try:
        session = yield openstack.get_session()
        u = yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IDENTITY,
            url=url,
            method=openstack.METHOD_PUT,
            body=params,
            response_key="user"
        )
        __USER_CACHE.set(u['id'], u)
    except openstack.OpenStackException, e:
        LOG.error("update user '%s' status failed: %s" % (user_id, e.message))
        raise UserOperationFailed()
    raise gen.Return(u)


@gen.coroutine
def main():
    pass
    # from easted.identify import authorize
    # orig_pwd = '12345678'
    # yield create_user('gs_test_user', password=orig_pwd, enabled=False, displayname=u'高山',
    #                   email='gaoshan@easted.com.cn')
    # u = yield get_user_by_name('gs_test_user')
    # print u
    # yield update_user(u['id'], security=1)
    # yield update_user_enable(u['id'], True)
    # sess = yield authorize.login(u['name'], orig_pwd)
    # yield update_user_own_password(sess['token'], u['id'], orig_pwd, '87654321')
    # yield update_user_password(u['id'])
    # yield set_user_role(u['id'], 'sys_admin')
    # u = yield get_user_by_id(u['id'])
    # print u
    # yield delete_user(u['id'])
    # users = yield list_user_tenants_role('09a1ea0ae5a8443281c38fd1469e3acd',is_admin=False)
    # print users

    # u_t = yield list_user_tenants(user_id='a86ccc99f47b4865ae3184466453a9cc',is_admin=False)
    # print u_t


if __name__ == '__main__':
    import time
    from tornado import ioloop
    from easted.core import dbpools

    os.chdir("../../")
    log.init()
    openstack.init()
    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
    time.sleep(10)
