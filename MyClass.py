#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: MyClass.py
    @time: 2018/7/9 23:35
    @desc:
"""


# 道生一：传入type
class SayMetaClass(type):

    # 传入三大永恒命题：类名称、父类、属性
    def __new__(cls, name, bases, attrs):
        # 创造“天赋”
        attrs['say_' + name] = lambda self, value, saying=name: print(
            saying + ',' + value + '!')
        # 传承三大永恒命题：类名称、父类、属性
        return type.__new__(cls, name, bases, attrs)


# 一生二：创建类
class Hello(object, metaclass=SayMetaClass):
    pass

class Nihao(object, metaclass=SayMetaClass):
    pass

class Bye(object, metaclass=SayMetaClass):
    pass


# 二生三：创建实列
hello = Hello()
nihao = Nihao()
bye = Bye()

# 三生万物：调用实例方法
hello.say_Hello('world!')
nihao.say_Nihao('nihao!')
bye.say_Bye('Bye!')
