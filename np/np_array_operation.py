#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: np_array_operation.py
    @time: 2018/3/4 21:49
"""

import numpy as np
from numpy import random
from numpy import pi

# 矩阵初始化
array_data_1 = np.zeros((3, 5))
print array_data_1
print "**********************************************"

array_data_2 = np.ones((3, 5))
print array_data_2
print "**********************************************"

array_data_3 = random.random((3, 3))
print array_data_3
print "**********************************************"

array_data_4 = np.linspace(1, pi, 50)
print array_data_4
print "**********************************************"

# 矩阵相加减
array_data_5 = np.array(
    [
        [1, 2, 3, 4],
        [1, 2, 3, 4]
    ]
)

array_data_6 = np.array(
    [
        [2, 3, 4, 5],
        [6, 7, 8, 9]
    ]
)

print array_data_5 + array_data_6
print "**********************************************"
print array_data_6 - array_data_5
print "**********************************************"

array_data_7 = array_data_6.reshape(4, 2)
print array_data_7
print "**********************************************"
print np.dot(array_data_6, array_data_7)
print "**********************************************"

array_data_8 = np.floor(np.random.random((3, 4)) * 10)
print array_data_8
print "**********************************************"

print array_data_8.ravel()
print "**********************************************"

array_data_8.shape = (2, -1)
print array_data_8
print "**********************************************"
# 矩阵转置
print array_data_8.T
print "**********************************************"

# 常数 e
print np.exp(1)
print "**********************************************"
print np.exp(np.arange(3))
print "**********************************************"

# 开根号
print np.sqrt(4)
print "**********************************************"

# 拼接
array_data_9 = np.floor(np.random.random((2, 4)) * 10)
array_data_10 = np.floor(np.random.random((2, 4)) * 10)
print array_data_9
print "**********************************************"
print array_data_10
print "**********************************************"
print np.vstack((array_data_9, array_data_10))
print "**********************************************"
print np.hstack((array_data_9, array_data_10))
print "**********************************************"
# 切片
print np.hsplit(array_data_10, 2)
print "**********************************************"
print np.vsplit(array_data_10, 2)
print "**********************************************"
# 最大元素
print array_data_10.argmax(axis=1)
print "**********************************************"
print array_data_10.argmax(axis=0)
print "**********************************************"
print np.tile(array_data_10, (2, 2))
print "**********************************************"
# 排序
print np.sort(array_data_10, axis=0)
print "**********************************************"
print np.sort(array_data_10, axis=1)
print "**********************************************"

# 排序输出位置
print np.argsort(array_data_10, axis=1)
