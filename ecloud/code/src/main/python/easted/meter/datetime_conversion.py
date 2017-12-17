#!/usr/bin/env python
# -*- coding: utf-8 -*-

from easted.utils.datetimeUtils import str2date_os


def str2dt(datetime_str):
    """create datetime object with given string.

    :param datetime_str: datetime string that follows certain format.
    :return: datetime object.
    """
    return str2date_os(datetime_str, False)


def utcdt2str(date_time):
    """convert UTC datetime object into string.

    :param date_time: a datetime object.
    :return: formatted string of datetime object.
    """
    return date_time.strftime("%Y-%m-%dT%H:%M:%S")
