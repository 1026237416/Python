#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @contact: qianyeliange@163.com
    @site: 
    @software: PyCharm
    @file: 滚动求和.py
    @time: 2018/9/18 21:19
    @desc:
"""


def average():
    sum, count, avg = 0, 0, 0
    while True:
        num = yield avg
        sum += num
        count += 1
        avg = sum / count


avg_g = average()
avg_g.__next__()
for i in [10, 20, 30, 45, 50]:
    v = avg_g.send(i)
    print(v)
