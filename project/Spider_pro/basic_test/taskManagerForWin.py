#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: PyCharm
# @file: taskManagerForWin.py
# @time: 2017/12/5 16:26

import Queue
from multiprocessing.managers import BaseManager
from multiprocessing import freeze_support

task_mumber = 10
task_queue = Queue.Queue(task_mumber)
result_queue = Queue.Queue(task_mumber)

def get_task():
    return task_queue

def get_result():
    return result_queue


class QueueManager(BaseManager):
    pass

def win_run():
    QueueManager.register("get_task_queue", callable=get_task)
    QueueManager.register("get_result_queue", callable=get_result)

    manager = QueueManager(address=("127.0.0.1", 8001), authkey="qiye")
    manager.start()

    try:
        task = manager.get_task_queue()
        result = manager.get_result_queue()

        for url in ["ImageUrl_" + str(i) for i in range(10)]:
            print "Put task %s ......" % url
            task.put(url)

        print "Try get result......"
        for i in range(10):
            print "Result is %s" % result.get(timeout=10)
    except:
        print "Manager Error!!!"
    finally:
        manager.shutdown() 

if __name__ == '__main__':
    freeze_support()
    win_run()

