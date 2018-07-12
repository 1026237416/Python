#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: 自定义异常.py
    @time: 2018/5/23 23:36
"""


class MyException(Exception):
    def __init__(self, msg):
        self.msg = msg

    def __str__(self):
        return self.msg



try:
    raise MyException("Con not connection database")
except MyException as e:
    print(e)


v = dict.fromkeys(['k1', 'k2'], [])
v["k1"].append(666)
print(v)
v["k1"] = 777
print(v)

{'k2': [666], 'k1': [666]}
{'k2': [666, 777], 'k1': [666, 777]}

