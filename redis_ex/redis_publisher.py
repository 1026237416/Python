#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: redis_publisher.py
    @time: 2018/5/31 22:07
    @desc:
"""
from PublisherBase import RedisPublisherBase


publisher = RedisPublisherBase()
redis_sub = publisher.subscribe()

while True:
    msg = redis_sub.parse_response()
    print(msg)
