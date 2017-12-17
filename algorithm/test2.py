#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/10/18 22:48
# @Author  : liping
# @File    : test2.py
# @Software: PyCharm


# print bin(10)
# print oct(9)
# print hex(15)
# print int('110001', 2)
# print int("f", 16)
# print int('12', 8)


a = "zsdfghjklkl"
b = "qweasdfahbnl"

num = 0
for char in a:
    if char in b:
        start_index = b.find(char)
        break
    else:
        a = a[1:]
        num += 1

for index in range(len(a)):
    if start_index + index < len(b):
        if b[start_index + index] != a[index]:
            num += 1
    else:
        num += 1
print num
