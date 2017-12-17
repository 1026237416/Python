# -*- coding: utf-8 -*-
import logging
import time
from tornado import gen
from tornado.websocket import WebSocketHandler
from easted.compute.server import list_server
from common import start
import constance as _c
from easted import config

from easted.utils import RedisCache


__author__ = 'liping@easted.com.cn'

__all__ = [
    "ComputeHandler"
]
LOG = logging.getLogger("system")
CONF = config.CONF
_COMPUTE_CACHE = RedisCache("%s_vm" % CONF.keystone.region_name)


class ComputeHandler(WebSocketHandler):
    clients = set()
    running = None

    @staticmethod
    @gen.coroutine
    def run_compute_state(body):
        try:
            total = body.get("total")
            records = body.get("records")
            computes = yield list_server()
            response = {}
            result = {}
            for compute in computes:
                result[compute.get("name")] = {
                    "id":compute.get("id"),
                    "state":compute.get("state")
                }
            if total and total != len(computes):
                LOG.debug("current redis total is %s  list total is %s ", total, len(computes))
                response = "refresh"
            else:
                if records:
                    for k, v in result.items():
                        response[k] = v
                        if k in records and v == records.get(k):
                            response.pop(k)
            body = {
                "total": len(computes),
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
        if self not in ComputeHandler.clients:
            ComputeHandler.clients.add(self)
        LOG.debug("the client %s connected with compute socket", self.request.remote_ip)
        self.stream.set_nodelay(True)
        if not ComputeHandler.running:
            ComputeHandler.running = time.time()
            yield start(ComputeHandler, _COMPUTE_CACHE, _c.STATE_INTERVAL_TIME, ComputeHandler.run_compute_state)

    def on_message(self, message):
        pass

    def on_close(self):
        ComputeHandler.clients.remove(self)
        LOG.debug("the client %s connect with compute socket closed", self.request.remote_ip)
        if not ComputeHandler.clients:
            ComputeHandler.running = None
