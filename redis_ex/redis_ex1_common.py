#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: redis_ex1_common.py
    @time: 2018/5/30 12:28
    @desc:
"""
import redis

conn = redis.Redis(host="192.168.206.200", port=6379, db=1)
conn.set("foo", "bar")
print(conn.get("foo"))
