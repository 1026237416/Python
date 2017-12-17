#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: ??
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: filter_test.py
    @time: 2017/4/6 22:44
"""

lis = [11, 22, 33, 44, 21, 45, 41]

print filter(lambda a: a > 33, lis)


def func(arg):
    if arg > 22:
        return arg


print filter(func, lis)


def func2(arg):
    return arg + 10


print map(func2, lis)

list1 = [11, 22, 33, 44]
list2 = [14, 25, 36, 47]
list3 = [74, 85, 96, 41]


def func3(a, b, c):
    return a + b + c


print map(func3, list1, list2, list3)
print map(lambda a, b, c: a + b + c, list1
          , list2, list3)
