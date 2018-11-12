#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @contact: qianyeliange@163.com
    @site: 
    @software: PyCharm
    @file: demo1.py
    @time: 2018/9/22 22:42
    @desc:
"""
import time

for i in range(0, 101, 2):
    time.sleep(0.1)
    char_num = i // 2
    per_str = "\r%s%%:%s\n" % (
        i, "*" * char_num) if i == 100 else "\r%s%%:%s" % (i, "*" * char_num)
    print(per_str, end="", flush=True)
