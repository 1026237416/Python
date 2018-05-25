#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: threading_ex1.py
    @time: 2018/5/24 22:43
    @desc: 多线程的第一个实例，验证多线程的并行执行
"""

import threading
import time


def run(name):
    print("Running process [%s]......" % name)
    time.sleep(3)
    print("Process [%s] done." % name)


t1 = threading.Thread(target=run, args=("t1",))
t2 = threading.Thread(target=run, args=("t2",))
t1.start()
t2.start()

time.sleep(10)
print("-----------------------------------------------------------------------")
run("t1")
run("t2")
