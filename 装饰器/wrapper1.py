#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: wrapper1.py
    @time: 2018/7/2 23:42
    @desc:
"""

url_map = {}


def route(path):
    def inner(func, *args, **kwargs):
        url_map[path] = func
    return inner


@route("/index")
def index():
    pass


index()

print(url_map)
