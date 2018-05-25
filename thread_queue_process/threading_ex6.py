#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: threading_ex6.py
    @time: 2018/5/25 0:08
    @desc: 设置守护线程（默认进程会等待所有的线程都执行结束后才会退出，
           但是进程不会等待守护线程的执行结束，当所有非守护线程执行结束后，立即退出）
           使用【t.setDaemon(True)】来设置线程为守护线程
"""
import threading
import time


def run(name):
    print("Running process [%s]......" % name)
    time.sleep(10)
    print("Process [%s] done." % name)


threading_pool = []
for i in range(3):
    t = threading.Thread(target=run, args=("t-%s" % str(i),))
    t.setDaemon(True)
    t.start()
    threading_pool.append(t)

