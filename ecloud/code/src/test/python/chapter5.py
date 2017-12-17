# coding: gbk
# 《Python Cookbook》第五章测试题目，以下章节不做要求：
#    5.7　在增加元素时保持序列的顺序
#    5.8　获取序列中最小的几个元素
#    5.9　在排序完毕的序列中寻找元素
#    5.14　给字典类型增加排名功能
#    5.15　根据姓的首字母将人名排序和分组
from nose.tools import *

def func1( d ):
    pass  
        

def func2( l ):
    pass       

def func3( l ):
    pass     
        

def func4( l ):
    pass
	
# ----------------------------------------------------------
def test_func1():
    d = { 3:'a', 1:'b', 2:'c'}
    eq_( func1( d ), [ ('a',3), ('b',1), ('c',2) ] )
    d = { 'a':3, 'b':1, 'c':2 }
    eq_( func1( d ), [ (1,'b'), (2,'c'), (3,'a') ] )

def test_func2():
    class A( object ):
        def __init__( self, name, age ):
            self.name = name
            self.age = age
    l = [ A('张三', 29), A('李四', 31), A('王五', 28) ]
    eq_( func2( l ), [ ('李四', 31), ('张三', 29), ('王五', 28) ] )

def test_func3():
    l = [ 'c', 'A', 'b', 'D' ]
    eq_( func3( l ), ['A', 'b', 'c', 'D'] )

def test_func4():
    l = [ 'ch9.txt', 'ch10.txt', 'ch1.txt', 'ch3.txt', 'ch11.txt' ]
    eq_( func4( l ), [ 'ch1.txt', 'ch3.txt', 'ch9.txt', 'ch10.txt', 'ch11.txt' ] )