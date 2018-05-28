#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: coroutine_ex1.py
    @time: 2018/5/27 20:32
    @desc: 使用greenlet实现协程的手动切换
"""
from greenlet import greenlet


def run1():
    print(12)
    gr2.switch()
    print(34)
    gr2.switch()


def run2():
    print(56)
    gr1.switch()
    print(78)


if __name__ == '__main__':
    gr1 = greenlet(run1)
    gr2 = greenlet(run2)
    gr1.switch()
