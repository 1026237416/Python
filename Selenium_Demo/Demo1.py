#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: Demo1.py
    @time: 2018/7/27 16:48
"""
from selenium import webdriver
import time


browser = webdriver.Chrome()
browser.get("https://www.baidu.com/")
browser.find_element_by_name("wd").send_keys("baidu")
browser.find_element_by_id("su").click()
time.sleep(5)
browser.close()
