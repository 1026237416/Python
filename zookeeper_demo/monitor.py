#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: monitor.py
    @time: 2018/8/9 15:20
"""
from kazoo.client import KazooClient

import time

import logging
logging.basicConfig()

zk = KazooClient(hosts='10.0.0.130:2181')
zk.start()

# Determine if a node exists
while True:
    if zk.exists("/test/failure_detection/worker"):
        print "the worker is alive!"
    else:
        print "the worker is dead!"
        break
    time.sleep(3)

zk.stop()
