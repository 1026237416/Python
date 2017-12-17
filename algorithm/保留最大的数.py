#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/10/22 21:39
# @Author  : liping
# @File    : 保留最大的数.py
# @Software: PyCharm

import copy


def get_max_number(number, num):
    number_list = list(number)

    number_tmp = copy.copy(number_list)
    number_tmp.sort()

    pop_number_list = number_tmp[0:num]
    print pop_number_list

    number_list_reverse = copy.copy(number_list)
    number_list_reverse.reverse()
    print number_list_reverse

    for value in pop_number_list:
        number_list_reverse.remove(value)
    result_list = copy.copy(number_list_reverse)
    result_list.reverse()
    print ''.join(result_list)


if __name__ == '__main__':
    number_info = raw_input("Please input first number:").strip()
    if not number_info.isdigit():
        print "Your input not a number!"
        exit(1)

    pop_number = raw_input("Please input second number:").strip()
    if not pop_number.isdigit():
        print "Your input not a number!"
        exit(1)

    get_max_number(number_info, int(pop_number))