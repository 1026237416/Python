# -*- coding: utf-8 -*-
"""
    validate token and rules
    modified by meGoo at 2015-10-09

"""
import logging

from tornado import gen
from easted import config
import easted.core.rule as rule
from easted.core import openstack
from easted.core.exception import AuthenticationFailed, DialogueTimeOut

CONF = config.CONF
config.register("identify.super_user_name", default="ecloud", setting_type=config.TYPE_STR, secret=True)
__author__ = 'litao@easted.com.cn'

LOG = logging.getLogger('system')

__AUTH_TOKEN = "Ecloud-Token"
_USER_KEY = "EC-USER"
EXCEPTION_METHOD = ['login', 'logout', 'region', 'download']
ECLOUD_ADMIN = ['admin', CONF.identify.super_user_name]


def get_token(request):
    if __AUTH_TOKEN not in request.headers:
        raise AuthenticationFailed('token missed')
    return request.headers[__AUTH_TOKEN]


def get_user(request):
    return request.__getattribute__(_USER_KEY)


class Auth:
    def __init__(self, request):
        self.request = request

    @gen.coroutine
    def execute(self):
        path = self.request.path
        action = path.split('/')[1]
        if action not in EXCEPTION_METHOD:
            method = self.request.method
            auth_token = get_token(self.request)
            try:
                auth_response = yield openstack.verify_token(auth_token)
                # openstack.is_active(auth_token,auth_response.get("user")['id'])
            except:
                LOG.error("auth failed !")
                raise DialogueTimeOut()
            ecuser = {
                "id": auth_response.get("user")['id'],
                "name": auth_response.get("user")['name'],
            }

            metadata = auth_response.get("metadata")
            role = yield openstack.get_role_by_id(metadata['roles'][0])
            role_name = role.get("name")
            metadata['roles'] = [role_name]
            ecuser["role"] = role_name
            if role_name == CONF.identify.internal_user_role:
                tenant_role = yield openstack.list_user_tenants_role(ecuser['id'])
                if tenant_role:
                    role_name = CONF.identify.internal_tenant_admin_role
                    ecuser["tenant_role"] = [str(item["tenant"]) for item in tenant_role]
                    ecuser["role"] = role_name
                    metadata['roles'] = [role_name]
                else:
                    raise AuthenticationFailed()
            self.request.__setattr__(_USER_KEY, ecuser)
            if auth_response.get("user")['name'] in ECLOUD_ADMIN:
                auth_response["metadata"]['is_ecloud'] = 1
            action = str(method).lower()
            for key in str(path).split('/')[1:]:
                action += ":" + key
            if not rule.enforce(metadata, action, {}):
                LOG.error("request action is %s  auth  is %s" % (action, metadata))
                raise AuthenticationFailed()
