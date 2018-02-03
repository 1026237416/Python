#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: requests_chardet.py
    @time: 2018/1/28 17:38
"""

import requests
import chardet

resp = requests.get("http://www.baidu.com")
print chardet.detect(resp.content)
resp.encoding = chardet.detect(resp.content).get("encoding")
print resp.text
