#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: PyCharm
# @file: start_load.py
# @time: 2017/12/5 14:48

from flask import Flask

app = Flask(__name__)


@app.route("/")
def hello_world():
    return "Hello world!"


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=9000)
