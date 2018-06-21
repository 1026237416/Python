# -*- coding: utf-8 -*-
'''
Created on 2018年6月14日

@author: pandas
'''

import sys
import time
import stomp


class MyListener(object):
    def on_error(self, headers, message):
        print('received an error %s' % message)

    def on_message(self, headers, message):
        print('received a message %s' % headers)


class MessSendOrRecv(object):
    def __init__(self, ip='127.0.0.1', send_info=b'this is a test'):
        self.conn = stomp.Connection10([(ip, 61613)])
        self.conn.set_listener('logicServerQueue', MyListener())
        self.conn.start()
        self.conn.connect(wait=True)
        self.send_info = send_info

    def send_message(self):
        '''发布信息到事业总线,发送消息到testQueue队列，指定consumerId='88.3@6006
        '''
        self.conn.send(body=self.send_info, destination='/testQueue',
                       headers={'consumerId': '88.3@6006'})

    def recv_message(self):
        '''从testQueue队列中接收消息，用selector过滤，只接收consumerId = '88.3@6006'的消息'''
        self.conn.subscribe(destination='/testQueue',
                            headers={'selector': "consumerId = '88.3@6006'"})

    def disconnect(self):
        time.sleep(2)
        self.conn.disconnect()


if __name__ == '__main__':
    stompmess = MessSendOrRecv()
    stompmess.send_message()
    stompmess.recv_message()
    stompmess.disconnect()
