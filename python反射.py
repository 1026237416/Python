#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: python反射.py
    @time: 2018/5/23 23:10
"""


class Dog(object):
    def __init__(self, name):
        self.name = name

    def eat(self, food):
        print("%s is eating %s" % (self.name, food))


def bulk(self):
    print("%s is bulking......" % self.name)


d = Dog("kitty")

choice = input(">>>:").strip()

if hasattr(d, choice):
    func = getattr(d, choice)
    func("shit")
else:
    setattr(d, choice, bulk)
    d.talk(d)
