#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: PyCharm
# @file: test_urllib_request_1.py
# @time: 2017/12/24 16:46

import urllib2

response = urllib2.urlopen("http://www.zhihu.com")
html = response.read()
print html

