#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: threading_event.py
    @time: 2018/5/25 17:42
    @desc: 用红绿灯来模拟事件
"""

import threading
from time import sleep

event = threading.Event()


def lighter():
    count = 0       # 默认为绿灯

    event.set()
    while True:
        if (count > 4) and (count < 10):  # 当时间大于20，则更改为红灯
            event.clear()  # 清除标志，让车辆等待
            print("\033[41;1mRed light, please waiting......\033[0m")
        elif count > 10:
            event.set()  # 设置标志位， 改为绿灯
            count = 0
        else:
            print("\033[42;1mGreen light, please cross......\033[0m")
        sleep(1)
        count += 1


def car(name):
    while True:
        if event.is_set():  # 已设置标志，即为绿灯情况
            print("The car [%s] running......" % name)
            sleep(1)
        else:
            print("The car [%s] see the red light, waiting for green light." % name)
            event.wait()
            print("The car [%s] see the green light on, start going......." % name)


light = threading.Thread(target=lighter)
car1 = threading.Thread(target=car, args=("aaa",))
light.start()
car1.start()
