#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: PyCharm
# @file: test_urllib_request_2.py
# @time: 2017/12/24 20:53

import urllib2

request = urllib2.Request("http://www.zhihu.com")
response = urllib2.urlopen(request)

html_info = response.read()

print html_info
