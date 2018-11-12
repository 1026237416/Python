#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @contact: qianyeliange@163.com
    @site: 
    @software: PyCharm
    @file: demo2.py
    @time: 2018/9/22 23:40
    @desc:
"""
import sys
import time

char = "="

if __name__ == '__main__':
    for i in range(1, 61):
        char += char
        print("\r" + str(int((i / 60) * 100)) + "% ||" + char + "->" + "\r", end="", flush=True)
        time.sleep(0.3)

    print()
