#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/9/17 9:48
# @Author  : liping
# @File    : webserver1.py
# @Software: PyCharm

import socket

HOST, PORT = '', 8888

listen_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
listen_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
listen_socket.bind((HOST, PORT))
listen_socket.listen(1)

print("Server HTTP on port %d......" % PORT)

while True:
    client_connection, client_address = listen_socket.accept()
    request = client_connection.recv(1024)
    print(request)

    http_response = """\
        HTTP/1.1 200 OK
        
        Hello World
    """

    client_connection.sendall(http_response)
    client_connection.close()

