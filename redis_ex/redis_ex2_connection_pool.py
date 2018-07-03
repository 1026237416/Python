#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: redis_ex2_connection_pool.py
    @time: 2018/5/30 12:52
    @desc:
"""
import redis

rdp = redis.ConnectionPool(
    host="192.168.206.200",
    port=6379,
    max_connections=15
)
rdc = redis.StrictRedis(connection_pool=rdp)

rdc.set(name="name", value="liping")
print(rdc.get("name"))
