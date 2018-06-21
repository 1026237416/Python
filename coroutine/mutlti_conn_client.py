#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: mutlti_conn_client.py
    @time: 2018/5/28 21:32
    @desc: 一个高并发连接客户端
"""
import socket

HOST = "localhost"
PORT = 9998
MAX_CONN = 1000
server_addr = (HOST, PORT)

messages = [
    b'This is the message. ',
    b'It will be sent ',
    b'in parts.',
]


def main():
    socks = [
        socket.socket() for i in range(MAX_CONN)
    ]
    print("Create %d socket connection." % len(socks))

    print("Start connection server:", server_addr)
    for sock in socks:
        sock.connect(server_addr)

    for message in messages:
        for sock in socks:
            print("%s: sending message: %s" % (sock.getsockname(), message))
            sock.send(message)

        for sock in socks:
            data = sock.recv(1024)
            print('%s: received "%s"' % (sock.getsockname(), data))
            if not data:
                print('closing socket', sock.getsockname())


if __name__ == '__main__':
    main()
