#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: context.py
    @time: 2018/7/1 20:17
    @desc:
"""
import contextlib


@contextlib.contextmanager
def my_context():
    print("Before")
    yield "xxx"
    print("After")


with my_context() as x:
    print("Run code", "x=%s" % x)
