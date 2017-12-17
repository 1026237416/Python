# -*- coding: utf-8 -*-
import logging

from tornado import gen

from easted import identify
from easted.core import authen
from easted.core.openstack import list_user_tenants_role
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get, put, post, delete
from easted.identify import get_tenant_by_id
from easted.utils.stringUtils import *
from easted.identify.user import user_mapping
from easted.identify.exception import UserNotExist
from easted import config

from easted.log import log

__author__ = 'gaoshan@easted.com.cn'

LOG = logging.getLogger('system')

CONF = config.CONF


class Service(RestHandler):
    @gen.coroutine
    @get(_path="/users")
    def list_users(self, admin="False"):
        rs = yield identify.list_users(str2boolean(admin))
        self.response(Response(result=rs, total=len(rs)))

    @gen.coroutine
    @get(_path="/user/{user_id}")
    def get_by_id(self, user_id):
        res = yield identify.get_user_by_id(user_id)
        self.response(Response(result=res))

    @gen.coroutine
    @put(_path="/user", _required=['name'])
    def create_user(self, body):
        t = yield identify.create_user(**body)
        log.write(self.request, log.Type.USER, body['name'], log.Operator.CREATE, body['displayname'])
        self.response(Response(result=t))

    @gen.coroutine
    @post(_path="/user/{user_id}")
    def update_user(self, user_id, body):
        t = yield identify.update_user(user_id, **body)
        log.write(self.request, log.Type.USER, t['name'], log.Operator.UPDATE, t['displayname'])
        self.response(Response(result=t))

    @gen.coroutine
    @delete(_path="/user/{user_id}")
    def delete_user(self, user_id):
        user = yield identify.get_user_by_id(user_id)
        if not user:
            raise UserNotExist
        yield identify.delete_user(user_id)
        log.write(self.request, log.Type.USER, user['name'], log.Operator.DELETE, user['displayname'])
        self.response(Response())

    @gen.coroutine
    @post(_path="/user/role/set", _required=['role', 'name'])
    def set_user_role(self, body):
        user = yield user_mapping(body["name"])
        yield identify.set_user_role(user.get("id"), body['role'], body.get("tenant"))
        if body['role'] == 'sys_admin':
            log.write(self.request, log.Type.USER, user['name'], log.Operator.SET_ADMIN_ROLE, user['displayname'])
        else:
            log.write(self.request, log.Type.USER, user['name'], log.Operator.CANCEL_ADMIN_ROLE, user['displayname'])

        self.response(Response())

    @gen.coroutine
    @post(_path="/user/{user_id}/tenant/{tenant_id}/role", _required=['role'])
    def set_tenant_user_role(self, user_id, tenant_id, body):
        user = yield identify.get_user_by_id(user_id)
        yield identify.set_user_role(user_id, body['role'], tenant_id)
        t = yield get_tenant_by_id(tenant_id)
        if body['role'] == 'tenant_admin':
            log.write(self.request, log.Type.TENANT, t['name'], log.Operator.SET_TENANT_ROLE, user['displayname'])
        else:
            log.write(self.request, log.Type.TENANT, t['name'], log.Operator.CANCEL_TENANT_ROLE, user['displayname'])
        self.response(Response())

    @gen.coroutine
    @get(_path="/user/{user_id}/tenants")
    def list_user_tenants(self, user_id):
        rs = yield list_user_tenants_role(user_id, is_admin=False)
        result = []
        for i in rs:
            tenant = yield get_tenant_by_id(i['tenant'])
            i['tenant'] = tenant
            result.append(i)
        self.response(Response(result=result, total=len(result)))

    @gen.coroutine
    @post(_path="/password", _required=['orig_pwd', 'new_pwd'])
    def update_own_password(self, body):
        token = authen.get_token(self.request)
        user_id = authen.get_user(self.request)['id']
        yield identify.update_user_own_password(token, user_id, **body)
        user = yield identify.get_user_by_id(user_id)
        log.write(self.request, log.Type.USER, user['name'], log.Operator.RESET_PASS, user['name'])
        self.response(Response())

    @gen.coroutine
    @post(_path="/user/{user_id}/password/reset", _required=['password'])
    def update_password(self, user_id, body):
        yield identify.update_user_password(user_id, body['password'])
        user = yield identify.get_user_by_id(user_id)
        log.write(self.request, log.Type.USER, user['name'], log.Operator.RESET_PASS, user['displayname'])
        self.response(Response())

    @gen.coroutine
    @post(_path="/user/{user_id}/enable")
    def update_user_enable(self, user_id, body):
        yield identify.update_user_enable(user_id, body['enable'])
        user = yield identify.get_user_by_id(user_id)
        log.write(self.request, log.Type.USER, user['name'], log.Operator.UPDATE, user['displayname'])
        self.response(Response())
