# !/usr/bin/env python
# -*- coding: utf-8 -*-

__data__ = "2017/4/4"
__author__ = "liping"

test_list = [11, 15, 17, 12, 19, 21, 14, 13, 66, 41, 10]

for m in range(len(test_list) - 1):
    for n in range(m + 1, len(test_list)):
        if test_list[m] > test_list[n]:
            temp = test_list[n]
            test_list[n] = test_list[m]
            test_list[m] = temp

print test_list
