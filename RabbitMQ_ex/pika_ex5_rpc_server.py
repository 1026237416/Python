#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: pika_ex5_rpc_server.py
    @time: 2018/5/29 20:41
    @desc:
"""

import time
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
channel.queue_declare(queue="rpc_queue")


def fib(n):
    if n == 0 or n == 1:
        return n
    else:
        return fib(n - 1) + fib(n - 2)


def on_request(ch, method, props, body):
    n = int(body)
    print("[*] fib(%s)" % n)

    response = fib(n)
    ch.basic_publish(
        exchange="",  # 使用默认的exchange
        routing_key=props.reply_to,
        properties=pika.BasicProperties(
            correlation_id=props.correlation_id
        ),
        body=str(response)
    )
    ch.basic_ack(delivery_tag=method.delivery_tag)


channel.basic_qos(prefetch_count=1)
channel.basic_consume(on_request, queue="rpc_queue")

print(" [x] Awaiting RPC requests")
channel.start_consuming()
