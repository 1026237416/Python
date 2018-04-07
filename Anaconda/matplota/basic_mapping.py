#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: IntelliJ IDEA
# @file: basic_mapping.py
# @time: 2018/03/24 23:09

import matplotlib.pyplot as plt
import numpy as np


# 绘制一条线
x = np.linspace(-np.pi, np.pi, 256, endpoint=True)

c, s = np.cos(x), np.sin(x)
plt.figure(1)
plt.plot(x, c, color="blue", linewidth=1.0, linestyle="-", label="COS", alpha=0.5)
plt.plot(x, s, "r*", label="SIN")
plt.title("SIN&COS")
ax = plt.gca()

ax.spines["right"].set_color("none")
ax.spines["top"].set_color("none")
ax.spines["left"].set_position(("data", 0))
ax.spines["bottom"].set_position(("data", 0))


plt.show()

