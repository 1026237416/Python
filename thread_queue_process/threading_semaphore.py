#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: threading_semaphore.py
    @time: 2018/5/25 15:11
    @desc:
"""

import threading
import time


def run(n):
    semaphore.acquire()
    time.sleep(1)
    print("Start run thread: %d \n" % n)
    semaphore.release()


if __name__ == '__main__':
    semaphore = threading.BoundedSemaphore(5)

    for i in range(27):
        t = threading.Thread(target=run, args=(i,))
        t.start()

    while threading.active_count() != 2:
        pass
    else:
        print("------all threading finished!---------")
