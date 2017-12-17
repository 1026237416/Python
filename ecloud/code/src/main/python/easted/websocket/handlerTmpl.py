# -*- coding: utf-8 -*-
import json
import os
import time

from tornado import gen
from tornado.websocket import WebSocketHandler

__author__ = 'litao@easted.com.cn'
__all__ = [
    "HelloHandler"
]


class HelloHandler(WebSocketHandler):


    clients = set()
    running = False
    @staticmethod
    @gen.coroutine
    def run():
        while HelloHandler.clients:
            for c_item in HelloHandler.clients:
                c_item.write_message(json.dumps(time.time()))
            print "current pid is %s current message is %s clients num is %s"%(os.getpid(),time.time(),len(HelloHandler.clients))
            yield gen.sleep(10)


    def data_received(self, chunk):
        pass

    @gen.coroutine
    def open(self):
        print os.getpid()
        HelloHandler.clients.add(self)
        print self
        self.write_message(json.dumps({'input': 'connected...'}))
        self.stream.set_nodelay(True)
        if not HelloHandler.running:
            HelloHandler.running = True
            yield HelloHandler.run()

    def on_message(self, message):
        pass

    def on_close(self):
        HelloHandler.clients.remove(self)
        if not HelloHandler.clients:
            HelloHandler.running = False

