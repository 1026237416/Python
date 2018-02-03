#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: requests_test1.py
    @time: 2018/1/28 16:27
"""

import requests

payload = {"Keywords": "blog:qiyeboy", "pageindex":1}

r = requests.get(url="http://zzk.cnblogs.com/s/blogpost",
                 params=payload)
print r.url

