#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: logger_setting.py
    @time: 2018/5/10 22:49
"""

from .basic import BASE_DIR

# logging
logger_fmt = "[%(levelname)1.1s %(asctime)s %(module)s:%(lineno)d %(message)s]"
LOGGING = {
    "version": 1,
    "disable_exiting_loggers": False,
    "formatters": {
        "verbose": {
            "format": logger_fmt,
            "datefmt": "%Y-%m-%d %H:%M:%S"
        },
    },
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "formatter": "verbose",
            "filename": "%s/log.log" % BASE_DIR
        },
    },
    "loggers": {
        "django": {
            "handlers": ["file"],
            "level": "INFO",
            "propagate": True
        }
    }
}
