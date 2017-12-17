#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: PyCharm
# @file: pickle_test.py
# @time: 2017/11/14 20:02

try:
    import cPickle as pickle
except ImportError:
    import pickle

data = dict(
    url="index.html",
    title="首页",
    content="首页"
)

with open("test.txt", "wb") as fs:
    pickle.dump(data, fs)

with open("test.txt", "rb") as rfs:
    load_data = pickle.load(rfs)
    print load_data
