#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: 散点图1.py
    @time: 2018/5/4 22:44
"""

from matplotlib import pyplot as plt

height = [161, 180, 168, 155, 169, 175, 170]
weight = [66, 80, 77, 68, 88, 80, 70]

plt.scatter(height, weight)
plt.show()

