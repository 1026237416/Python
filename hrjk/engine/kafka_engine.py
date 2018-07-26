#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: kafka_engine.py
    @time: 2018/7/17 17:58
"""
import json

from config import KAFKA_HOST, KAFKA_PORT, conductor_recv_topic
from common import case_log


def default_call_back(data):
    print("******************Receive New Data******************")
    print type(data)
    print data
    print("****************************************************")


def on_message(messages, call_back):
    for message in messages:
        if message is not None:
            case_log.info("Recv new message: %s" % message.value)
            try:
                data = json.loads(message.value)
                call_back(message.value, key=message.key)
            except ValueError as e:
                case_log.warning(
                    "Receive an illegal message: %s" % e.message)


class KafkaEngineClientByPyKafka(object):
    def __init__(self):
        from pykafka import KafkaClient

        kafka_host = "%s:%s" % (KAFKA_HOST, str(KAFKA_PORT))

        self.client = KafkaClient(hosts=kafka_host)

        self.topic = self.client.topics[conductor_recv_topic]

    def get_all_topic(self):
        return self.client.topics

    def create_topic(self, topic_name):
        pass

    def recv_msg(self, call_back):
        messages = self.topic.get_simple_consumer(consumer_group='case_engine',
                                                  auto_commit_enable=True,
                                                  consumer_id='case_engine')

        on_message(messages=messages, call_back=call_back)


class KafkaEngineClientByKafkaPython(object):
    def __init__(self):
        self.kafka_host = "%s:%s" % (KAFKA_HOST, str(KAFKA_PORT))

    def recv_msg(self, call_back):
        from kafka import KafkaConsumer
        messages = KafkaConsumer(conductor_recv_topic,
                                 bootstrap_servers=[self.kafka_host])
        on_message(messages=messages, call_back=call_back)

    def send_msg(self, topic_name, msg, key):
        from kafka import KafkaProducer
        producer = KafkaProducer(
            bootstrap_servers=self.kafka_host,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks="all"
        )

        producer.send(topic=topic_name,
                      key=key,
                      value=msg
                      )
        case_log.info(
            "Send message to Kafka, using topic: %s, key: %s, value: %s" % (
                topic_name, key, msg
            ))
        producer.flush()


def kafka_engine():
    kafka_client = KafkaEngineClientByKafkaPython()
    return kafka_client


if __name__ == '__main__':
    client = kafka_engine()
    msg = {'requestinfo': '0000000', 'processName': '201807182248',
           'requestway': 'run'}
    client.send_msg(topic_name="EVENT.conductor.ack",
                    key=b"35b71d7d-fdca-4070-8940-85f1f1fd82c1",
                    msg=msg
                    )
