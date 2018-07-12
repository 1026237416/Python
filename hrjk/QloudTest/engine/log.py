#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: 1026237416@qq.com
    @site: 
    @software: PyCharm
    @file: log.py
    @time: 2018/7/12 10:04
"""
import logging
import os


def log(log_name, path):
    """
    实现日志记录的功能，并设置日志的格式
    @param log_name: 日志的名称
    @param path: 日志存储的路径
    @return: 日志的句柄
    """
    if not os.path.isdir(os.path.dirname(path)):
        os.makedirs(os.path.dirname(path))

    log_format = ("%(asctime)s %(process)s %(name)s %(levelname)s %(pathname)s"
                  " %(funcName)s %(lineno)d %(message)s")
    date_format = "%Y-%m-%d %H:%M:%S %a"

    logger = logging.getLogger(log_name)
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        # 创建handler
        fh = logging.FileHandler(path, encoding="utf-8")
        ch = logging.StreamHandler()

        # 设置输出日志格式
        formatter = logging.Formatter(
            fmt=log_format,
            datefmt=date_format
        )
        # 为handler指定输出格式
        fh.setFormatter(formatter)
        ch.setFormatter(formatter)
        # 为logger添加的日志处理器
        logger.addHandler(fh)
        logger.addHandler(ch)
    return logger
