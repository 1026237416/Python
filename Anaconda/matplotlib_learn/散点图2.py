#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site:
    @software: PyCharm
    @file: 散点图2.py
    @time: 2018/5/4 22:50
"""
import numpy as np
from matplotlib import pyplot as plt

N = 1000

# x与y无相关性
x = np.random.randn(N)
y = np.random.randn(N)
plt.scatter(x, y)
plt.show()

# x与y相关性
y1 = x + np.random.randn(N) * 0.5
plt.scatter(x, y1)
plt.show()

# 外观调整
# 颜色：    c
# 点大小：  s
# 透明度：  alpha
# 点形状：  marker

plt.scatter(x, y1, s=5, c="r", marker=">")
plt.show()
