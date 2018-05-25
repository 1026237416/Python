#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: queue_ex1.py
    @time: 2018/5/25 22:37
    @desc: 消息队列初探
           *************************************************************
           先入先出消息队列：
           * msg_queue = queue.Queue()对队列进行初始化,maxsize设置队列的容量，默认无限大
           * put()来向队列中放入一个消息
           * get()来从队列中获取队列中相对最先放入的那个消息，若队列为空，则会处于阻塞等待状态
           * qsize()可以用来获取已使用队列的大小
"""
import queue

msg_queue = queue.Queue()
msg_queue.put("d1")
msg_queue.put("d2")
msg_queue.put("d3")

print(msg_queue.qsize())

print(msg_queue.get())
print(msg_queue.get())
print(msg_queue.get())
print(msg_queue.get())



