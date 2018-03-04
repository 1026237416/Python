#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: cv_3.py
    @time: 2018/2/19 22:51
"""

import os
import cv2
import numpy

randomByteArray = bytearray(os.urandom(120000))
flatNumpyArray = numpy.array(randomByteArray)

grayImage = flatNumpyArray.reshape(300, 400)
cv2.imwrite("randomGray.png", grayImage)

bgrImage = flatNumpyArray.reshape(100, 400, 3)
cv2.imwrite("randomBGR.png", bgrImage)

