# -*- coding: utf-8 -*-
import logging

import time
from tornado import gen
from tornado.websocket import WebSocketHandler
import constance as _c
from easted import config
from easted.volume.volumes import list_volume
from easted.utils import RedisCache
from common import start, remove_me

__author__ = 'liping@easted.com.cn'

__all__ = [
    "VolumeHandler"
]

CONF = config.CONF
_VOLUME_CACHE = RedisCache("%s_volume" % CONF.keystone.region_name)

LOG = logging.getLogger("system")


class VolumeHandler(WebSocketHandler):
    clients = set()
    redis_list = (_VOLUME_CACHE, )
    running = None

    @staticmethod
    @gen.coroutine
    def run_volume_state(body):
        try:
            total = body.get("total")
            records = body.get("records")
            volumes = yield list_volume()
            response = {}
            result = {}
            for vol in volumes:
                result[vol.get("name")] = {
                    "state": vol.get("status"),
                    "attachments": vol.get("attachments")
                }
            if total and total != len(volumes):
                LOG.debug("current redis total is %s  list total is %s ", total, len(volumes))
                response = "refresh"
            else:
                if records:
                    for k, v in result.items():
                        response[k] = v
                        if k in records and v == records.get(k):
                            response.pop(k)
            body = {
                "total": len(volumes),
                "records": result,
                "response": response,
                "type": "states"
            }
        except Exception, e:
            LOG.error("volume list socket monitor error %s", e)
        raise gen.Return(body)

    def data_received(self, chunk):
        pass

    @gen.coroutine
    def open(self):
        if self not in VolumeHandler.clients:
            VolumeHandler.clients.add(self)
        LOG.debug("the client %s connected with compute socket", self.request.remote_ip)
        self.stream.set_nodelay(True)
        if not VolumeHandler.running:
            VolumeHandler.running = time.time()
            yield start(VolumeHandler,  _VOLUME_CACHE, _c.STATE_INTERVAL_TIME, VolumeHandler.run_volume_state)

    def on_message(self, message):
        pass

    def on_close(self):
        remove_me(self)
        if not VolumeHandler.clients:
            VolumeHandler.running = None
