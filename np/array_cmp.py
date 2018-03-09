#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: array_cmp.py
    @time: 2018/3/4 20:04
"""

import numpy as np

array_data = np.array([1, 2, 3, 4, 5, 6])

# if array_data == 5:
#     print "******"
# else:
#     print "######"

print array_data == 5

array_data = np.array([[1, 2, 3, 4, 5, 6],
                       [2, 3, 4, 5, 6, 7]])

print array_data == 3

print array_data[:, 2] == 3
print array_data[1, :] == 3