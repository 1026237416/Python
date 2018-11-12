#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: namedtuple.py
    @time: 2018/9/16 23:10
    @desc:
"""
from collections import namedtuple

Instance = namedtuple("Instance", ["UUID", "name", "state"])

instance_1 = Instance("111", "linux", "on")

print(instance_1.name)
print("***********************************************")


def add_instance_data():
    for i in range(100, 110):
        yield Instance(i, str(i), "on")


instances = add_instance_data()
for instance in instances:
    print(instance.name)
