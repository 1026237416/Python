#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: corontine_ex4_socket_client.py
    @time: 2018/5/27 23:26
    @desc:
"""
import socket

HOST = "localhost"
PORT = 8888

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect((HOST, PORT))

while True:
    msg = bytes(input(">>>:"), encoding="utf-8")
    s.sendall(msg)
    data = s.recv(1024)

    print("Receive Data: %s" % data)
s.close()
