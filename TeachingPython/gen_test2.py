#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: gen_test2.py
    @time: 2017/5/4 21:26
"""

import time

user, passwd = "liping", "123qwe"


def auth(auth_type):
    print("auth func:", auth_type)

    def outer_wrapper(func):
        def wrapper(*args, **kwargs):
            if auth_type == "local":
                username = raw_input("username:")
                password = raw_input("password:")
                if "liping" == username and "123qwe" == password:
                    print("User passed authentication")
                    res = func(*args, **kwargs)
                    print("After authentication===========>")
                    return res
                else:
                    exit("用户名或密码错误！！！")
            elif auth_type == "ldap":
                print("LDAP登录")

        return wrapper

    return outer_wrapper


def index():
    print("欢迎来到主页！！！")


@auth(auth_type="local")
def home():
    print("欢迎来到用户首页！！！")
    return "from home"


@auth(auth_type="ldap")
def bbs():
    print("欢迎来到BBS页面！！！")


index()
home()
bbs()
