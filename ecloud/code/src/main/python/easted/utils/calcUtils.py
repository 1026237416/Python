# -*- coding: utf-8 -*-
import math
from functools import wraps

__author__ = 'yangkefeng@easted.com.cn'
__all__ = ["calc_size_gb",
           "convert_to_int",
           "check_quota_type",
           "create_not_beyond_quota",
           "beyond_quota"]

QUOTA_NULL_LIMIT = -1


def calc_size_gb(size, level=0):
    """ memory unit translate, and to ceil
        :param size: memory size
        :param level: unit level,0-kb,1-mb, 2-gb
    """
    if level == 0:
        new_size = size / 1024.0
    elif level == 1:
        new_size = size / 1024.0 / 1024.0
    elif level == 2:
        new_size = size / 1024.0 / 1024.0 / 1024.0
    else:
        new_size = size / 1024.0 / 1024.0 / 1024.0
    return math.ceil(float('%0.2f' % new_size))


def convert_to_int(origin):
    """ convert origin param to int
    :param origin:
    :return:
    """
    try:
        if not isinstance(origin, int):
            origin = int(origin)
    except (TypeError, ValueError), e:
        raise e
    return origin


def check_quota_type(func):
    @wraps(func)
    def check_quota(*args, **kwargs):
        vargs = list(args)
        for i, v in enumerate(args):
            vargs[i] = convert_to_int(v)

        for k, v in kwargs.iteritems():
            kwargs[k] = convert_to_int(v)
        return func(*vargs, **kwargs)

    return check_quota


def create_not_beyond_quota(quota, used_quota):
    """ not beyond quota and used_quota, return can create
    :param quota: quota limit
    :param used_quota: quota usage
    """
    return not beyond_quota(quota, used_quota)


@check_quota_type
def beyond_quota(quota, used_quota):
    """ beyond quota and used_quota, return true
    :param quota: quota limit
    :param used_quota: quota usage
    """
    return True if quota == QUOTA_NULL_LIMIT else quota < used_quota
