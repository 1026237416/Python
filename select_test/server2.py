#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/7/17 22:06
# @Author  : liping
# @File    : server2.py
# @Software: PyCharm


import socket
import time
import select

ip_port = ('127.0.0.1', 8888)
sk = socket.socket()
sk.bind(ip_port)
sk.listen(5)

while True:
    rList, w, e = select.select([sk, ], [], [], 2)
    for r in rList:
        conn, address = r.accept()
        print(address)
        print(conn)
