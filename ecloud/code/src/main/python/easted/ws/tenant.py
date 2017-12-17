# -*- coding: utf-8 -*-
import logging
from tornado import gen
from easted.core import dbpools
from easted import identify
from easted.core.authen import get_user, get_token
from easted.core.openstack import async_request
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get, put, post, delete
from easted.identify.exception import TenantDeleteFailed
from easted.network.exception import TenantNotExist
from easted.core import region as rg
import easted.log as optLog
from easted.log import Type, Operator
from easted import config
from easted.network import delete_tnr_from_ecloud
from easted.volume import clear_user_volumes
from easted.compute import clear_vm_user
from easted.identify import user_mapping, get_user_role
from manor.util.generals import trace

__author__ = 'gaoshan@easted.com.cn'

LOG = logging.getLogger('system')

CONF = config.CONF


class Service(RestHandler):
    @gen.coroutine
    @get(_path="/tenants")
    def list_tenants(self):
        rs = yield identify.list_tenants()
        curr_user = get_user(self.request)
        result = []
        tenant_ids = curr_user.get("tenant_role")
        if tenant_ids:
            for i in rs:
                if i['id'] in tenant_ids:
                    result.append(i)
        else:
            result = rs
        self.response(Response(result=result, total=len(result)))

    @gen.coroutine
    @get(_path="/tenant/{tenant_id}")
    def get_by_id(self, tenant_id):
        t = yield identify.get_tenant_by_id(tenant_id)
        self.response(Response(result=t))

    @gen.coroutine
    @put(_path="/tenant", _required=['name'])
    def create_tenant(self, body):
        t = yield identify.create_tenant(**body)
        optLog.write(self.request, Type.TENANT, t['name'], Operator.CREATE, '')
        self.response(Response(result=t))

    @gen.coroutine
    @post(_path="/tenant/{tenant_id}")
    def update_tenant(self, tenant_id, body):
        tenant = yield identify.get_tenant_by_id(tenant_id)
        if not tenant:
            raise TenantNotExist
        db = dbpools.get_keystone()
        cur = yield db.execute(
            "select name from project where id = %s ",
            (tenant_id,))
        old_tenant_name = cur.fetchone()
        t = yield identify.update_tenant(tenant_id, **body)
        optLog.write(self.request, Type.TENANT, old_tenant_name['name'], Operator.UPDATE, t['name'])
        self.response(Response(result=t))

    @gen.coroutine
    @delete(_path="/tenant/{tenant_id}")
    def delete_tenant(self, tenant_id, internal=False):
        tenant = yield identify.get_tenant_by_id(tenant_id)
        if not tenant:
            raise TenantNotExist
        if internal:
            try:
                for name in identify.get_quota_names():
                    q = yield identify.get_quota(tenant_id, name)
                    if q and q.get("quota_used") != 0:
                        region = yield rg.list_region(CONF.keystone.region_name)
                        raise TenantDeleteFailed(region[0].get("displayname"))
                yield identify.delete_quotas(tenant_id)
                yield delete_tnr_from_ecloud(tenant_id)
            except Exception as e:
                LOG.error("delete tenant error:%s" % e)
                LOG.error(trace())
                raise e
        else:
            regions = yield rg.list_region()
            for region in regions:
                if region["region"] == CONF.keystone.region_name:
                    for name in identify.get_quota_names():
                        q = yield identify.get_quota(tenant_id, name)
                        if q.get("quota_used") != 0:
                            raise TenantDeleteFailed()
                    continue
                servers_url = "%s/tenant/%s?internal=true" % \
                              (region['url'], tenant_id)
                try:
                    res = yield async_request(url=servers_url,
                                        token=get_token(self.request),
                                        body=None, method="DELETE")
                    if res and res.get("success") is False and res.get("msg") == TenantDeleteFailed.msg:
                        raise TenantDeleteFailed
                except Exception as e:
                    LOG.error("delete tenant quota from another region error:%s" % e)
                    LOG.error(trace())
                    if e.message == TenantDeleteFailed.msg:
                        raise TenantDeleteFailed(args=[region['displayname']])
                    raise rg.RegionException(args=[region['displayname']])
            try:
                yield identify.delete_quotas(tenant_id)
                yield delete_tnr_from_ecloud(tenant_id)
                yield identify.delete_tenant(tenant_id)
            except Exception as e:
                LOG.error("delete tenant error:%s" % e)
                LOG.error(trace())
                region = yield rg.list_region(CONF.keystone.region_name)
                raise TenantDeleteFailed(region[0].get("displayname"))
            optLog.write(self.request, Type.TENANT, tenant['name'], Operator.DELETE, '')
        self.response(Response())

    @gen.coroutine
    @get(_path="/tenant/{tenant_id}/users")
    def list_users(self, tenant_id):
        rs = yield identify.list_tenant_users(tenant_id)
        result = []
        for user in rs:
            user['role'] = yield get_user_role(user['id'], tenant_id)
            result.append(user)
        self.response(Response(result=result, total=len(result)))

    @gen.coroutine
    @post(_path="/tenant/{tenant_id}/users")
    def add_users(self, tenant_id, body):
        tenant = yield identify.get_tenant_by_id(tenant_id)
        for user_name in body:
            user = yield user_mapping(user_name)
            yield identify.add_tenant_user(tenant_id, user.get("id"))
            optLog.write(self.request, Type.TENANT, tenant['name'], Operator.ADD_USER, user['displayname'])
        self.response(Response())

    @gen.coroutine
    @delete(_path="/tenant/{tenant_id}/users")
    def remove_users(self, tenant_id):
        users = self.get_argument('users').split(',')
        tenant = yield identify.get_tenant_by_id(tenant_id)
        usernames = []
        for user_id in users:
            user = yield identify.get_user_by_id(user_id)
            role = yield identify.get_user_role(user_id, tenant_id)
            yield identify.remove_tenant_user(tenant_id, user_id, role['id'])
            usernames.append(user['displayname'])
            # clear volumes of this user
            yield clear_user_volumes(tenant_id, user_id)
            # clear vms of this user
            yield clear_vm_user(tenant_id, user_id)
        optLog.write(self.request, Type.TENANT, tenant['name'], Operator.REMOVE_USER, user['displayname'])
        self.response(Response())

    @gen.coroutine
    @get(_path="/tenant/quota/names")
    def quota_names(self):
        rs = identify.get_quota_names()
        self.response(Response(result=rs, total=len(rs)))

    @gen.coroutine
    @get(_path="/tenant/{tenant_id}/quota")
    def get_quota(self, tenant_id):
        rs = []
        for name in identify.get_quota_names():
            q = yield identify.get_quota(tenant_id, name)
            rs.append(q)
        self.response(Response(result=rs, total=len(rs)))

    @gen.coroutine
    @post(_path="/tenant/{tenant_id}/quota")
    def set_quota(self, tenant_id, body):
        tenant = yield identify.get_tenant_by_id(tenant_id)
        for quota in body:
            yield identify.update_quota_limit(tenant_id, name=quota['quota_name'], limit=quota['quota_limit'])
        optLog.write(self.request, Type.TENANT, tenant['name'], Operator.MODIFY_QUOTA, '')
        self.response(Response())
