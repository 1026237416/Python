#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: mutliprocess.py
    @time: 2017/4/24 22:30
"""

import re

print re.match("a", "asdfghj123we").group()
print re.match("a", "bsdfgahj123we")

print re.search("\d", "asdfghj123we").group()
print re.search("\d+", "asdfghj123we").group()

print re.findall("\d", "asdfghj123we456gf")
print re.findall("\d+", "asdfghj123we456gf")

print re.findall("[^\d]", "asdfghj123w*_e456gf")

print re.split("\d", "asdfghj123we456gf")
print re.split("\d+", "asdfghj123we456gf")

print re.sub("ab", "AB", "ab123dc23aba23ab")
print re.sub("ab", "AB", "ab123dc23aba23ab", count=1)
