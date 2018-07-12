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
from connstomp import MessSendOrRecv

#conductor_destination = "/EVENT.CASE_ENGINE_WANGPENG"
conductor_destination = "/asd/78"
send_destination = "/queue/test_case"

msg = {
    "requestway": "run",
    "requestinfo": "1531120948068-bbb.aaa.ccc",
    "processName": "myProcess"
}
stomp_mess = MessSendOrRecv(ip="192.168.11.20")

print "Send data: %s" % msg
stomp_mess.send_message(message=msg, destination=conductor_destination)

msg["requestinfo"] = "20180710220735-ywcs.test.WEB"

print "Send data: %s" % msg
stomp_mess.send_message(message=msg, destination=conductor_destination)

stomp_mess.disconnect()
