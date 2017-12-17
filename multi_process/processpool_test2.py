#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: PyCharm
# @file: processpool_test2.py
# @time: 2017/11/15 21:52

import os
import time
import random
from multiprocessing import Pool


def run_task(name):
    print "Task %s (pid = %s) is running....." % (name, os.getpid())
    time.sleep(random.random() * 3)
    print "Task %s end." % name


if __name__ == '__main__':
    print "Current process %s." % os.getpid()

    p = Pool(processes=3)
    for i in range(5):
        p.apply(run_task, args=(i,))
    print "Waiting for all subprocesss done..."
    p.close()
    p.join()
    print "All processes done."
