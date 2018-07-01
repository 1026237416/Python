#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: my_with.py
    @time: 2018/7/1 20:10
    @desc:
"""


class MyWith(object):
    def __enter__(self):
        print("enter")

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(self, exc_type, exc_val, exc_tb)
        print("Exit")


with MyWith():
    print("Body")

with MyWith():
    1 / 0
