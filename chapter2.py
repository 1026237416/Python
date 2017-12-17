# coding: gbk
# ��Python Cookbook���ڶ��²�����Ŀ�������½ڲ���Ҫ��
#    2.7���������/��� 70 
#    2.8�����������ȡ�ļ� 71 
#    2.10�������ַ����е�zip�ļ� 74 
#    2.11�����ļ����鵵��һ��ѹ����tar�ļ� 76 
#    2.12�������������ݷ��͵�Windows�ı�׼��� 77 
#    2.13��ʹ��C++����iostream�﷨ 78 
#    2.14�����������ļ������ 80 
#    2.15�������ļ�����������ʵ�ļ����� 83 
#    2.22������Ŀ¼������·�� 91 
#    2.23����ƽ̨�ض�ȡ�޻�����ַ� 93 
#    2.24����Mac OS Xƽ̨��ͳ��PDF�ĵ���ҳ�� 94 
#    2.25����Windowsƽ̨���޸��ļ����� 95 
#    2.26����OpenOffice.org�ĵ�����ȡ�ı� 96 
#    2.27����΢��Word�ĵ��г�ȡ�ı� 97 
#    2.28��ʹ�ÿ�ƽ̨���ļ��� 98 
#    2.29�����汾�ŵ��ļ��� 100 
#    2.30������CRC-64ѭ��������У�� 102 
from nose.tools import *

def fun1( fn ):
    # ���ڴ�ռ�����ٵķ�ʽ��ͳ���ļ�������
    # �ԡ�#����ͷ��ע���У��Լ����ж���ͳ��
	pass
	
def fun2( fn ):
    # �����ٵĴ���������ͳ���ļ�������
    # �ԡ�#����ͷ��ע���У��Լ����ж���ͳ��
    pass

def fun3( zfn, fn ):
     #��ȡѹ���ļ�zfn�е�fn�ļ����ݣ�������
     pass
	 
import os
import fnmatch
def os_walk( path=os.sep.join(__file__.split( os.sep )[:-1]), patterns='*', through=True ):
    """ ʹ��os.walk()��������Ŀ¼������ָ�����ļ�
        @param path�������Ҹ�Ŀ¼��Ĭ��Ϊ������ǰĿ¼(������д����·��)
        @param patterns��������ģʽ��Ĭ��Ϊ�����ļ�������ָֻ��һ������ģʽ
        @param through�����Ƿ�͸��Ŀ¼��Ĭ��Ϊ��͸
    """
    pass
	

import glob
def glob_glob( path=os.sep.join(__file__.split( os.sep )[:-1]), patterns='*', through=True ):
    """ ʹ��glob.glob()��������Ŀ¼������ָ�����ļ�
        @param path�������Ҹ�Ŀ¼��Ĭ��Ϊ������ǰĿ¼(������д����·��)
        @param patterns��������ģʽ��Ĭ��Ϊ�����ļ�������ָֻ��һ������ģʽ
        @param through�����Ƿ�͸��Ŀ¼��Ĭ��Ϊ��͸
    """
     #1 ���ļ���������patternƥ�䣬�洢
     #2 ���ļ�����ƥ��
     #3 ���ļ��У��Ƿ�͸���ǣ�����������Ŀ¼��
    pass
       

import sys
def fun4( pathname, add=False ):
    """ ����ָ��ģ���Ƿ������PythonĬ�ϵ�����·����
        @param pathname   Ҫ���ҵ�ģ��·��
        @param add        �����ڵ�����£��Ƿ�����뵽PythonĬ�ϵ�����·����
    """
    # 1 Ĭ������·����sys.path��
    # 2 ���׷�ӣ�list.append()��
    # 3 �� add=True ����Ҫ�ж�path�Ƿ���ʵ����
    
    #1 ��sys.path �У�True
    #2 ����sys.path ��
        # add=True ���ж��Ƿ�������·������ӣ�append��
        # add=False���ļ�·�������ڣ�False
    pass               
	
# ----------------------------------------------------------
def test_fun1():
    eq_( fun1( 'test1.txt' ), 10 )
    eq_( fun2( 'test1.txt' ), 10 )

def test_fun3():
    content = """I'm test2.txt's content."""
    eq_( fun3( 'data.zip', 'test2.txt' ), content )
    
def test_os_walk():
    eq_( os_walk( patterns='*.txt' ), ['test1.txt', 'test2.txt', 'test3.txt', 'test4.txt', 'test5.txt' ] )
    eq_( os_walk( patterns='*.txt', through=False ), ['test1.txt', 'test2.txt' ] )
    eq_( os_walk( path=r'C:\Users\Administrator\Desktop\ch02_test' ), [ 'test3.txt', 'test4.txt', 'test5.txt' ] ) # path������ֵ���Լ�ʵ������޸�
    eq_( os_walk( path=r'C:\Users\Administrator\Desktop\ch02_test', through=False ), [ 'test3.txt', 'test4.txt' ] )

def test_glob_glob():
    eq_( glob_glob( patterns='*.txt' ), ['test1.txt', 'test2.txt', 'test3.txt', 'test4.txt', 'test5.txt' ] )
    eq_( glob_glob( path=r'D:\testdir' ), [ 'test3.txt', 'test4.txt', 'test5.txt' ] )
    eq_( glob_glob( patterns='*.txt', through=False ), [ 'test1.txt', 'test2.txt' ] )
    eq_( glob_glob( path=r'D:\testdir', patterns='*.txt', through=False ), [ 'test3.txt', 'test4.txt' ] )

def test_fun4():
    eq_( fun4( r'D:\tmp' ), False )
    eq_( fun4( r'D:\tmpN' ), False )
    eq_( fun4( r'D:\tmp', add=True ), True ) # D:\tmpĿ¼����
    eq_( fun4( r'D:\tmpN', add=True ), False ) # D:\tmpNĿ¼������