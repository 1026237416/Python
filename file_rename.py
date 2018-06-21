#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: file_rename.py
    @time: 2018/4/9 20:29
"""

# import os
#
# file_list = os.listdir(r"H:\\1")

# print(file_list)
# os.rename()

# import time
#
#
# def desc(func):
#     def warpper(*args, **kwargs):
#         print("Into function %s at %s" % (func.__name__, time.time()))
#         func()
#         print("Leave function %s at %s" % (func.__name__, time.time()))
#
#     return warpper
#
#
# @desc
# def func1():
#     print("Step1")
#     print("step2")
#     print("step3")
#
#
# func1()




#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os


replace_list = [
    r"[www.17zixueba.com]",
    r"【www.zxit8.com】"
]


def rename_file(path):
    file_list = os.listdir(path)

    for file in file_list:
        if os.path.isdir(file):
            # for replace in replace_list:
            #     if file.startswith(replace):
            #         new_filename = file.replace(replace, "")
            #         os.rename(file, new_filename)
            #         new_path = os.path.join(path, new_filename)
            #         rename_file(new_path)
            new_path = os.path.join(path, file)
            print(new_path)
            # rename_file(new_path)
        else:
            for replace in replace_list:
                if file.startswith(replace):
                    rename = file.replace(replace, "")
                    os.rename(file, rename)


rename_file(".")


import os

path = "."

file_list = os.listdir(path)
replace = "[www.17zixueba.com]"

for file in file_list:
    if os.path.isdir(file):
        path = os.path.join(path, file)
    else:
        if file.startswith(replace):
            rename = file.replace(replace, "")
            os.rename(file, rename)

