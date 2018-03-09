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


def index():
    return "Welcome to index! "


def about_me():
    return "Welcome to my website, I am learn python web fromework."


def news():
    return "今日头条："


def not_found():
    return "404 Not Found！"


url_list = {
    "index": index,
    "about": about_me,
    "news": news,
    "default": not_found
}


def run_server(environ, start_response):
    # 1、根据不同的URL返回不同的结果，获取URL
    start_response("200 OK", [("Content-type", "text/html")])

    request_url = environ["PATH_INFO"]
    print request_url

    response = ""

    if (request_url == "/") or (request_url == "/index"):
        response = url_list.get("index")
    elif start_response == "/about":
        response = url_list.get("about")
    elif request_url == "/news":
        response = url_list.get("news")
    else:
        response = url_list.get("default")

    response_data = "<h1>%s</h1>" % response()
    print response_data

    return response_data


if __name__ == '__main__':
    httpd = make_server("", 8000, run_server)
    print "Start run server on port 8000..."
    httpd.serve_forever()
