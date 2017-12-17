#!/usr/bin/env python
# -*- coding: utf-8 -*-

__data__ = "2017/3/29"
__author__ = "liping"

dic = {'k1': "name"}

print dic.get('k1', "not found")
print dic.get('k2', "not found")

a = {1: 2}
print a.fromkeys([1, 2, 3], "a")

set_a = set([1, 2, 3])
set_b = set([2, 3])
print set_a.issuperset(set_b)
print set_b.issubset(set_a)