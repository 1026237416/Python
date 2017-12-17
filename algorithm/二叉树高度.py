#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/10/19 22:54
# @Author  : liping
# @File    : 二叉树高度.py
# @Software: PyCharm\


def get_tree_length(input_list):
    tree_dict = {}
    tree_info = []
    for node in input_list:
        k, v = node.split()
        tree_info.append([k, v])

    k_list = []
    for k, v in tree_info:
        print k, v


if __name__ == '__main__':
    node_number = raw_input().split()
    user_input_node_info = []
    user_input = True
    while user_input:
        user_input = raw_input()
        user_input_node_info.append(user_input)
    user_input_node_info.pop()
    get_tree_length(user_input_node_info)
