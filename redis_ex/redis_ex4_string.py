#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: redis_ex4_string.py
    @time: 2018/5/30 13:24
    @desc:
"""
import time
import redis

pool = redis.ConnectionPool(
    host="192.168.206.200",
    port=6379,
)
client = redis.StrictRedis(
    connection_pool=pool,
    max_connections=15
)

client.set(name="name", value="li", ex=2)
print(client.get("name"))
time.sleep(3)
print(client.get("name"))

client.setnx(name="name", value="liping")
print(client.get("name"))
client.setnx(name="name", value="liping*****")
print(client.get("name"))

client.mset({"k1": "v1", "k2": "v2"})
client.mset(k3="v3", k4="v4")

print(client.mget('k1', "k2", "k3", "k4"))

print(client.getset("k1", "vv1"))
print(client.get("k1"))
print(client.getrange("k1", 1, 2))
print(client.append("k1", "wwwwww"))
print(client.get("k1"))
