#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @contact: qianyeliange@163.com
    @site: 
    @software: PyCharm
    @file: 装饰器版滚动求和.py
    @time: 2018/9/18 21:28
    @desc:
"""


def init(func):
    def inner(*args, **kwargs):
        g = func(*args, **kwargs)
        g.__next__()
        return g

    return inner


@init
def average():
    sum, count, avg = 0, 0, 0
    while True:
        num = yield avg
        sum += num
        count += 1
        avg = sum / count


avg_g = average()
for i in [10, 20, 30, 45, 50]:
    v = avg_g.send(i)
    print(v)
