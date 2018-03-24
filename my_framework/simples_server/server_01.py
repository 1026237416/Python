#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: server_01.py
    @time: 2018/3/23 0:22
"""

from wsgiref.simple_server import make_server


def application(environ, start_response):
    start_response("200 OK", [("Content-type", "text/html")])
    return [b"<h1>Hello web</h1>"]

httpd = make_server("", 8001, app=application)
print("Start Run server on 0.0.0.0:8001......")
httpd.serve_forever()
