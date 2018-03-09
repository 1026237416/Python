#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: np_get_file.py
    @time: 2018/3/4 19:44
"""

import numpy as np

numpy_data = np.genfromtxt("data", delimiter=",", dtype=str)
print numpy_data
print numpy_data.shape
print numpy_data[0, 0]

print numpy_data[1:]
print numpy_data[:, 2]
print numpy_data[:, 0:1]
