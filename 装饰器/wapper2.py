#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: wapper2.py
    @time: 2018/6/26 23:02
    @desc:
"""

import functools
from flask import flash


def wapper(func):
    def inner(*args, **kwargs):
        return func(*args, **kwargs)
    return inner


def wapper2(func):
    @functools.wraps(func)
    def inner(*args, **kwargs):
        return func(*args, **kwargs)
    return inner


def f1():
    pass


@wapper
def f2():
    pass


@wapper2
def f3():
    pass


print(f1.__name__)
print(f2.__name__)
print(f3.__name__)

open()