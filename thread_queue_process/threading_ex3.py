#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: threading_ex3.py
    @time: 2018/5/24 23:24
    @desc: 一次性创建若干个线程
"""

import threading
import time


def run(name):
    print("Running process [%s]......" % name)
    time.sleep(3)
    print("Process [%s] done." % name)


for i in range(100):
    t = threading.Thread(target=run, args=("t-%s" % str(i),))
    t.start()
