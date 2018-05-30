#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: pika_ex2_fanout_publisher.py
    @time: 2018/5/29 16:01
    @desc:
"""
import pika

credentials = pika.PlainCredentials('liping', 'liping')
connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host="192.168.206.200",
        port=5672,
        credentials=credentials
    )
)
message = "info: hello world"

channel = connection.channel()
channel.exchange_declare(
    exchange="logs",
    exchange_type="fanout"
)
channel.basic_publish(
    exchange="logs",
    routing_key="",
    body=message
)
print("Send message: %s" % message)
connection.close()



