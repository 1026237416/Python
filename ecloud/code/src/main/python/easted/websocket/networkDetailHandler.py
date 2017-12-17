# -*- coding: utf-8 -*-
import json
import logging

import time
from tornado import gen
from tornado.websocket import WebSocketHandler

from easted.network.networkhost import get_network_hosts
from easted.host import list_simple_hosts
from easted.network.networkdao import get_network_db
import constance as _c
from easted import config
from easted.utils import RedisCache
from common import start, set_cache, remove_me

__author__ = 'liping@easted.com.cn'
LOG = logging.getLogger("system")

__all__ = [
    "NetworkDetailHandler"
]

CONF = config.CONF

_NETWORK_DETAIL_CACHE = RedisCache("%s_network_detail" % CONF.keystone.region_name)
_NETWORK_HOSTS_CACHE = RedisCache("%s_network_hosts" % CONF.keystone.region_name)


class NetworkDetailHandler(WebSocketHandler):
    clients = list()
    redis_list = (_NETWORK_DETAIL_CACHE, _NETWORK_HOSTS_CACHE)
    running = None

    @staticmethod
    @gen.coroutine
    def handle():
        start(NetworkDetailHandler, _NETWORK_DETAIL_CACHE, _c.STATE_INTERVAL_TIME,
              NetworkDetailHandler.run_net_hosts)
        start(NetworkDetailHandler, _NETWORK_HOSTS_CACHE, _c.STATE_INTERVAL_TIME,
              NetworkDetailHandler.run_net_detail)

    @staticmethod
    @gen.coroutine
    def run_net_hosts(body):
        try:
            records = body.get("records", {})
            totals = body.get("total", {})
            result = {}

            for net_id in records.keys():
                try:
                    hosts = yield NetworkDetailHandler._net_vms(net_id)
                except BaseException:
                    continue
                if totals and totals.get(net_id) != len(hosts.keys()):
                    LOG.debug("current redis total is %s  list total is %s ", totals.get(net_id), len(hosts.keys()))
                    result[net_id] = "refresh"
                else:
                    result[net_id] = hosts
                totals[net_id] = len(hosts.keys())

            response = {}
            for k, v in result.items():
                response[k] = v
                if not records.keys() or records.get(k) == v:
                    response.pop(k)

            body = {
                "total": totals,
                "records": result,
                "response": response,
                "type": "vms"
            }
        except Exception, e:
            LOG.error("host detail vms handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def _net_vms(net_id):
        hosts = yield get_network_hosts(vlan_id=net_id)
        result = {}
        if hosts:
            hosts_info = yield list_simple_hosts(host_id=hosts)
            for host in hosts_info:
                result[str(host.get("id"))] = host.get("state")
        raise gen.Return(result)

    @staticmethod
    @gen.coroutine
    def run_net_detail(body):
        try:
            records = body.get("records", {})
            result = {}
            for net_id in records.keys():
                try:
                    info = yield get_network_db(net_id)
                    status = info[0].get("status") if info else "quit"
                    result[net_id] = status
                except BaseException:
                    continue

            response = {}
            for k, v in result.items():
                response[k] = v
                if not records.keys() or records.get(k) == v:
                    response.pop(k)
            body = {
                "total": 0,
                "records": result,
                "response": response,
                "type": "state"
            }
        except Exception as e:
            raise e
        raise gen.Return(body)

    def data_received(self, chunk):
        pass

    @gen.coroutine
    def open(self):
        self.stream.set_nodelay(True)

    @gen.coroutine
    def on_message(self, message):

        message = json.loads(message)
        cli = {
                "target": self,
                "chart": None,
                "id": message["id"]
            }
        self.clients.append(cli)
        if not self.running:
            NetworkDetailHandler.running = time.time()
            yield self.handle()

    def on_close(self):
        remove_me(self)
        if not self.clients:
            NetworkDetailHandler.running = None

