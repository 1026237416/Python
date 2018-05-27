#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: multiprocess_ex4_queue.py
    @time: 2018/5/27 11:39
    @desc: 进程间使用QUEUE通信
"""
from multiprocessing import Process
from multiprocessing import Queue


def run(queue):
    queue.put([42, None, "hello"])


if __name__ == '__main__':
    q = Queue()
    p = Process(target=run, args=(q,))
    p.start()
    print(q.get())
