#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: run.py
    @time: 2018/6/23 12:56
    @desc:
"""
from app import app

app.run(debug=True,
        host="0.0.0.0",
        port=6555)
