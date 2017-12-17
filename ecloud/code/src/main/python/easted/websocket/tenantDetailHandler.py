# -*- coding: utf-8 -*-
import json
import logging

import time
from tornado import gen
from tornado.websocket import WebSocketHandler

from easted.host.host import list_simple_hosts
from easted.network.tenant_host import get_tenant_hosts

import constance as _c
from easted import config
from easted.utils import RedisCache
from common import start, remove_me

__author__ = 'liping@easted.com.cn'
__all__ = [
    "TenantDetailHandler"
]

CONF = config.CONF
LOG = logging.getLogger("system")

_TENANT_DETAIL_CACHE = RedisCache("%s_tenant_detail" % CONF.keystone.region_name)


class TenantDetailHandler(WebSocketHandler):
    clients = list()
    redis_list = (_TENANT_DETAIL_CACHE,)
    running = None

    @staticmethod
    @gen.coroutine
    def handle():
        start(TenantDetailHandler, _TENANT_DETAIL_CACHE, _c.STATE_INTERVAL_TIME,
              TenantDetailHandler.run_tenant_hosts)

    @staticmethod
    @gen.coroutine
    def run_tenant_hosts(body):
        try:
            records = body.get("records") if body.get("records") else {}
            totals = body.get("total") if body.get("total") else {}
            result = {}
            response = {}

            for tenant_id in records.keys():
                try:
                    hosts = yield TenantDetailHandler._tenant_vms(tenant_id)
                except BaseException:
                    continue
                if totals.get(tenant_id) and totals.get(tenant_id) != len(hosts.keys()):
                    LOG.debug("current redis total is %s  list total is %s ", totals.get(tenant_id), len(hosts.keys()))
                    result[tenant_id] = "refresh"
                else:
                    result[tenant_id] = hosts
                totals[tenant_id] = len(hosts.keys())

            for k, v in result.items():
                response[k] = v
                if not records.keys() or records.get(k) == v:
                    response.pop(k)

            body = {
                "total": totals,
                "records": result,
                "response": response,
                "type": "hosts"
            }
            LOG.debug("body is %s", body)
        except Exception, e:
            LOG.error("Get tenant host status info error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def _tenant_vms(t_id):
        hosts = yield get_tenant_hosts(tenant_id=t_id)
        hosts_info = yield list_simple_hosts(host_id=hosts)
        LOG.debug(hosts_info)
        result = {}
        for host in hosts_info:
            result[str(host.get("id"))] = host.get("state")
        LOG.debug(result)
        raise gen.Return(result)

    def data_received(self, chunk):
        pass

    @gen.coroutine
    def open(self):
        self.stream.set_nodelay(True)

    @gen.coroutine
    def on_message(self, message):
        LOG.debug("the client %s connected with compute socket", self.request.remote_ip)
        message = json.loads(message)
        LOG.debug("the message is %s", message)
        try:
            t_id = message.get("id")
        except Exception, e:
            LOG.error(e)
        flag = True
        for cli in TenantDetailHandler.clients:
            if self is cli["target"]:
                cli["id"] = t_id
                flag = False
                break
        if flag:
            cli = {
                "target": self,
                "id": t_id
            }
            TenantDetailHandler.clients.append(cli)
            LOG.debug("the cli is %s", cli)

        if not TenantDetailHandler.running:
            TenantDetailHandler.running = time.time()
            yield TenantDetailHandler.handle()

    def on_close(self):
        remove_me(self)
        if not TenantDetailHandler.clients:
            TenantDetailHandler.running = None
