#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: pika_ex1_producer.py
    @time: 2018/5/28 22:59
    @desc: 消息队列第一发
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
channel.queue_declare(queue="hello")

channel.basic_publish(
    exchange="",
    routing_key="hello",
    body="Hello world"
)
print("[*] Send message....")
connection.close()
