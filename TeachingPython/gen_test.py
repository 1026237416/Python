#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: gen_test.py
    @time: 2017/5/4 21:19
"""


def func(args):
    def inner():
        print("新添加功能！！！")
        args()
    return inner


@func
def test1():
    print "test1"


@func
def test2():
    print "test2"


test1()
test2()
