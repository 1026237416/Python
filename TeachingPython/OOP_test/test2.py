#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: test2.py
    @time: 2017/5/4 23:28
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
    def __init__(self, name, age, money):
        People.__init__(self, name, age)
        self.money = money
        print("name ：%s age ：%s %s元" % (self.name, self.age, self.money))

    def Write_code(self):
        print("name:%s write code %s行 " % (self.name, self.age))

    def eat(self):
        People.eat(self)
        print("eating.........")


class Women(People):
    def shopping(self):
        print("name:%s go shopping %s 件 " % (self.name, self.age))


m1 = Man("zhangsan", 33, 10000)
m1.eat()
w1 = Women("lisi", 23)
w1.shopping()
