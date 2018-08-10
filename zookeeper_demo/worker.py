#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: worker.py
    @time: 2018/8/9 15:05
"""
import time
import logging

from kazoo.client import KazooClient

logging.basicConfig()

zk = KazooClient(hosts='10.0.0.130:2181')
zk.start()

# Ensure a path, create if necessary
zk.ensure_path("/test/failure_detection")

# Create a node with data
zk.create("/test/failure_detection/worker",
          value=b"a test value", ephemeral=True)

while True:
    print "I am alive!"
    time.sleep(3)

zk.stop()
