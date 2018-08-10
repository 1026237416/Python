#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: lock.py
    @time: 2018/8/9 15:36
"""
import time
import uuid
import logging

from kazoo.client import KazooClient

logging.basicConfig()
my_id = uuid.uuid4()


def work():
    print("{} is working! ".format(str(my_id)))


zk = KazooClient(hosts="10.0.0.130:2181")
zk.start()

lock = zk.Lock("/lockpath", str(my_id))
print "I am {}".format(str(my_id))

while True:
    with lock:
        work()
    time.sleep(3)

zk.ztop()
