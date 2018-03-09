#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: np_operation.py
    @time: 2018/3/4 20:58
"""

import numpy as np

array_data = np.array(
    [
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6],
        [3, 4, 5, 6, 7],
        [4, 5, 6, 7, 8],
        # [5, 6, 7, 8, 9]
    ]
)

print array_data.shape
print array_data.max()
print array_data.min()
print array_data.mean()

print array_data.sum()
print array_data.sum(axis=1)
print array_data.sum(axis=0)
