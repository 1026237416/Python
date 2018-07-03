#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: redis_ex5_hash.py
    @time: 2018/5/30 14:28
    @desc:
"""
import redis

pool = redis.ConnectionPool(
    host="192.168.206.200",
    port=6379,
)
client = redis.StrictRedis(
    connection_pool=pool,
    max_connections=15
)

client.hset(name="info", key="name", value="liping")
client.hmset(name="info", mapping={"age": 27, "sex": "man"})
print(client.hget("info", "name"))
print(client.hmget("info", ["name", "age"]))
print(client.hgetall("info"))
print(client.hlen("info"))
print(client.hkeys("info"))
print(client.hvals("info"))
print(client.hexists("info", "kk"))
client.hdel("info", "sex")
print(client.hgetall("info"))
