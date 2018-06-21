#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: coroutine_ex2_gevent.py
    @time: 2018/5/27 20:39
    @desc: 使用gevent来实现协程间自动切换
"""
import gevent


def foo():
    print("Running in foo")
    gevent.sleep(2)
    print("Explicit context switch to foo again")


def bar():
    print("Explicit context to bar.")
    gevent.sleep(1)
    print("Implicit context switch back to bar")


if __name__ == '__main__':
    gevent.joinall(
        [
            gevent.spawn(foo),
            gevent.spawn(bar)
        ]
    )
