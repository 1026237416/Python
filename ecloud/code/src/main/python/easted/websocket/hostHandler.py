# -*- coding: utf-8 -*-
import logging

import time
from tornado import gen
from tornado.websocket import WebSocketHandler
import constance as _c
from easted import config
from easted.host import list_simple_hosts
from easted.utils import RedisCache
from common import start

__author__ = 'litao@easted.com.cn'

__all__ = [
    "HostHandler"
]

LOG = logging.getLogger("system")
CONF = config.CONF
_HOST_CACHE = RedisCache("%s_host" % CONF.keystone.region_name)


class HostHandler(WebSocketHandler):
    clients = set()
    running = False

    @staticmethod
    @gen.coroutine
    def run_host_state(body):
        try:
            total = body.get("total")
            records = body.get("records")
            hosts = yield list_simple_hosts()
            response = {}
            result = {}
            for host in hosts:
                result[host.get("id")] = host.get("state")
            if total and total != len(hosts):
                LOG.debug("current redis total is %s  list total is %s ", total, len(hosts))
                response = "refresh"
            else:
                if records:
                    for k, v in result.items():
                        response[k] = v
                        if str(k) in records and v == records.get(str(k)):
                            response.pop(k)
            body = {
                "total": len(hosts),
                "records": result,
                "response": response,
                "type": "states"
            }
        except Exception, e:
            LOG.error("compute list socket monitor error %s", e)
        raise gen.Return(body)

    def data_received(self, chunk):
        pass

    @gen.coroutine
    def open(self):
        LOG.debug("the client %s connected with compute socket", self.request.remote_ip)
        if self not in HostHandler.clients:
            HostHandler.clients.add(self)
        self.stream.set_nodelay(True)
        if not self.running:
            HostHandler.running = time.time()
            start(HostHandler, _HOST_CACHE, _c.STATE_INTERVAL_TIME, HostHandler.run_host_state)

    def on_message(self, message):
        pass

    def on_close(self):
        LOG.debug("the client %s connect with compute socket closed", self.request.remote_ip)
        self.clients.remove(self)
        if not self.clients:
            HostHandler.running = None
