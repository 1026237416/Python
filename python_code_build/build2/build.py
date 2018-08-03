#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: build.py
    @time: 2018/8/2 14:58
"""
import os
import compileall

code_path = r"D:\engine"
compileall.compile_dir(code_path)


def traverse(path):
    file_list = []
    for root_path, dirs, fs in os.walk(path):
        for one_file in fs:
            file_list.append(os.path.join(root_path, one_file))
    return file_list


for f in traverse(code_path):
    print f
    if f.endswith(".py"):
        os.remove(f)

