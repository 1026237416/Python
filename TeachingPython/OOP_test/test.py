#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: test.py
    @time: 2017/5/4 23:16
"""


class People(object):
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def eat(self):
        print("%s eating %s" % (self.name, self.age))

    def sleep(self):
        print("%s sleep %s" % (self.name, self.age))


class Man(People):
    def Write_code(self):
        print("name: %s write code %s 行" % (self.name, self.age))

    def eat(self):
        People.eat(self)
        print("eating.........")


class Women(People):
    def shopping(self):
        print("name: %s go shopping %s" % (self.name, self.age))


m1 = Man("zhengsan", 33)
m1.eat()
m1.Write_code()

w1 = Women("lisi", 25)
w1.shopping()
