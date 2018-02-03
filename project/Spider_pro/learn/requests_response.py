#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: requests_response.py
    @time: 2018/1/28 17:15
"""

import requests

resp = requests.get("http://www.baidu.com")

print "Content---->" + resp.content
print "Status code---->" + str(resp.status_code)
print "Text---->" + resp.text
print "Encoding---->" + resp.encoding
resp.encoding = "utf-8"
print "New Text---->" + resp.text
print "New Encoding---->" + resp.encoding

