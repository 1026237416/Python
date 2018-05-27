#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: queue_ex2_nowait.py
    @time: 2018/5/25 22:49
    @desc: 非阻塞状态获取消息
           可以使用get_nowait()来非阻塞的获取队列中的数据，等效于get(block=False)
           当队列为空时，继续获取会抛出【queue.Empty】的异常
"""
import queue

msg_queue = queue.Queue()
msg_queue.put("d1")
msg_queue.put("d2")
msg_queue.put("d3")

print(msg_queue.qsize())

try:
    print(msg_queue.get_nowait())
    print(msg_queue.get_nowait())
    print(msg_queue.get_nowait())
    print(msg_queue.get_nowait())
except queue.Empty:
    print("Queue is empty!")


