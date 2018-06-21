#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: queue_ex4_priorityQueue.py
    @time: 2018/5/25 23:16
    @desc: 带优先级的queue
"""

from queue import PriorityQueue

q = PriorityQueue()

q.put((10, "alex"))
q.put((15, "li"))
q.put((-1, "wang"))
q.put((2, "chen"))

print(q.get())
print(q.get())
print(q.get())
print(q.get())

