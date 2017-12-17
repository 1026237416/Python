#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: test4.py
    @time: 2017/5/5 22:41
"""


class Dog(object):
    def __init__(self, name):
        self.name = name

    @staticmethod
    def eat(x, s):
        print "%s is eating %s" % (x, s)


Dog.eat("df", "qwer")
dd = Dog("shit")
dd.eat("ss", "shit")
