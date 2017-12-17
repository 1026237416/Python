#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: PyCharm
# @file: mutliprocess.py
# @time: 2017/11/14 23:11

import os
import time
from multiprocessing import Process


def run_proc(name):
    time.sleep(1)
    print("Child process %s (%s) are running......" % (name, os.getpid()))


if __name__ == '__main__':
    print("Parent process %s" % os.getpid())
    for i in range(15):
        p = Process(target=run_proc, args=(str(i),))
        print("Process will start")
        p.start()
    p.join()
    print "Process end"
