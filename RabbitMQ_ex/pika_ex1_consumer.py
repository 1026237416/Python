#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: pika_ex1_consumer.py
    @time: 2018/5/28 23:11
    @desc:
"""
import pika


def callback(ch, method, properties, body):
    print("----->", ch, method, properties)
    print("Received a new message: %r" % body)


credentials = pika.PlainCredentials('liping', 'liping')
connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host="192.168.206.200",
        port=5672,
        credentials=credentials
    )
)
channel = connection.channel()
channel.queue_declare(queue="hello")

channel.basic_consume(
    consumer_callback=callback,
    queue="hello",
    no_ack=True
)
print("[*] Waiting for message....")
channel.start_consuming()
