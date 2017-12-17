#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: time1.py
    @time: 2017/4/23 11:17
"""

import time
import datetime

print time.time()
print time.mktime(time.localtime())

print time.gmtime()
print time.localtime()
# print time.strftime("2017-04-23", "%Y-%m-%d")

print time.strftime("%Y-%m-%d")
print time.strftime("%Y-%m-%d", time.localtime())

print time.asctime()
print time.asctime(time.localtime())
print time.ctime(time.time())

