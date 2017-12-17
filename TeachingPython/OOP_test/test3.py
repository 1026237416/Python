#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: test3.py
    @time: 2017/5/4 23:40
"""


class People(object):
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def eat(self):
        print("%s eating %s" % (self.name, self.age))

    def sleep(self):
        print("%s sleep %s" % (self.name, self.age))


class Relation(object):
    def make_friends(self, obj):
        print("%s 跟 %s 交朋友" % (self.name, obj.name))


class Man(People, Relation):
    def __init__(self, name, age, menoy):
        super(Man, self).__init__(name, age)
        self.money = menoy

    def write_code(self):
        print("name:%s write code %s行 " % (self.name, self.age))

    def eat(self):
        People.eat(self)
        print("eating.........")


class Woman(People, Relation):
    def shopping(self):
        print("name:%s go shopping %s 件 " % (self.name, self.age))


m1 = Man("zhangsan", 33, 10000)
w1 = Woman("lisi", 23)
m1.make_friends(w1)
