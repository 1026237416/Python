#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: threading_ex5.py
    @time: 2018/5/24 23:52
    @desc: 1、获取线程的信息（ threading.current_thread()获取 ）
           2、获取当前进程中，活跃线程的个数（ 使用threading.active_count() ）
"""

import threading
import time


def run(name):
    print("Running process [%s]......In threading 【%s】" % (
        name, str(threading.current_thread())))
    time.sleep(3)
    print("Process [%s] done." % name)


for i in range(30):
    t = threading.Thread(target=run, args=("t-%s" % str(i),))
    t.start()

print("Current process has thread: %d" % threading.active_count())
print("All thread done. (In threading 【%s】)" % str(threading.current_thread()))
