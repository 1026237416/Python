#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: pika_ex3_direct_consumer.py
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

channel = connection.channel()
channel.exchange_declare(
    exchange="direct_logs",
    exchange_type="direct"
)

result = channel.queue_declare(exclusive=True)
queue_name = result.method.queue

severities = sys.argv[1:]
if not severities:
    sys.stderr.write("Usage: %s [info] [warning] [error]\n" % sys.argv[0])
    sys.exit(1)

for severitie in severities:
    channel.queue_bind(
        exchange="direct_logs",
        queue=queue_name,
        routing_key=severitie
    )
print(' [*] Waiting for logs. To exit press CTRL+C')


def callback(ch, method, properties, body):
    print(" [x] %r:%r" % (method.routing_key, body))


channel.basic_consume(callback,
                      queue=queue_name,
                      no_ack=True)

channel.start_consuming()
