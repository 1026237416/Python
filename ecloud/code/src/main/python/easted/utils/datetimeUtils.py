# -*- coding: utf-8 -*-
import datetime
import logging
import time
from dateutil import tz
from functools import wraps

__author__ = 'yangkefeng@easted.com.cn'

YEAR_MONTH_DAY_T = "%Y-%m-%d %H:%M:%S"
YEAR_MONTH_DAY_T_OS = "%Y-%m-%dT%H:%M:%SZ"
YEAR_MONTH_DAY = "%Y-%m-%d"
TIME_24 = "%H:%M:%S"
TIME_12 = "%I:%M:%S"
LOG = logging.getLogger("system")
__all__ = ["date2str", "date2str2", "str2date", "str2date2",
           "str2date_os", "time2epoch", "time2str12", "time2str24",
           "local2utc", "timeit"]


def timeit(func):
    @wraps(func)
    def wrap(*args, **kwargs):
        time.clock()
        result = func(*args, **kwargs)
        print "function: %s, elapsed time: %.3f s" % \
              (func.__name__, time.clock())

        LOG.debug("function: %s, elapsed time: %.3f s" %
                  (func.__name__, time.clock()))
        return result

    return wrap


def date2str(ori_date):
    return ori_date.strftime(YEAR_MONTH_DAY_T)


def date2str2(ori_date):
    return ori_date.strftime(YEAR_MONTH_DAY)


def str2date(str_date):
    return datetime.datetime.strptime(str_date, YEAR_MONTH_DAY_T)


def str2date_os(str_date, tz=True):
    format_ = YEAR_MONTH_DAY_T_OS
    if not tz:
        format_ = format_.rstrip("Z")
    try:
        dt = datetime.datetime.strptime(str_date, format_)
        return dt
    except ValueError, v:
        if len(v.args) > 0 and v.args[0].startswith('unconverted data remains:'):
            dt = datetime.datetime.strptime(str_date[:19], format_)
            return dt
        else:
            raise v


def str2date2(str_date):
    return datetime.datetime.strptime(str_date, YEAR_MONTH_DAY)


def time2str24(ori_time):
    return ori_time.strftime(TIME_24)


def time2str12(ori_time):
    return ori_time.strftime(TIME_12)


def time2epoch(date_time):
    return int((date_time - datetime.datetime.utcfromtimestamp(0)).total_seconds())


def local2utc(date_time):
    return date_time.replace(tzinfo=tz.tzlocal()).astimezone(tz.gettz('UTC')).replace(tzinfo=None)


def utc2local(date_time):
    return date_time.replace(tzinfo=tz.gettz('UTC')).astimezone(tz=tz.tzlocal()).replace(tzinfo=None)


def utcdatetime2localtime():
    """
    :return: 时区 正：东区； 负：西区
    """
    time_interval = datetime.datetime.now() - datetime.datetime.utcnow()
    return time_interval


def get_now_date(format=YEAR_MONTH_DAY_T):
    return datetime.datetime.now().strftime(format)


def timestamp2str(timestamp):
    """
    :param timestamp:
    :return:
    """
    time_array = time.localtime(timestamp)
    return time.strftime(YEAR_MONTH_DAY_T_OS, time_array)


if __name__ == '__main__':
    print timestamp2str(1467000054)

    print time.time()
