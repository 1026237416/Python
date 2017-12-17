#!/usr/bin/env python
# -*- coding: utf-8 -*-

__data__ = "2017/4/1"
__author__ = "liping"

import collections

data = ['ACME', 50, '90.1', (2012, 12, 15)]
name, share, price, date = data
print name, share, price, date

name, share, price, (year, month, day) = data
print name, share, price, year, month, day

record = ('Dave', 'dave@example.com', '773-555-1212')
name, email, phone_numbers = record
print name, email, phone_numbers

# 字符计数
c1 = collections.Counter('qqqweasdqwszvb')
print c1
c2 = collections.Counter("aabbbex")
print c2

c1.update(c2)
print c1
print c1['a']
print c1['h']
print c1.most_common(1)
print c1.most_common(2)
print c1.most_common(3)

for item in c1.elements():
    print item

li = [11, 22, 11, 22, 44, 55, 66, 55]
c3 = collections.Counter(li)
print c3

# 有序字典
dic1 = collections.OrderedDict()
dic1["k1"] = 1
dic1["k3"] = 1
dic1["k4"] = 1
dic1["k2"] = 1
print dic1

dic2 = {}
dic2["k1"] = 1
dic2["k3"] = 1
dic2["k4"] = 1
dic2["k2"] = 1
print dic2

dic3 = collections.defaultdict(list)
print dic3
dic3["k1"].append(1)
print dic3
dic3["k1"].append(2)
print dic3

my_tuple = collections.namedtuple('my_tuple', ['x', 'y'])
t = my_tuple(1, 2)
print t
print t.x
print t.y
