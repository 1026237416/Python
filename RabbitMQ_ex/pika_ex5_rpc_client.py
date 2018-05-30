#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: pika_ex5_rpc_client.py
    @time: 2018/5/29 21:00
    @desc:
"""
import pika
import uuid


class FibRpcClient(object):
    def __init__(self):
        self.response = None
        self.corr_id = None

        self.credentials = pika.PlainCredentials("liping", "liping")
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host="192.168.206.200",
                port=5672,
                credentials=self.credentials
            )
        )
        self.channel = self.connection.channel()
        result = self.channel.queue_declare(exclusive=True)
        self.callback_queue_name = result.method.queue

        self.channel.basic_consume(
            consumer_callback=self.on_response,
            no_ack=True,
            queue=self.callback_queue_name
        )

    def on_response(self, ch, method, props, body):
        if self.corr_id == props.correlation_id:
            self.response = body

    def call(self, n):
        self.corr_id = str(uuid.uuid4())

        self.channel.basic_publish(
            exchange="",
            routing_key="rpc_queue",
            properties=pika.BasicProperties(
                reply_to=self.callback_queue_name,
                correlation_id=self.corr_id
            ),
            body=str(n)
        )
        while self.response is None:
            self.connection.process_data_events()
        return int(self.response)


fib_rpc = FibRpcClient()
print(" [x] Requesting fib(30)")
response = fib_rpc.call(30)
print(" [.] Got %r" % response)
