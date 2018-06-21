#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: pika_ex2_fanout_consumer.py
    @time: 2018/5/29 16:20
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
channel = connection.channel()
channel.exchange_declare(exchange="logs", exchange_type="fanout")

# 不指定queue名字,rabbit会随机分配一个名字,exclusive=True会在使用此queue的消费者断开后,自动将queue删除
result = channel.queue_declare(
    exclusive=True)
queue_name = result.method.queue

channel.queue_bind(exchange="logs", queue=queue_name)
print("Waiting for message...... To exit press CTRL+C")


def callback(ch, method, properties, body):
    print(" [x] %r" % body)


channel.basic_consume(
    consumer_callback=callback,
    queue=queue_name,
    no_ack=True
)
channel.start_consuming()
