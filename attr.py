#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: attr.py
    @time: 2018/3/5 22:50
"""


class Student():
    name = "xiaohua"

    def run(self):
        print "Hello world"

student = Student()

print hasattr(student, "name")
print hasattr(student, "run")
print hasattr(student, "age")

print getattr(student, "name")
print getattr(student, "run")()
print getattr(student, "age")
print getattr(student, "age", 18)

print hasattr(student, "age")
print setattr(student, "age", "18")
print hasattr(student, "age")