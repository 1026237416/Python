#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: threading_ex2.py
    @time: 2018/5/24 22:55
    @desc: 类的形式来启动线程
"""

import threading


class MyThread(threading.Thread):
    def __init__(self, name):
        super(MyThread, self).__init__()
        self.name = name

    def run(self):
        print("Running task: %s" % self.name)


t1 = MyThread("t1")
t2 = MyThread("t2")
t1.start()
t2.start()
