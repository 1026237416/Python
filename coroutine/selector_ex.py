#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: selector_ex.py
    @time: 2018/5/28 20:35
    @desc:
"""
import selectors
import socket
from selectors import DefaultSelector

sel = DefaultSelector()


def accept(sock, mask):
    conn, addr = sock.accept()
    print("Accept new connection: %s, mask:%s" % (addr, mask))
    conn.setblocking(False)
    sel.register(fileobj=conn, events=selectors.EVENT_READ, data=read)


def read(conn, mask):
    data = conn.recv(1024)
    if data:
        print("Echoing:", repr(data), "to", conn)
        conn.send(data)
    else:
        print("Closing connection: %s" % str(conn))
        sel.unregister(conn)
        conn.close()


def main():
    server = socket.socket()
    server.bind(("localhost", 9998))
    server.listen(100000)
    server.setblocking(False)

    sel.register(fileobj=server, events=selectors.EVENT_READ, data=accept)

    while True:
        events = sel.select()  # 默认为阻塞，当有活动的连接时，返回活动链接的列表
        for key, mask in events:
            callback = key.data  # 类似于accept
            callback(key.fileobj, mask)


if __name__ == '__main__':
    main()
