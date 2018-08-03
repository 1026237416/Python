#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: get_curr_time.py
    @time: 2018/7/31 14:33
"""
import time

now = time.time()

print(now, "seconds since", time.gmtime(0)[:6])
print("or in other words:")
print("- local time:", time.localtime(now))
print("- utc:", time.gmtime(now))
