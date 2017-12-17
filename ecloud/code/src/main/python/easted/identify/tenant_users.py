# -*- coding: utf-8 -*-
import logging

from tornado import gen

from easted import config
from easted.core import openstack
from exception import TenantUserOperationFailed
from easted.utils import required,trace
import eldap
import user

__author__ = 'gaoshan@easted.com.cn'

__all__ = [
    'add_tenant_user',
    'remove_tenant_user',
    'list_tenant_users'
]

config.register("identify.internal_user_role", default="user", setting_type=config.TYPE_STR, secret=True)
config.register("keystone.password", default="password", secret=True)
LOG = logging.getLogger('system')
CONF = config.CONF


@gen.coroutine
@required("tenant_id", "user_id")
def add_tenant_user(tenant_id, user_id, role_id=None):
    try:
        session = yield openstack.get_session()
        if not role_id:
            role_id = openstack.get_role_by_name(CONF.identify.internal_user_role)
        r = yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IDENTITY,
            url="/tenants/%s/users/%s/roles/OS-KSADM/%s" % (tenant_id, user_id, role_id),
            method=openstack.METHOD_PUT,
            body='',
            response_key='role'
        )
    except openstack.OpenStackException, e:
        LOG.error("add user '%s' to tenant '%s' failed: %s" % (user_id, tenant_id, e.message))
        raise TenantUserOperationFailed()
    raise gen.Return(r)


@gen.coroutine
@required("tenant_id", "user_id")
def remove_tenant_user(tenant_id, user_id, role_id=None):
    try:
        session = yield openstack.get_session()
        if not role_id:
            role_id = openstack.get_role_by_name(CONF.identify.internal_user_role)
        yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IDENTITY,
            url="/tenants/%s/users/%s/roles/OS-KSADM/%s" % (tenant_id, user_id, role_id),
            method=openstack.METHOD_DELETE,
        )
    except openstack.OpenStackException, e:
        LOG.error("remove user '%s' from tenant '%s' failed: %s" % (user_id, tenant_id, e.message))
        raise TenantUserOperationFailed()


@gen.coroutine
@required("tenant_id")
def list_tenant_users(tenant_id, admin=False):
    try:
        session = yield openstack.get_session()
        ret = yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IDENTITY,
            url="/tenants/%s/users" % (tenant_id,),
            method=openstack.METHOD_GET,
            response_key="users"
        )
    except openstack.OpenStackException, e:
        LOG.error("list tenant '%s' users failed: %s", (tenant_id, e.message,))
        raise TenantUserOperationFailed()

    if not admin:
        result = filter(lambda x: x['name'] != CONF.keystone.username and x['name'] != CONF.identify.super_user_name,
                        ret)
    else:
        result = filter(lambda x: x['name'] != CONF.keystone.username,
                        ret)

    if CONF.ldap.enable:
        try:
            ldap_ret = eldap.users()
            l_u = {}
            for lu in ldap_ret:
                if lu['name']:
                    l_u[lu['name']] = lu
            ldap_result = []
            for k in result:
                if k['name'] not in l_u.keys():
                    if admin and k['name'] == CONF.identify.super_user_name:
                        ldap_result.append(k)
                    elif k['name'] != 'ecloud':
                        yield user.delete_user(k["id"])
                else:
                    k.update(l_u[k['name']])
                    ldap_result.append(k)
            result = ldap_result
        except BaseException, e:
            LOG.error("list ldap user error %s",e)
            LOG.error(trace())
    raise gen.Return(result)
