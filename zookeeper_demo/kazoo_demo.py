#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: kazoo_demo.py
    @time: 2018/8/8 14:07
"""
import time

from kazoo.client import KazooClient
from kazoo.client import KazooState


def my_listener(state):
    if state == KazooState.LOST:
        print("LOST")
    elif state == KazooState.SUSPENDED:
        print("SUSPENDED")
    else:
        print("Connected")


def main():
    zk = KazooClient(hosts='10.0.0.130:2182')

    zk.add_listener(my_listener)

    zk.start()
    zk.ensure_path("/my/favorite")

    zk.create("/my/favorite/node", b"")
    zk.create("/my/favorite/node/a", b"A")

    if zk.exists("/my/favorite"):
        print("/my/favorite is existed")

    @zk.ChildrenWatch("/my/favorite/node")
    def watch_children(children):
        print("Children are now: %s" % children)

    @zk.DataWatch("/my/favorite/node")
    def watch_node(data, stat):
        print("Version: %s, data: %s" % (stat.version, data.decode("utf-8")))

    data, stat = zk.get("/my/favorite/node")
    print("Version: %s, data: %s" % (stat.version, data.decode("utf-8")))

    # List the children
    children = zk.get_children("/my/favorite/node")
    print("There are %s children with names %s" % (len(children), children))

    # Updating Data
    zk.set("/my/favorite", b"some data")

    # Deleting Nodes
    zk.delete("/my/favorite/node/a")

    # Transactions
    transaction = zk.transaction()
    transaction.check('/my/favorite/node', version=-1)
    transaction.create('/my/favorite/node/b', b"B")

    results = transaction.commit()
    print ("Transaction results is %s" % results)

    zk.delete("/my/favorite/node/b")
    zk.delete("/my", recursive=True)
    time.sleep(2)

    zk.stop()


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print "Occurred Exception: %s" % str(e)
        quit()
