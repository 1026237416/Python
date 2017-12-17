# coding: gbk
# 《Python Cookbook》第二章测试题目，以下章节不做要求：
#    2.7　随机输入/输出 70 
#    2.8　更新随机存取文件 71 
#    2.10　处理字符串中的zip文件 74 
#    2.11　将文件树归档到一个压缩的tar文件 76 
#    2.12　将二进制数据发送到Windows的标准输出 77 
#    2.13　使用C++的类iostream语法 78 
#    2.14　回退输入文件到起点 80 
#    2.15　用类文件对象适配真实文件对象 83 
#    2.22　计算目录间的相对路径 91 
#    2.23　跨平台地读取无缓存的字符 93 
#    2.24　在Mac OS X平台上统计PDF文档的页数 94 
#    2.25　在Windows平台上修改文件属性 95 
#    2.26　从OpenOffice.org文档中提取文本 96 
#    2.27　从微软Word文档中抽取文本 97 
#    2.28　使用跨平台的文件锁 98 
#    2.29　带版本号的文件名 100 
#    2.30　计算CRC-64循环冗余码校验 102 
from nose.tools import *

def fun1( fn ):
    # 以内存占用最少的方式，统计文件的行数
    # 以“#”开头的注释行，以及空行都不统计
	pass
	
def fun2( fn ):
    # 以最少的代码行数，统计文件的行数
    # 以“#”开头的注释行，以及空行都不统计
    pass

def fun3( zfn, fn ):
     #读取压缩文件zfn中的fn文件内容，并返回
     pass
	 
import os
import fnmatch
def os_walk( path=os.sep.join(__file__.split( os.sep )[:-1]), patterns='*', through=True ):
    """ 使用os.walk()函数遍历目录、查找指定的文件
        @param path：“查找根目录”默认为本程序当前目录(不允许写绝对路径)
        @param patterns：“查找模式”默认为所有文件，可以只指定一种配置模式
        @param through：“是否穿透子目录”默认为穿透
    """
    pass
	

import glob
def glob_glob( path=os.sep.join(__file__.split( os.sep )[:-1]), patterns='*', through=True ):
    """ 使用glob.glob()函数遍历目录、查找指定的文件
        @param path：“查找根目录”默认为本程序当前目录(不允许写绝对路径)
        @param patterns：“查找模式”默认为所有文件，可以只指定一种配置模式
        @param through：“是否穿透子目录”默认为穿透
    """
     #1 是文件，并且与pattern匹配，存储
     #2 是文件但不匹配
     #3 是文件夹，是否穿透（是，继续查找子目录）
    pass
       

import sys
def fun4( pathname, add=False ):
    """ 检验指定模块是否存在于Python默认的搜索路径中
        @param pathname   要查找的模块路径
        @param add        不存在的情况下，是否将其加入到Python默认的搜索路径中
    """
    # 1 默认搜索路径（sys.path）
    # 2 如何追加（list.append()）
    # 3 若 add=True ，需要判定path是否真实存在
    
    #1 在sys.path 中，True
    #2 不在sys.path 中
        # add=True ，判定是否是真是路径，添加（append）
        # add=False，文件路径不存在，False
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
    eq_( os_walk( path=r'C:\Users\Administrator\Desktop\ch02_test' ), [ 'test3.txt', 'test4.txt', 'test5.txt' ] ) # path参数的值视自己实际情况修改
    eq_( os_walk( path=r'C:\Users\Administrator\Desktop\ch02_test', through=False ), [ 'test3.txt', 'test4.txt' ] )

def test_glob_glob():
    eq_( glob_glob( patterns='*.txt' ), ['test1.txt', 'test2.txt', 'test3.txt', 'test4.txt', 'test5.txt' ] )
    eq_( glob_glob( path=r'D:\testdir' ), [ 'test3.txt', 'test4.txt', 'test5.txt' ] )
    eq_( glob_glob( patterns='*.txt', through=False ), [ 'test1.txt', 'test2.txt' ] )
    eq_( glob_glob( path=r'D:\testdir', patterns='*.txt', through=False ), [ 'test3.txt', 'test4.txt' ] )

def test_fun4():
    eq_( fun4( r'D:\tmp' ), False )
    eq_( fun4( r'D:\tmpN' ), False )
    eq_( fun4( r'D:\tmp', add=True ), True ) # D:\tmp目录存在
    eq_( fun4( r'D:\tmpN', add=True ), False ) # D:\tmpN目录不存在