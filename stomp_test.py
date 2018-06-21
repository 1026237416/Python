#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: stomp_test.py
    @time: 2018/6/21 10:08
"""

import time
import sys
import stomp


class MyListener(object):
    def on_error(self, headers, message):
        print('received an error %s' % message)

    def on_message(self, headers, message):
        print('received a message %s' % message)


# 官方示例的连接代码也落后了，现在分协议版本
conn = stomp.Connection10([("127.0.0.1", 61613)])
conn.set_listener('', MyListener())
conn.start()
conn.connect()

conn.subscribe(destination='/queue/test', id=1, ack='auto')
# 注意，官方示例这样发送消息是有问题的
# conn.send(body='hello,garfield! this is '.join(sys.argv[1:]), destination='/queue/test')
conn.send(body='hello,garfield!', destination='/queue/test')

time.sleep(2)
conn.disconnect()
