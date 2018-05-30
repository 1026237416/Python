#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: pika_ex3_direct_publisher.py
    @time: 2018/5/29 17:34
    @desc:
"""
import sys
import pika

credentials = pika.PlainCredentials('liping', 'liping')
connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host="192.168.206.200",
        port=5672,
        credentials=credentials
    )
)
severity = sys.argv[1] if len(sys.argv) > 1 else 'info'
message = ' '.join(sys.argv[2:]) or 'Hello World!'

channel = connection.channel()
channel.exchange_declare(
    exchange="direct_logs",
    exchange_type="direct"
)
channel.basic_publish(
    exchange="direct_logs",
    routing_key=severity,
    body=message
)

print(" [x] Sent %r:%r" % (severity, message))
connection.close()

