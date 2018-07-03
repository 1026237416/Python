#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: redis_ex3_pipe.py
    @time: 2018/5/30 13:16
    @desc: 默认情况下，每次都会进行连接池的连接和断开。若是想一次执行多条命令，
           进行事务性操作，就要用管道。
"""
import redis

pool = redis.ConnectionPool(
    host="192.168.206.200",
    port=6379,
)
conn = redis.Redis(connection_pool=pool)
pipe = conn.pipeline(transaction=True)

conn.set("name2", "li")
conn.set("name3", "ping")

pipe.execute()
