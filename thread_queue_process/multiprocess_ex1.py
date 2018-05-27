#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: multiprocess_ex1.py
    @time: 2018/5/26 12:31
    @desc: 初探多进程
"""

import multiprocessing
from time import sleep


def run(name):
    print("Start run process [%s], process id: [%s]" % (name, "s"))
    sleep(2)
    print("Process running finished.")


if __name__ == '__main__':
    p = multiprocessing.Process(target=run, args=("1111",))
    p.start()
