#!/usr/bin/env python
# -*- coding:utf-8 -*-
'''
Created on 2017年3月27日

@author: li
'''

import getpass

user_name = raw_input("Please input your access name:")
user_passwd = getpass.getpass("***")

print(user_name)
print(user_passwd)