#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: redis_ex6_list.py
    @time: 2018/5/30 20:49
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

# client.lpush("list", ["11", "22", "33"])
# client.rpush("list_r", ["11", "22", "33"])
#
client.lpush("list", "11", "22", "33")
client.rpush("list_r", "11", "22", "33")

print(client.llen("list"))

client.linsert("list", where="after", value=99999, refvalue="11")
client.lset("list", 2, "963258741")
client.lrem("list", 99999, 1)

print(client.lpop("list"))
print(client.lindex("list", 3))
print(client.lrange("list", 3, 5))
client.ltrim("list", 3, 5)
