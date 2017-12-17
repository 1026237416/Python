#!/usr/bin/env python
# -*- coding: utf-8 -*-

import importlib
import logging
import os
import sys

import tornado.ioloop
from tornado import web
from tornado.httpserver import HTTPServer

import easted.log as log
from easted import config
from easted.core import dbpools
from easted.core import openstack
from easted.core import rest
from easted.core import sequence
from easted.log.conf import ECLOUD_SERVER_LOG_CONF
from easted.websocket import DashBoardHandler, HostDetailHandler
from easted.websocket import HostHandler, VolumeHandler, ComputeHandler, ImageHandler, NetworkHandler, ServiceHandler, \
    NetworkDetailHandler, ComputeDetailsHandler, SnapshotHandler, TenantDetailHandler
from manor import launch as manor_launch
from manor.handler.cli import ManorHandler
from manor.handler.message_info import MessageInfoHandler
from manor.monitor import MonitorHandler

__author__ = 'gavin'

config.register("web_root", "../web")
config.register("cert_dir", "../etc")
config.register("port", "8443")
config.register(name="multiprocess", setting_type=config.TYPE_INT,
                default=None, secret=True)
config.register(name="debug", setting_type=config.TYPE_BOOL,
                default=True, secret=True)

CONF = config.CONF
os.chdir(sys.path[0])
LOG = logging.getLogger("system")
try:
    log.init(ECLOUD_SERVER_LOG_CONF)
    manor_launch.init()

    print "Start the easted service..."

    service_modules = [r for r in map(lambda x: x.split('.')[0], os.listdir('./easted/ws')) if
                       r != '__init__']
    service_modules = list(set(service_modules))

    modules = []
    for m in service_modules:
        modules.append(importlib.import_module('easted.ws.' + m).Service)

    modules = manor_launch.add_handler(modules)

    settings = {
        'debug': CONF.debug,
        'gzip': True,
        'autoreload': CONF.multiprocess is None,
        'autoescape': None
    }

    handlers = [
        (r"/web/(.*)", web.StaticFileHandler, {"path": CONF.web_root}),
        (r"/", web.RedirectHandler, dict(url=r"/web/login.html")),
        (r"/socket/dashboard", DashBoardHandler),
        (r"/socket/compute", ComputeHandler),
        (r"/socket/compute/detail", ComputeDetailsHandler),
        (r"/socket/host", HostHandler),
        (r"/socket/host/detail", HostDetailHandler),
        (r"/socket/image", ImageHandler),
        (r"/socket/network", NetworkHandler),
        (r"/socket/network/detail", NetworkDetailHandler),
        (r"/socket/volume", VolumeHandler),
        (r"/socket/service", ServiceHandler),
        (r"/socket/snapshot", SnapshotHandler),
        (r"/socket/tenant/detail", TenantDetailHandler),
        (r"/manor/cli/(.*)", ManorHandler),
        (r"/manor/socket/app/status", MonitorHandler),
        (r"/manor/socket/app/message", MessageInfoHandler)
    ]
    application = rest.RestService(modules, **settings)
    application.add_handlers(r".*", handlers)
    server = HTTPServer(application, ssl_options={
        "certfile": os.path.join(os.path.abspath(CONF.cert_dir), "server.crt"),
        "keyfile": os.path.join(os.path.abspath(CONF.cert_dir), "server.key"),
    })

    server.bind(CONF.port)
    if CONF.multiprocess is None:
        server.start()
    else:
        server.start(CONF.multiprocess)

    dbpools.init()
    openstack.init()
    sequence.register('vm-sequence', seq_max=9999)
    sequence.register("volume-sequence", seq_max=9999)
    _ioLoop = tornado.ioloop.IOLoop.instance()
    manor_launch.add_periodic()
    _ioLoop.start()
except KeyboardInterrupt:
    print "Stop the easted service..."
    tornado.ioloop.IOLoop.instance().stop()
    sys.exit(-1)
