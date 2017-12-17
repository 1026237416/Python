# -*- coding: utf-8 -*-
import hashlib
import os
import random
import string

__author__ = 'yangkefeng@easted.com.cn'
__all__ = ["md5", "random_password", "random_password_case"]

__ECLOUD_SECURITY = "ECLOUD2015"


def md5(src):
    """ encrypt str to md5
    """
    m = hashlib.md5()
    m.update(src)
    m.update(__ECLOUD_SECURITY)
    return m.hexdigest()


def random_password(length=8):
    """ generate the length of 8 random password
    :param length: password length
    """
    return ''.join(map(lambda xx: (hex(ord(xx))[2:]), os.urandom(16)))[:length]


def random_password_case(length=8):
    """ generate the length of 8 random password
    :param length: password length
    """
    return ''.join(random.sample(string.ascii_letters + string.digits + string.punctuation, length))

