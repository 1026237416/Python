#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: ssh_socket_server.py
    @time: 2018/5/24 10:34
"""
import os
import socket


server = socket.socket()
server.bind(("localhost", 9999))
server.listen()

while True:
    conn, addr = server.accept()
    print("New connection: %s" % str(addr))
    while True:
        print("Waiting for new command:", end="")
        data = conn.recv(1024)
        if not data:
            print("Client connection is closed.")
            break
        print(data)

        cmd_res = os.popen(data.decode()).read()
        print("Command result length: %s" % len(cmd_res))

        if len(cmd_res) == 0:
            cmd_res = "cmd has no output......"

        conn.send(str(len(cmd_res.encode())).encode("utf-8"))
        # 防止粘包处理
        msg_ack = conn.recv(1024)
        print(msg_ack)
        conn.send(cmd_res.encode("utf-8"))
        print("Data send done.")

server.close()



