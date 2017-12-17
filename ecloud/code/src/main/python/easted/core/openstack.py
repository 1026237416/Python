# -*- coding: utf-8 -*-

import json
import logging
from tornado import gen
from easted import config
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from easted.core.exception import ECloudException, DialogueTimeOut
from easted.core import dbpools
from easted.utils import RedisCache

__author__ = 'tao'

LOG = logging.getLogger('system')

config.register("keystone.username", default="admin", secret=True)
config.register("keystone.password", default="password", secret=True)
config.register("keystone.auth_url", default="http://10.10.130.5:5000/v2.0/tokens", secret=True)
config.register("keystone.region_name", default="RegionOne", secret=True)
config.register("keystone.tenant_name", default="admin", secret=True)
CONF = config.CONF

TYPE_COMPUTE = "compute"
TYPE_NETWORK = "network"
TYPE_VOLUME = "volumev2"
TYPE_IDENTITY = "identity"
TYPE_IMAGE = "image"
TYPE_METERING = "metering"

METHOD_POST = "POST"
METHOD_GET = "GET"
METHOD_PUT = "PUT"
METHOD_DELETE = "DELETE"
METHOD_PATCH = "PATCH"

REQUEST_TYPES = (TYPE_COMPUTE, TYPE_IDENTITY, TYPE_NETWORK, TYPE_VOLUME, TYPE_IMAGE, TYPE_METERING)

INTF_TYPE_ADMIN = "admin"
INTF_TYPE_PUBLIC = "public"
INTF_TYPE_INTERNAL = "internal"

__ROLE_CACHE = RedisCache("os-role")
__SESSION = ""


class OpenStackException(ECloudException):
    """捕获openstack的异常直接抛出msg
    """
    msg = "error.openstack.interaction.exception"


class Session(object):
    id = str
    urls = dict
    token = str
    tenant_id = str
    user_id = str

    def __init__(self, **kwargs):
        self.id = kwargs.get("id", None)
        self.urls = kwargs.get("urls", None)
        self.token = kwargs.get("token", None)
        self.tenant_id = kwargs.get("tenant_id", None)
        self.user_id = kwargs.get("user_id", None)


@gen.coroutine
def init():
    yield __list_role()


@gen.coroutine
def __list_role():
    try:
        url = "/OS-KSADM/roles"
        session = yield get_session()
        roles = yield connect_request(session=session, type=TYPE_IDENTITY, url=url, method=METHOD_GET,
                                      response_key="roles")
        __ROLE_CACHE.clear()
        for role in roles:
            __ROLE_CACHE.set(role['id'], role)
    except Exception, e:
        LOG.error("get roles error: %s" % e)
        raise OpenStackException()


def list_roles():
    return __ROLE_CACHE


@gen.coroutine
def get_role_by_id(uuid):
    r = __ROLE_CACHE.get_by_id(uuid)
    if not r:
        roles = yield __list_role()
        r = roles.get(uuid)
    raise gen.Return(r if r else None)


def get_role_by_name(name):
    r = __ROLE_CACHE.get_by_unique('name', name)
    return r['id'] if r else None


@gen.coroutine
def is_active(token_id, user_id):
    db = dbpools.get_pool(dbpools.COMMON_DB)
    try:
        cur = yield db.execute("select token from token where user_id = %s  and token = %s ", (user_id, token_id,))
        old_token = cur.fetchone()
        if not old_token:
            raise DialogueTimeOut
    except Exception:
        raise DialogueTimeOut


@gen.coroutine
def __get_admin_token():
    """get in activities admin token
    :return:token
    """
    global __SESSION
    try:
        if __SESSION:
            yield verify_token(__SESSION.id)
        else:
            raise OpenStackException()
    except OpenStackException:
        __SESSION = yield __get_token(tenant=None)
    raise gen.Return(__SESSION)


@gen.coroutine
def verify_token(token):
    try:
        req = HTTPRequest(url=CONF.keystone.auth_url, method="POST", headers={"Content-Type": "application/json"},
                          body=json.dumps({"auth": {"token": {"id": token}, "tenantName": CONF.keystone.tenant_name}}),
                          connect_timeout=200, request_timeout=600,
                          validate_cert=False)
        cli = AsyncHTTPClient()
        rep = yield cli.fetch(req)
        rs = json.loads(rep.body)
        access = rs.get("access")
    except Exception, e:
        raise OpenStackException()
    raise gen.Return(access)


@gen.coroutine
def list_user_tenants_role(user_id, is_admin=True):
    db = dbpools.get_keystone()
    admin_tenant = yield get_admin_tenant_id()
    try:
        cur = yield db.execute(
                "select  actor_id as user ,target_id as tenant , role_id as role from assignment where target_id != %s and actor_id = %s ",
                (admin_tenant,user_id,))
        user_tenants = cur.fetchall()
        result = []
        for item in user_tenants:
            role = str(item['role'])
            item['role'] = yield get_role_by_id(role)
            if is_admin:
                if role == get_role_by_name(CONF.identify.internal_tenant_admin_role):
                    result.append(item)
            else:
                result.append(item)
    except Exception:
        LOG.error("list tenant role error user id is %s",user_id)

    raise gen.Return(result)




