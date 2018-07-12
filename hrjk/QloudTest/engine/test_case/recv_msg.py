#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: recv_msg.py
    @time: 2018/7/12 11:05
"""
from connstomp import MessSendOrRecv

conductor_destination = "/EVENT.CASE_ENGINE"
# conductor_destination = "/asd/78"
send_destination = "/queue/test_case"

try:
    stompmess = MessSendOrRecv(ip="192.168.11.20")
    print " Start listen..............."
    stompmess.recv_message(subscription_id="123456",
                           destination=conductor_destination)
    stompmess.run_forever()
except Exception as e:
    print e

