#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: context_closing.py
    @time: 2018/7/1 20:28
    @desc:
"""
import contextlib


class MyClose:
    def func(self):
        print("Function")

    def close(self):
        print("release")

    # def __enter__(self):
    #     print("enter")
    #
    # def __exit__(self, exc_type, exc_val, exc_tb):
    #     self.close()


with contextlib.closing(MyClose()) as obj:
    obj.func()
