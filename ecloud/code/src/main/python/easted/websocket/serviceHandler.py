# -*- coding: utf-8 -*-
import logging
import json

import time
from tornado import gen
from tornado.websocket import WebSocketHandler
from easted.service.service import list_openstack_service

import constance as _c
from easted import config
from easted.utils import RedisCache
from common import start, remove_me

__author__ = 'liping@easted.com.cn'

__all__ = [
    "ServiceHandler"
]

LOG = logging.getLogger("system")
CONF = config.CONF
_SERVICE_CACHE = RedisCache("%s_service" % CONF.keystone.region_name)


class ServiceHandler(WebSocketHandler):
    clients = list()
    redis_list = (_SERVICE_CACHE, )
    running = None

    @staticmethod
    @gen.coroutine
    def run_sign_services(body):
        try:
            records = body.get("records") if body.get("records") else {}
            totals = body.get("total") if body.get("total") else {}
            result = {}
            response = {}

            for sign_id in records.keys():
                services = yield ServiceHandler._sign_services(sign_id)
                if totals.get(sign_id) and totals.get(sign_id) != len(services.keys()):
                    LOG.debug("current redis total is %s  list total is %s ", totals.get(sign_id),
                              len(services.keys()))
                    response[sign_id] = "refresh"
                else:
                    result[sign_id] = services
                    totals[sign_id] = len(services.keys())

                    res = {}
                    for k, v in result[sign_id].items():
                        res[k] = v
                        if not records[sign_id] or (k in records[sign_id] and v == records[sign_id].get(k)):
                            res.pop(k)
                    response[sign_id] = res

            body = {
                "total": totals,
                "records": result,
                "response": response,
                "type": "state"
            }
        except Exception, e:
            LOG.error("host detail vms handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def _sign_services(sign):
        services = yield list_openstack_service(sign)
        LOG.debug("Get flag %s service result is: %s", sign, services)
        result = {}
        for service in services:
            result[service.get("name") + "#" + service.get("host")] = service.get("status")
        LOG.debug("Get flag %s service result is: %s", sign, result)
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
        for cli in ServiceHandler.clients:
            if self is cli["target"]:
                cli["id"] = str(t_id)
                flag = False
                break
        if flag:
            client_info = {
                "target": self,
                "id": str(t_id)
            }
            ServiceHandler.clients.append(client_info)

        if not ServiceHandler.running:
            ServiceHandler.running = time.time()
            yield start(ServiceHandler, _SERVICE_CACHE, _c.STATE_INTERVAL_TIME, ServiceHandler.run_sign_services)

    def on_close(self):
        remove_me(self)
        if not ServiceHandler.clients:
            ServiceHandler.running = None
