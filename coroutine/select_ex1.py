#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: select_ex1.py
    @time: 2018/5/28 16:52
    @desc:
"""
import select
import socket
import queue

server = socket.socket()
server.bind(("localhost", 8888))
server.listen(1000)
server.setblocking(False)  # 设置socket为非阻塞状态

inputs = [server, ]
outputs = []
msg_dict = {}

while True:
    readable, writeable, exceptional = select.select(inputs, outputs, inputs)
    print(readable, writeable, exceptional)
    for req in readable:
        if req is server:  # r为server代表来了一个新连接
            conn, addr = server.accept()
            print("Have a new connection:", addr)
            inputs.append(conn)

            msg_dict[conn] = queue.Queue()  # 为新连接建立一个消息
        else:
            data = req.recv(1024)
            print("New data: %s" % data)
            # 将接收到的数据放入对应连接的QUEUE中，准备echo回去
            msg_dict[req].put(data)

            # echo对应的数据给客户端
    for client in writeable:
        echo_data = msg_dict[client].get()
        client.send(echo_data)

        # echo结束之后将conn从队列列表中移除
        outputs.remove(client)

    # 处理异常的连接
    for exec_client in exceptional:
        if exec_client in outputs:
            outputs.remove(exec_client)
        inputs.remove(exec_client)
        del msg_dict[exec_client]
