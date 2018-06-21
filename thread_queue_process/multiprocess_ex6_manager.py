#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: multiprocess_ex6_manager.py
    @time: 2018/5/27 13:49
    @desc: 进程间采用Manager的方式共享数据
           * manager.dict()
           * manager.list()
"""
from os import getpid, getppid
from multiprocessing import Process
from multiprocessing import Manager


def run(dic, lst):
    dic[getpid()] = getppid()

    lst.append(getpid())
    print(lst)


if __name__ == '__main__':
    with Manager() as manager:
        share_dict = manager.dict()
        share_list = manager.list(range(5))

        p_list = []
        for i in range(10):
            p = Process(target=run, args=(share_dict, share_list))
            p.start()
            p_list.append(p)

        for p in p_list:
            p.join()

    print(share_dict)
    print(share_list)


