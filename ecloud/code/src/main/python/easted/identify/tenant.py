# -*- coding: utf-8 -*-
import logging

import six
from tornado import gen

from easted import config
from easted import log
from easted.core import openstack
from easted.core import dbpools
from easted.identify import tenant_quotas
from easted.identify import tenant_users
from easted.identify.exception import TenantExists, TenantOperationFailed
from easted.utils import required, RedisCache

__author__ = 'gaoshan@easted.com.cn'

__all__ = [
    "list_tenants",
    "get_tenant_by_id",
    "create_tenant",
    "update_tenant",
    "delete_tenant",
]

config.register("identify.internal_admin_role", default="admin", setting_type=config.TYPE_STR, secret=True)

LOG = logging.getLogger('system')
CONF = config.CONF

__TENANT_CACHE = RedisCache("tenant")


@gen.coroutine
def list_tenants():
    params = []
    db = dbpools.get_pool(dbpools.KEYSTONE_DB)
    try:
        sql = "select a.id,a.name,a.description,b.count from project as a " \
              "LEFT JOIN (select target_id, if(count(*)!=0,count(*)-1,count(*)) as  count  " \
              "from assignment  GROUP BY target_id) as b  on a.id = b.target_id  order by a.name"

        cur = yield db.execute(sql, params)
        tenants = cur.fetchall()
        __TENANT_CACHE.clear()
        for t in tenants:
            __TENANT_CACHE.set(t['id'], t)
    except openstack.OpenStackException, e:
        LOG.error("list tenants failed: %s", (e.message,))
        raise TenantOperationFailed()
    raise gen.Return(filter(lambda x: x['name'] not in [CONF.keystone.tenant_name, 'services'], tenants))


@gen.coroutine
@required("tenant_id")
def get_tenant_by_id(tenant_id):
    @gen.coroutine
    def f():
        db = dbpools.get_keystone()
        try:
            # cur = yield db.execute("select a.id,a.name,a.description,b.count from project as a ,"
            #                        "(select target_id, count(*)-1 count  from assignment where target_id = %s) as b "
            #                        "where a.id = b.target_id", (tenant_id,))
            cur = yield db.execute("select a.id,a.name,a.description,b.count "
                                   "from (SELECT id,description,name from project WHERE id=%s) a "
                                   "LEFT JOIN (select target_id, count(*)-1 count  from assignment where target_id=%s) b "
                                   "on a.id = b.target_id", (tenant_id, tenant_id))
            tenant = cur.fetchone()
        except openstack.OpenStackException, e:
            LOG.error("get tenants failed: %s", (e.message,))
            raise TenantOperationFailed()
        raise gen.Return(tenant)

    t = yield __TENANT_CACHE.get(tenant_id, f)
    raise gen.Return(t)


@gen.coroutine
@required("name")
def create_tenant(name, description=None, enabled=True, **kwargs):
    params = {"tenant": {
        "name": name,
        "description": description,
        "enabled": enabled
    }}
    for k, v in six.iteritems(kwargs):
        if k not in params['tenant']:
            params['tenant'][k] = v
    LOG.debug("create tenant params: %s", params)
    try:
        session = yield openstack.get_session()
        t = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_IDENTITY,
                url="/tenants",
                method=openstack.METHOD_POST,
                body=params,
                response_key="tenant"
        )
        __TENANT_CACHE.set(t['id'], t)
        # add admin user
        role_id = openstack.get_role_by_name(CONF.identify.internal_admin_role)
        yield tenant_users.add_tenant_user(t['id'], session.user_id, role_id)
        # 调用查看安全组openstack api， 创建默认安全组 和默认安全组规则
        from easted.security_group import get_security_group_from_neutron
        yield get_security_group_from_neutron(t.get("id"))
    except openstack.OpenStackException, e:
        LOG.error("create tenant '%s' failed: %s" % (name, e.message))
        if e.message.code == 409:
            raise TenantExists()
        raise TenantOperationFailed()
    raise gen.Return(t)

@gen.coroutine
@required("tenant_id")
def update_tenant(tenant_id, name=None, description=None, enabled=None, **kwargs):
    body = {"tenant": {'id': tenant_id}}
    if name is not None:
        body['tenant']['name'] = name
    if enabled is not None:
        body['tenant']['enabled'] = enabled
    if description is not None:
        body['tenant']['description'] = description
    for k, v in six.iteritems(kwargs):
        if k not in body['tenant']:
            body['tenant'][k] = v
    LOG.debug("update tenant params: %s", body)
    try:
        session = yield openstack.get_session()
        t = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_IDENTITY,
                url="/tenants/%s" % tenant_id,
                method=openstack.METHOD_POST,
                body=body,
                response_key="tenant"
        )
        __TENANT_CACHE.set(tenant_id, t)
    except openstack.OpenStackException, e:
        LOG.error("update tenant '%s' failed: %s" % (name, e.message))
        raise TenantOperationFailed()
    raise gen.Return(t)


@gen.coroutine
@required("tenant_id")
def delete_tenant(tenant_id):
    try:
        session = yield openstack.get_session()
        yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_IDENTITY,
                url="/tenants/%s" % tenant_id,
                method=openstack.METHOD_DELETE
        )
        yield tenant_quotas.delete_quotas(tenant_id)
        __TENANT_CACHE.remove(tenant_id)
    except openstack.OpenStackException, e:
        LOG.error("delete tenant '%s' failed: %s" % (tenant_id, e.message))
        raise TenantOperationFailed()


@gen.coroutine
def main():
    pass
    # yield create_tenant(name='gs_test', description='gaoshan test tenant.')
    # t = yield get_tenant_by_name('gs_test')
    # print 'get_by_name:', t
    # t = yield get_tenant_by_id(t['id'])
    # print 'get_by_id:', t
    # yield update_tenant(t['id'], description='gaoshan update description.', disp_name='test')
    # t = yield get_tenant_by_name('gs_test')
    # print t
    # users = yield tenant_users.list_tenant_users(t['id'])
    # print "users: ", json.dumps(users)
    # yield delete_tenant(t['id'])
    # ts = yield list_tenants()
    # print json.dumps(ts)


if __name__ == '__main__':
    from tornado import ioloop

    log.init()
    openstack.init()
    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
