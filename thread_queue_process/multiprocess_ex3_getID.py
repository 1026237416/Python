#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: multiprocess_ex3_getID.py
    @time: 2018/5/27 0:16
    @desc: 通过os模块的getpid()和getppid()来获取进程及其父进程的ID
"""
import os

if __name__ == '__main__':
    print("Process ID: %s" % os.getpid())
    print("Parent process id:%s" % os.getppid())

