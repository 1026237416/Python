# -*- coding: utf-8 -*-
'''
Created on 2018年6月14日

@author: pandas
'''

import sys
import time
import stomp
import json


def default_call_back(data):
    print("******************Receive New Data******************")
    print data
    print("****************************************************")


class MyListener(stomp.ConnectionListener):
    def __init__(self, callback):
        self.callback = callback

    def on_error(self, headers, message):
        print('received an error %s' % message)

    def on_message(self, headers, message):
        print('received a message %s' % message)
        self.callback(message)


class MessSendOrRecv(object):
    def __init__(self, ip='127.0.0.1', user=None, pwd=None, callback=None):
        self.conn = stomp.Connection([(ip, 61613)])

        call_back = callback if callback else default_call_back

        self.conn.set_listener(name='logicServerQueue',
                               lstnr=MyListener(callback=call_back))
        self.conn.start()
        self.conn.connect(username=user, passcode=pwd, wait=True)

    def send_message(self, destination="/queue/test_case",message=b"test"):
        """
        发布信息到事业总线,发送消息到testQueue队列，指定consumerId='88.3@6006
        :param destination: 接收消息的队列名称
        :param message: 消息内容
        :return: 
        """
        self.conn.send(
            body=json.dumps(message),
            destination=destination,
            headers={'consumerId': '88.3@6006'},
        )

    def recv_message(self, destination="/queue/test_case", subscription_id=None):
        """
        从testQueue队列中接收消息，用selector过滤，只接收consumerId = '88.3@6006'的消息
        :param destination: 消息发送到的队列名称
        :param subscription_id: 消息订阅者的ID
        :return: 
        """
        self.conn.subscribe(destination=destination,
                            headers={'selector': "consumerId = '88.3@6006'"},
                            id=subscription_id,
                            ack="auto"
                            )

    def disconnect(self):
        time.sleep(1.5)
        self.conn.disconnect()

    @staticmethod
    def run_forever():
        while True:
            time.sleep(0.01)


if __name__ == '__main__':
    stompmess = MessSendOrRecv(ip="192.168.11.20")
    stompmess.send_message()
    # stompmess.recv_message()
    stompmess.disconnect()
