#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: leader.py
    @time: 2018/8/9 15:26
"""
import time
import uuid
import logging

from kazoo.client import KazooClient

logging.basicConfig()
my_id = uuid.uuid4()


def leader_func():
    print "I am the leader {}".format(str(my_id))
    while True:
        print "{} is working! ".format(str(my_id))
        time.sleep(3)


zk = KazooClient(hosts="10.0.0.130:2181")
zk.start()

election = zk.Election("/electionpath")
election.run(leader_func)

zk.stop()
