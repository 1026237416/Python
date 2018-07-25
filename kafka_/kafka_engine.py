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


conductor_destination = "E"


def default_call_back(data):
    print("******************Receive New Data******************")
    print type(data)
    print data
    print type(json.loads(data))
    print json.loads(data)
    print("****************************************************")


def on_message(messages, call_back):
    for message in messages:
        if message is not None:
            print("Recv new message: %s" % message.value)
            try:
                data = json.loads(message.value)
                call_back(message.value)
            except ValueError as e:
                print(
                    "Receive an illegal message: %s" % e.message)


class KafkaEngineClientByPyKafka(object):
    def __init__(self):
        from pykafka import KafkaClient

        kafka_host = "%s:%s" % ("192.168.11.20", str(9092))

        self.client = KafkaClient(hosts=kafka_host)

        self.topic = self.client.topics["0000"]

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
        self.kafka_host = "%s:%s" % ("192.168.11.20", str(9092))

    def recv_msg(self, call_back, destination):
        from kafka import KafkaConsumer
        messages = KafkaConsumer(destination,
                                 bootstrap_servers=[self.kafka_host],
                                 group_id='my-group')
        on_message(messages=messages, call_back=call_back)

    def send_msg(self, topic_name, msg, key):
        from kafka import KafkaProducer
        producer = KafkaProducer(
            bootstrap_servers=self.kafka_host,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks="all"
        )

        print("Send Topic: %s" % topic_name)
        print("Send Key: %s" % key)
        print("Send Msg: %s" % msg)

        producer.send(topic=topic_name,
                      key=key,
                      # value=json.dumps(msg)
                      value=msg
                      )
        print("Send message to %s: %s" % (topic_name, str(msg)))
        producer.flush()


def kafka_engine():
    kafka_client = KafkaEngineClientByKafkaPython()
    return kafka_client


if __name__ == '__main__':
    client = kafka_engine()
    # msg = {'requestinfo': '0000000', 'processName': '201807182248',
    #        'requestway': 'run'}
    # client.send_msg(topic_name="EVENT.conductor.ack",
    #                 key=b"35b71d7d-fdca-4070-8940-85f1f1fd82c1",
    #                 msg=msg
    #                 )
    # client.recv_msg(default_call_back, destination="EVENT.conductor.ack")
    client.send_msg(topic_name="EVENT.QLOUD_TEST_ENGINE_ACK",
                    # msg={"requestinfo": "tgbnhy", "processName": "20180fffffffff7190003", "requestway": "run"},
                    msg="1234567899",
                    key="abcde123456")
