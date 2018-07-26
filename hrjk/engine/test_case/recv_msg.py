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
from stomp_engine import MessSendOrRecv

# conductor_destination = "/EVENT.CASE_ENGINE"
# conductor_destination = "/liping"
# conductor_destination = "liping"
# conductor_destination = "topic.liping"
# conductor_destination = "/topic.liping"
# conductor_destination = "/topic/liping"
conductor_destination = "/qloud/test_engine_report"

try:
    stompmess = MessSendOrRecv(ip="192.168.11.20")
    print " Start listen..............."
    stompmess.recv_message(subscription_id="123456",
                           destination=conductor_destination)
    stompmess.run_forever()
except Exception as e:
    print e

