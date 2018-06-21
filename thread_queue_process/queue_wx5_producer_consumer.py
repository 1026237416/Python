#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: queue_wx5_producer_consumer.py
    @time: 2018/5/25 23:23
    @desc: 使用生产者和消费者的关系来演示队列
"""

from queue import Queue
from time import sleep
from threading import Thread

q = Queue(maxsize=10)


def producer(name):
    count = 1
    while True:
        q.put("包子%d" % count)
        print("【%s】生产了【%d】个包子......" % (name, count))
        count += 1
        sleep(0.1)


def consumer(name):
    while True:
        print("[%s]发现有包子，取到了包子【%s】，开始吃......" % (name, q.get()))
        sleep(0.2)


p = Thread(target=producer, args=("李",))
c1 = Thread(target=consumer, args=("alex",))
c2 = Thread(target=consumer, args=("chen",))
c3 = Thread(target=consumer, args=("liu",))
p.start()
c1.start()
c2.start()
c3.start()
