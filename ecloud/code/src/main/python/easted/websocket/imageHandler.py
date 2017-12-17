# -*- coding: utf-8 -*-
import logging

import time
from tornado import gen
from tornado.websocket import WebSocketHandler

from easted import config
from easted.image import list_images
from easted.utils import RedisCache
from common import start
import constance as _c

__author__ = 'baichenxu@easted.com.cn'

__all__ = [
    "ImageHandler"
]

LOG = logging.getLogger("system")
CONF = config.CONF
_IMAGE_CACHE = RedisCache("%s_image" % CONF.keystone.region_name)


class ImageHandler(WebSocketHandler):
    clients = set()
    running = False

    @staticmethod
    @gen.coroutine
    def run_image_state(body):
        try:
            total = body.get("total")
            records = body.get("records")
            images = yield list_images()
            response = {}
            result = {}
            for image in images:
                result[image.get("id")] = image.get("status")
            if total and total != len(images):
                LOG.debug("current redis total is %s  list total is %s ", total, len(images))
                response = "refresh"
            else:
                if records:
                    for k, v in result.items():
                        response[k] = v
                        if k in records and v == records.get(k):
                            response.pop(k)
            body = {
                "total": len(images),
                "records": result,
                "response": response,
                "type": "states"
            }
        except Exception, e:
            LOG.error("images list socket monitor error %s", e)
        raise gen.Return(body)

    def data_received(self, chunk):
        pass

    @gen.coroutine
    def open(self):
        LOG.debug("the client %s connected with compute socket", self.request.remote_ip)
        if self not in ImageHandler.clients:
            ImageHandler.clients.add(self)
        self.stream.set_nodelay(True)
        if not ImageHandler.running:
            ImageHandler.running = time.time()
            yield start(ImageHandler, _IMAGE_CACHE, _c.STATE_INTERVAL_TIME, ImageHandler.run_image_state)

    def on_message(self, message):
        pass

    def on_close(self):
        LOG.debug("the client %s connect with compute socket closed", self.request.remote_ip)
        ImageHandler.clients.remove(self)
        if not ImageHandler.clients:
            ImageHandler.running = None
