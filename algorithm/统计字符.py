#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/10/22 22:25
# @Author  : liping
# @File    : 统计字符.py
# @Software: PyCharm


if __name__ == '__main__':
    user_input = raw_input("").strip()
    user_input_tmp = user_input.replace(" ", '')
    for char in user_input_tmp:
        if char.isalpha():
            if user_input.count(char) >= 3:
                print char
                break
