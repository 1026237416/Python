#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: watch_demo.py
    @time: 2018/8/9 15:45
"""
from kazoo.client import KazooClient
import time

import logging
logging.basicConfig()

zk = KazooClient(hosts='10.0.0.130:2181')
zk.start()

@zk.DataWatch("/path/to/watch")
def my_func(data, stat):
    if data:
        print "Data is %s" % data
        print "Version is %s" % stat.version
    else:
        print "data is not available"

while True:
    time.sleep(10)

zk.stop()
