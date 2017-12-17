#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: mutliprocess.py
    @time: 2017/5/4 20:29
"""

import pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', passwd='password', db='world')
cursor = conn.cursor(cursor=pymysql.cursors.DictCursor)
r = cursor.execute("show tables")
result = cursor.fetchall()

print result

conn.commit()
cursor.close()
conn.close()
