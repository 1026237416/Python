#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: monitor_file.py
    @time: 2018/9/16 22:28
    @desc:
"""
f = open(file="test", encoding="utf-8")

while True:
    line = f.readline()
    if line:
        print(line)
