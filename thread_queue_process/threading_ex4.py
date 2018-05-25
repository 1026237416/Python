#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: threading_ex4.py
    @time: 2018/5/24 23:44
    @desc: 计算所有线程总共运行时间（t.join()）
"""

import threading
import time

start_time = time.time()


def run(name):
    print("Running process [%s]......" % name)
    time.sleep(3)
    print("Process [%s] done." % name)


threading_pool = []
for i in range(3):
    t = threading.Thread(target=run, args=("t-%s" % str(i),))
    t.start()
    threading_pool.append(t)

for t in threading_pool:
    t.join()

print("All thread done.")
print("Const times: %s" % str(time.time() - start_time))
