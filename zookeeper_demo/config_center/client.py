#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: client.py
    @time: 2018/8/27 17:02
"""
import time
import json

from kazoo.client import KazooClient

zk = KazooClient(hosts="10.0.0.130:2181")
zk.start()


def handler_watch(data):
    data = json.loads(data)
    print("Has new configure:")
    print(data)


@zk.DataWatch("/app/business/config")
def watch_node(data, stat):
    if data:
        data = data.decode("utf-8")
        handler_watch(data)
    else:
        print("Data is null")


if __name__ == '__main__':
    while True:
        time.sleep(15)
        print("Listen......")
