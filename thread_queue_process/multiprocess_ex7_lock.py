#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: multiprocess_ex7_lock.py
    @time: 2018/5/27 14:13
    @desc: 进程锁进制
"""

from multiprocessing import Process
from multiprocessing import Lock


def run(lock, num):
    lock.acquire()
    print("From process [%d] print!    " % num * 100)
    lock.release()


if __name__ == '__main__':
    l = Lock()
    for i in range(30):
        p = Process(target=run, args=(l, i))
        p.start()
