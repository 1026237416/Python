# -*- coding: utf-8 -*-

__author__ = 'yangkefeng@easted.com.cn'
__all__ = ["is_none_or_empty",
           "if_none_get_empty",
           "is_not_none_or_empty",
           "is_equals",
           "str2boolean",
           "remove_null_string"]


def str2boolean(flag):
    if flag and flag.lower() in ["true", "1", "y", "yes"]:
        return True
    return False


def if_none_get_empty(obj):
    return obj if obj else ""


def is_none_or_empty(ori_obj):
    return ori_obj is None or len(ori_obj) == 0


def is_not_none_or_empty(ori_obj):
    return ori_obj is not None and len(ori_obj) > 0


def is_equals(str1, str2):
    return is_not_none_or_empty(str1) and is_not_none_or_empty(str2) and str1 == str2


def remove_null_string(str1):
    return str1.replace('\t', '').replace('\n', '').replace(' ', '')
