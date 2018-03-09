#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: index.py
    @time: 2018/3/9 23:23
"""

from wsgiref.simple_server import make_server


def run_server(environ, start_response):
    # 1、根据不同的URL返回不同的结果，获取URL
    start_response("200 OK", [("Content-type", "text/html")])

    return "<h1>Hello world!</h1>"


if __name__ == '__main__':
    httpd = make_server("", 8000, run_server)
    print "Start run server on port 8000..."
    httpd.serve_forever()
