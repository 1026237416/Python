#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: consumer.py
    @time: 2018/7/17 15:22
"""
from pykafka import KafkaClient


client = KafkaClient(hosts="192.168.11.20:9092")


print client.topics

# 消费者
topic = client.topics["EVENT.QLOUD_TEST_ENGINE"]
consumer = topic.get_simple_consumer(consumer_group='test',
                                     auto_commit_enable=True,
                                     consumer_id='test')
for message in consumer:
    if message is not None:
        print message.offset, message.value

