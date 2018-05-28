#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: corontine_ex4_socket_server.py
    @time: 2018/5/27 23:17
    @desc:
"""
import sys
import socket
import time
import gevent
from gevent import socket, monkey

monkey.patch_all()


def server(port):
    s = socket.socket()
    s.bind(("0.0.0.0", port))
    s.listen(500)
    while True:
        cli, addr = s.accept()
        print("Accept client: %s connection!", addr)
        gevent.spawn(handle_request, cli)


def handle_request(conn):
    try:
        while True:
            data = conn.recv(1024)
            print("Recv data: %s" % data)
            conn.send(data)
            if not data:
                conn.shutdown(socket.SHUT_WR)
    except Exception as e:
        print(e)
    finally:
        conn.close()


if __name__ == '__main__':
    server(8888)
