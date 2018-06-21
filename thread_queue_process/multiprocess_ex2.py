#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: multiprocess_ex2.py
    @time: 2018/5/26 23:58
    @desc: 多进程，每个进程里再启动线程
"""
from multiprocessing import Process
from threading import Thread
from threading import get_ident
from time import sleep


def thread_run(name):
    print("Start run process threading 【%s】, Threading id: 【%s】" % (
        name, get_ident()))


def process_run(name):
    sleep(2)
    print("Start running process 【%s】......" % name)
    for i in range(3):
        t = Thread(target=thread_run, args=("%s-%d" % (name, i),))
        t.start()


if __name__ == '__main__':
    for i in range(5):
        p = Process(target=process_run, args=("P-%d" % i,))
        p.start()
