# -*- coding: utf-8 -*-

__author__ = 'litao@easted.com.cn'


class Parent(object):
    def __init__(self):
        print "parent"


class Children(Parent):
    def __init__(self):
        Parent.__init__(self)
        print "children"


if __name__ == '__main__':
   children = Children()