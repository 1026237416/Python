#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: 折线图1.py
    @time: 2018/5/5 8:00
"""
import numpy as np
from matplotlib import pyplot as plt

x = np.linspace(-10, 10, 100)
y = x ** 2
plt.plot(x, y)
plt.show()
