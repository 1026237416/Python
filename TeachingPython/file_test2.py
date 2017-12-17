#!/usr/bin/env python
# -*- coding: utf-8 -*-

__data__ = "2017/4/5"
__author__ = "liping"


def fetch(backend):
    fetch_list = []
    with open('ha') as obj:
        flag = False
        for line in obj:
            if line.strip() == "backend %s" % backend:
                flag = True
                continue
            if flag and line.strip().startswith('backend'):
                break
            if flag and line.strip():
                fetch_list.append(line.strip())
    return fetch_list


result = fetch("buy.oldboy.com")
print result
