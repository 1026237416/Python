#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: opencv_test1.py
    @time: 2017/4/23 15:43
"""

import numpy as np
import cv2

img = cv2.imread("1.jpg")
emptyImage = np.zeros(img.shape, np.uint8)

emptyImage2 = img.copy()

emptyImage3 = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

cv2.imshow("EmptyImage3", emptyImage3)
cv2.waitKey(0)
cv2.destroyAllWindows()




