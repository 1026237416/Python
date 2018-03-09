#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: np_array_resharp.py
    @time: 2018/3/4 21:43
"""

import numpy as np

array_data = np.arange(30).reshape(6, 5)
print array_data

print array_data.reshape(5, 6)

# 获取矩阵维度
print array_data.ndim
print array_data.size
