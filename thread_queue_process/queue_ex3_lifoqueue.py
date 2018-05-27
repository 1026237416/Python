#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: queue_ex3_lifoqueue.py
    @time: 2018/5/25 23:14
    @desc: 后入先出队列
"""

from queue import LifoQueue

q = LifoQueue()

q.put("d1")
q.put("d2")
q.put("d3")

print(q.get())
print(q.get())


