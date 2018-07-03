#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: redis_consumer.py
    @time: 2018/5/31 22:10
    @desc:
"""
from PublisherBase import RedisPublisherBase


obj = RedisPublisherBase()
obj.public("Hello")
