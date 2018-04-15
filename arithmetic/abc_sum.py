#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: abc_sum.py
    @time: 2018/4/14 17:10
"""

import time

max_num = 1000


def func1():
    start_time = time.time()
    for a in range(max_num + 1):
        for b in range(max_num + 1):
            for c in range(max_num + 1):
                if a + b + c == max_num and a ** 2 + b ** 2 == c ** 2:
                    print("a, c, c:%d %d %d" % (a, b, c))
    end_time = time.time()

    print("Using time: %d" % (end_time - start_time))
    print("Finished!")


def func2():
    start_time = time.time()
    for a in range(1001):
        for b in range(1001):
            c = max_num - a - b
            if a ** 2 + b ** 2 == c ** 2:
                print("a, c, c:%d %d %d" % (a, b, c))
    end_time = time.time()

    print("Using time: %d" % (end_time - start_time))
    print("Finished!")


if __name__ == '__main__':
    func2()
