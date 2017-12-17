#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/10/19 22:10
# @Author  : liping
# @File    : 句子反转.py
# @Software: PyCharm


def get_reverse(strings):
    result = ""
    result_list = []
    str_split = strings.split()
    while len(str_split):
        result_list.append(str_split.pop())

    result = " ".join(result_list)
    return result


if __name__ == '__main__':
    user_input = raw_input("").strip()
    res = get_reverse(user_input)
    print res
