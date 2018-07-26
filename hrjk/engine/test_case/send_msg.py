#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: send_msg.py
    @time: 2018/7/12 11:05
"""
from stomp_engine import MessSendOrRecv

conductor_destination = "123.456.789"
# conductor_destination = "/case/engine"
send_destination = "/queue/test_case"

msg = {
    "requestway": "run",
    "requestinfo": "20180715125512-asdad.asdasd.dasdas",
    "processName": "myProcess"
}
stomp_mess = MessSendOrRecv(ip="192.168.11.20")

print "Send data: %s" % msg
stomp_mess.send_message(message=msg, destination=conductor_destination)
#
# msg["requestinfo"] = "20180710220735-ywcs.test.WEB"
#
# print "Send data: %s" % msg
# stomp_mess.send_message(message=msg, destination=conductor_destination)

stomp_mess.disconnect()
