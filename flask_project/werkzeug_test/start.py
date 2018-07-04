#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: start.py
    @time: 2018/7/3 22:08
    @desc:
"""
from werkzeug.wrappers import Request, Response
from werkzeug.serving import run_simple


@Request.application
def hello():
    return Response("hello world")


if __name__ == '__main__':
    run_simple("127.0.0.1", 4000, hello)
