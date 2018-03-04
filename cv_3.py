#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: PyCharm
# @file: cv_3.py
# @time: 2018/2/4 11:23

import cv2

image = cv2.imread("img/flower.jpg")
cv2.imwrite("img/flower.png", image)


