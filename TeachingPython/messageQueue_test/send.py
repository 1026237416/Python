#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: send.py
    @time: 2017/5/7 9:15
"""

import pika

connection = pika.BlockingConnection(pika.ConnectionParameters("10.0.0.134"))
channel = connection.channel()

channel.queue_declare(queue='path')

channel.basic_publish(exchange='', routing_key='path', body='Hello Path!')

print " [x] Send 'Hello world!'"

