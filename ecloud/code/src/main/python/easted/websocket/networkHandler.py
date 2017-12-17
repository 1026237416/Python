# -*- coding: utf-8 -*-
import logging
import time
from tornado import gen
from tornado.websocket import WebSocketHandler
from easted.network.network import list_network
import constance as _c
from easted import config
from easted.utils import RedisCache
from common import start

__author__ = 'liping@easted.com.cn'

__all__ = [
    "NetworkHandler"
]

LOG = logging.getLogger("system")
CONF = config.CONF
_NETWORK_CACHE = RedisCache("%s_network" % CONF.keystone.region_name)


class NetworkHandler(WebSocketHandler):
    clients = set()
    running = None

    @staticmethod
    @gen.coroutine
    def run_net_state(body):
        try:
            total = body.get("total")
            records = body.get("records")
            networks = yield list_network()
            response = {}
            result = {}
            for net in networks:
                result[net.get("id")] = net.get("status")
            if total and total != len(networks):
                LOG.debug("current redis total is %s  list total is %s ", total, len(networks))
                response = "refresh"
            else:
                if records:
                    for k, v in result.items():
                        response[k] = v
                        if k in records and v == records.get(k):
                            response.pop(k)
            body = {
                "total": len(networks),
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
        if self not in NetworkHandler.clients:
            NetworkHandler.clients.add(self)
        LOG.debug("the client %s connected with compute socket", self.request.remote_ip)
        self.stream.set_nodelay(True)
        if not NetworkHandler.running:
            NetworkHandler.running = time.time()
            yield start(NetworkHandler, _NETWORK_CACHE, _c.STATE_INTERVAL_TIME, NetworkHandler.run_net_state)

    def on_message(self, message):
        pass

    def on_close(self):
        NetworkHandler.clients.remove(self)
        LOG.debug("the client %s connect with compute socket closed", self.request.remote_ip)
        if not NetworkHandler.clients:
            NetworkHandler.running = None
