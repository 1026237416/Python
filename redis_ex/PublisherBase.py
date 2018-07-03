#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: PublisherBase.py
    @time: 2018/5/31 21:24
    @desc:
"""
import redis


class RedisPublisherBase(object):

    def __init__(self):
        rdp = redis.ConnectionPool(
            host="192.168.206.200",
            port=6379,
            max_connections=15
        )
        self.__conn = redis.StrictRedis(connection_pool=rdp)

        self.chan_sub = "fm104.5"
        self.chan_pub = "fm104.5"

    def public(self, msg):
        self.__conn.publish(channel=self.chan_pub, message=msg)
        return True

    def subscribe(self):
        pub = self.__conn.pubsub()
        pub.subscribe(self.chan_sub)
        pub.parse_response()
        return pub


