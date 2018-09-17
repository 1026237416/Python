#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: tail.py
    @time: 2018/9/16 22:35
    @desc:
"""


def tail(filename):
    f = open(file="test", encoding="utf-8")
    while True:
        line = f.readline()
        if line:
            print(line.strip())


tail("test")
