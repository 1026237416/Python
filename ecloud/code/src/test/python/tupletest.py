# -*- coding: utf-8 -*-

__author__ = 'litao@easted.com.cn'

class A(object):
    a = set()
    def hi(self):
        self.a.add(3)


A.a.add(1)
print A().a
A.a.add(2)
b = A()
b.hi()
print b.a

t = set((1,2,3))

t.add(2)
print t