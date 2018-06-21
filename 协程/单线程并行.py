#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: 单线程并行.py
    @time: 2018/5/23 19:47
"""

import time


def consumer(name):
    print("%s 来到包子店，开始准备吃包子！" % name)
    while True:
        cook = yield
        print("第【%s】个包子来了，被【%s】吃了！" % (cook, name))


def producer(name, consumers=None):
    consumer_list = []
    if consumers:
        for consumer_name in consumers:
            consumer_list.append(consumer(consumer_name))
            consumer_list[-1].__next__()

        print("有客人来了，【%s】开始做包子喽……" % name)
        for i in range(1, 11):
            time.sleep(1)
            print("第【%s】份包子做好了，上包子了……" % i)
            for consumer_user in consumer_list:
                consumer_user.send(i)


user = ["li", "zhang", "wang", "zhao", "qian", "sun", "zhu","you", "xu", "he"]

producer(name="Alex", consumers=user)
