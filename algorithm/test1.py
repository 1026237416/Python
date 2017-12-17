#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/10/18 22:27
# @Author  : liping
# @File    : test1.py
# @Software: PyCharm


list_a = [1, 6, 5, 3, 2, 4, 0, 5, 4, 6, 7]

result_list = []

result_list.append(list_a.pop())

for i in list_a:
    for k in range(len(result_list)):
        if i < result_list[k]:
            result_list.insert(k, i)
            break
print result_list
