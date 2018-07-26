#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: consumer2.py
    @time: 2018/7/17 16:03
"""
from kafka import KafkaConsumer
import time

from kafka_engine import kafka_engine


def call_back(msg):
    print("Msg: %s" % msg)
    time.sleep(5)


consumer = KafkaConsumer('EVENT.QLOUD_TEST_ENGINE',
                         bootstrap_servers=['192.168.11.20:9092'])

for msg in consumer:
    print("Receive new message......")
    print("Key: %s" % msg.key)
    print("Msg: %s" % msg.value)
    print("*******************************************************************")

    ack_msg = 1

    client = kafka_engine()
    client.send_msg(topic_name="EVENT.QLOUD_TEST_ENGINE_ACK",
                    msg=ack_msg,
                    key=msg.key)
