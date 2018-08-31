#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: change_server_data.py
    @time: 2018/8/27 17:22
"""
import json

from kazoo.client import KazooClient

zk = KazooClient(hosts="10.0.0.130:2181")
zk.start()
node_data = {
    "url": "https://github.com/aizuyan/daemon.git",
    "commitId": "d5f5f144c66f0a36d452e9e13067b21d3d89b12***3",
    "relativePath": "daemon"
}
node_data = json.dumps(node_data)
node_data = bytes(node_data)
zk.ensure_path("/app/business/config")
zk.set("/app/business/config", node_data)

# zk.close()

