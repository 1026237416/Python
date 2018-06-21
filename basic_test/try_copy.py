#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: try_copy.py
    @time: 2018/4/17 22:43
"""
import copy

lst = ["str1", "str2", "str3", "str4", "str5"]
source_list = ["str1", "str2", "str3", "str4", "str5", lst]
copy_list = copy.copy(source_list)
print("Source:--->", source_list)
print("Copy--:--->", copy_list)
print("-----------------------------------------------------------------------")
source_list.append("sourceStr")
copy_list.append("copyStr")
print("Source:--->", source_list)
print("Copy--:--->", copy_list)
print("-----------------------------------------------------------------------")
source_list[0] = "testChange"
print("Source:--->", source_list)
print("Copy--:--->", copy_list)
print("-----------------------------------------------------------------------")
lst.append("testAppend")
print("Source:--->", source_list)
print("Copy--:--->", copy_list)

