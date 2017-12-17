#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: mutliprocess.py
    @time: 2017/5/7 23:10
"""

import redis

pool = redis.ConnectionPool(host="10.0.0.134", port=6379)
svr = pool.Redis(connection_pool=pool)
svr.set("name", "zhengsan")

print(svr.get("name"))
