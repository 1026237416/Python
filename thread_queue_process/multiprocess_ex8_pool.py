#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: multiprocess_ex8_pool.py
    @time: 2018/5/27 15:22
    @desc: 进程池来处理进程，包括回调函数
           主进程要先执行close再执行join
"""
from multiprocessing import Pool
from os import getpid
from time import sleep


def foo(i):
    sleep(2)
    print("In the process: %d" % getpid())
    return i + 100


def bar(arg):
    print("----> exec done:%s" % arg)


if __name__ == '__main__':
    sleep(5)
    pool = Pool(processes=5)
    print("Main process id: %d" % getpid())
    print("*******************************************************************")

    for i in range(23):
        pool.apply_async(func=foo, args=(i,), callback=bar)

    print("Main process finished!")
    pool.close()
    pool.join()

