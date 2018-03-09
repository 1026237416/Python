#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: np_create_array.py
    @time: 2018/3/4 17:40
"""

import numpy as np

npArray1 = np.array([1, 2, 3, 4])
print(npArray1)
print(type(npArray1))
print(npArray1.shape)
print(npArray1.dtype)

print("*********************************")
npArray2 = np.array([[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]])
print npArray2
print npArray2.shape
