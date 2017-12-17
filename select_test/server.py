#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/7/17 21:54
# @Author  : liping
# @File    : server.py
# @Software: PyCharm

import socket
import time

ip_port = ('127.0.0.1', 8888)
sk = socket.socket()
sk.bind(ip_port)
sk.listen(5)

while True:
    try:
        conn, address = sk.accept()
        conn.close()
        print(address)
    except Exception as e:
        print(e)
    finally:
        time.sleep(2)