@gen.coroutine
def get_session(tenant=None):
    if tenant:
        token = yield __get_token(tenant)
    else:
        token = yield __get_admin_token()
    raise gen.Return(token)


@gen.coroutine
def __get_token(tenant):
    """
    该方法返回自己租户的token。
    :param tenant: 
    :return:
    """
    try:
        loginbody = {"auth": {"tenantName": CONF.keystone.tenant_name,
                              "passwordCredentials": {"username": CONF.keystone.username,
                                                      "password": CONF.keystone.password}}}
        if tenant is not None:
            loginbody["auth"].pop("tenantName")
            loginbody["auth"]["tenantId"] = tenant
        req = HTTPRequest(url=CONF.keystone.auth_url, method="POST", headers={"Content-Type": "application/json"},
                          body=json.dumps(loginbody), connect_timeout=200, request_timeout=600, validate_cert=False)
        cli = AsyncHTTPClient()
        rep = yield cli.fetch(req)
        token = json.loads(rep.body)
        session = __get_session(token)
    except Exception as e:
        LOG.error(e)
        raise OpenStackException()
    raise gen.Return(session)


@gen.coroutine
def get_admin_tenant_id():
    session = yield get_session()
    admin_tenant = session.tenant_id
    raise gen.Return(admin_tenant)


def __get_session(token):
    """
    获取openstack服务的连接session
    :param token:
    :param type: 模块类型
    :return:
    """
    urls = {}
    try:
        access = token.get("access")
        token_id = access.get("token").get("id")
        services = access.get("serviceCatalog")
        tenant_id = access.get("token").get("tenant").get("id")
        user_id = access.get("user").get("id")
        for item in services:
            if item.get("type") in REQUEST_TYPES:
                for endpoint in item.get("endpoints"):
                    if endpoint['region'] == CONF.keystone.region_name:
                        urls[item.get("type")] = endpoint
        session = Session(id=token_id, urls=urls, token=token, tenant_id=tenant_id, user_id=user_id)
    except Exception as e:
        LOG.error(e)
        raise OpenStackException()
    return session


def __gen_header(method, token):
    hdr = {"Ecloud-Token": token}
    if method == "POST" or method == "PUT":
        hdr["Content-Type"] = "application/json"
    return hdr


@gen.coroutine
def connect_request(session, type, url, method, response_key=None,
                    body=None, body_producer=None, streaming_callback=None,
                    interface=INTF_TYPE_ADMIN, token=None,
                    content_length=None, request_timeout=600,
                    max_body_size=None,
                    content_type="application/json"):
    """
     请求openstack接口方法
    :param response_key:
    :param session:{'url':url,'token':token,'token_id':"uuid"}
    :param type 服务类型
    :param url: url参数
    :param method:
    :param body:
    :param content_type
    :return:
    :param interface: 接口类型 'admin' - default, 'public', 'internal'
    :param token: private token
    """

    token = token if token else session.id
    result = None
    intf_key = interface + 'URL'
    if type in session.urls and intf_key in session.urls[type]:
        service_url = session.urls[type][intf_key]
    else:
        raise OpenStackException()
    try:
        if body:
            body = json.dumps(body)
        req_url = service_url + url
        headers = {"X-Auth-Token": token, "Content-Type": content_type}
        if content_length:
            headers['Content-Length'] = str(content_length)
        req = HTTPRequest(url=req_url,
                          method=method,
                          body=body,
                          body_producer=body_producer,
                          streaming_callback=streaming_callback,
                          headers=headers,
                          connect_timeout=200,
                          request_timeout=request_timeout,
                          validate_cert=False)
        cli = AsyncHTTPClient()
        if max_body_size:
            cli.max_body_size = max_body_size
        rep = yield cli.fetch(req)
        if rep.body:
            result = json.loads(rep.body)
            if response_key:
                result = result[response_key]
    except Exception as e:
        LOG.error("request url [%s] body [%s] error %s", req_url, body, e.response.body)
        raise OpenStackException(e)
    raise gen.Return(result)


@gen.coroutine
def async_request(url, token, body, method):
    try:
        hdr = __gen_header(method, token)
        if body:
            str_body = json.dumps(body)
        else:
            str_body = None
        req = HTTPRequest(url=url,
                          method=method,
                          headers=hdr,
                          body=str_body,
                          connect_timeout=200,
                          request_timeout=600,
                          validate_cert=False)
        cli = AsyncHTTPClient()
        rep = yield cli.fetch(req)
        rs = json.loads(rep.body)
    except Exception, e:
        LOG.error("async_request failed: %s" % e)
        raise e
    raise gen.Return(rs)
