# -*- coding:utf-8 -*-
'''
Created on 2016��4��10��

@author: liping
'''
import numpy as np
import cv2

img = cv2.imread('cv_test.png', 0)
cv2.imshow('image', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
