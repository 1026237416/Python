#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: recv.py
    @time: 2017/5/7 9:21
"""

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters('10.0.0.134'))
channel = connection.channel()
channel.queue_declare(queue='path')


def callback(ch, method, properties, body):
    print(" [x] Received %r" % body)


channel.basic_consume(callback, queue='path', no_ack=True)

print(' [*] Waiting for message. To exit press CTRL+C')
channel.start_consuming()
