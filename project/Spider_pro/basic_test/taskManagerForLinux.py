#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: PyCharm
# @file: taskManagerForLinux.py
# @time: 2017/12/5 15:16

import random
import time
import Queue

from multiprocessing.managers import BaseManager

task_queue = Queue.Queue()
result_queue = Queue.Queue()


class QueueManager(BaseManager):
    pass


QueueManager.register("get_task_queue", callable=lambda:task_queue)
QueueManager.register("get_result_queue", callable=lambda:result_queue)

manager = QueueManager(address=("", 8001), authkey="qiye")
manager.start()
task = manager.get_task_queue()
result = manager.get_result_queue()

for url in ["imageUrl_" + str(i) for i in range(10)]:
    print "put task: %s ......" % url
    task.put(url)
print "Try get result......"
for i in range(10):
    print "result is %s" % result.get(timeout=10)

manager.shutdown()

