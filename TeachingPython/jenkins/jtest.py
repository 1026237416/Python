#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: ??
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: jtest.py
    @time: 2017/4/16 19:12
"""

import jenkins

server = jenkins.Jenkins('http://localhost:8080')
user = server.get_whoami()
version = server.get_version()
print('Hello %s from Jenkins %s' % (user['fullName'], version))