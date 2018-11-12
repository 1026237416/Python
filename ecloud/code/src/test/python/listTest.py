# -*- coding: utf-8 -*-

__author__ = 'litao@easted.com.cn'


# a = [1,2,3]
#
# print a.count(23) #返回某个值得出现次数
#
# print a.append([4,5])
# # print a.pop()
#
# print a.extend([6,7])


"""字典方法测试"""

# b = {
#     "a":0,
#     "b":1,
#     "c":2
# }
#
# print b.viewvalues()
# print b.keys()
# print b.items()
#
# print b.iteritems()
#
# print b.iterkeys()
#
# for i in b.iterkeys():
#     print i


"""collections_demo"""
from collections import  namedtuple,deque,defaultdict,OrderedDict

a = ["a:1","b:2","c:3"]
"".split()
b = [ i.split(":")[0] for i in a]
print b