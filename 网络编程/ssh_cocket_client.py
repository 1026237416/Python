#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: ssh_cocket_client.py
    @time: 2018/5/24 11:18
"""
import socket

client = socket.socket()
client.connect(("localhost", 9999))

while True:
    cmd = input(">>:").strip()
    if not cmd:
        continue

    client.send(cmd.encode("utf-8"))
    cmd_recv_size = client.recv(1024)

    print("Recv command result size: %s" % cmd_recv_size)
    client.send(b"client ready to recv data!")

    received_size = 0
    received_date = b""

    while received_size < int(cmd_recv_size.decode()):
        data = client.recv(1024)
        received_size += len(data)
        received_date += data
    else:
        print("cmd result receive done: %s" % received_size)
        print(received_date.decode())

client.close()
