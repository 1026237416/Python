# coding: gbk
# ��Python Cookbook�������²�����Ŀ�������½ڲ���Ҫ��
#    5.7��������Ԫ��ʱ�������е�˳��
#    5.8����ȡ��������С�ļ���Ԫ��
#    5.9����������ϵ�������Ѱ��Ԫ��
#    5.14�����ֵ�����������������
#    5.15�������յ�����ĸ����������ͷ���
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
    l = [ A('����', 29), A('����', 31), A('����', 28) ]
    eq_( func2( l ), [ ('����', 31), ('����', 29), ('����', 28) ] )

def test_func3():
    l = [ 'c', 'A', 'b', 'D' ]
    eq_( func3( l ), ['A', 'b', 'c', 'D'] )

def test_func4():
    l = [ 'ch9.txt', 'ch10.txt', 'ch1.txt', 'ch3.txt', 'ch11.txt' ]
    eq_( func4( l ), [ 'ch1.txt', 'ch3.txt', 'ch9.txt', 'ch10.txt', 'ch11.txt' ] )