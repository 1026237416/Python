#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: mutliprocess.py
    @time: 2017/4/23 17:52
"""

"""
    CRITICAL = 50
    FATAL = CRITICAL
    ERROR = 40
    WARNING = 30
    WARN = WARNING
    INFO = 20
    DEBUG = 10
    NOTSET = 0
"""

import logging

logging.basicConfig(filename="test1.log",
                    format="%(asctime)s - %(name)s - %(levelname)s - %(module)s: %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S %p",
                    level=logging.DEBUG)

logging.debug("debug")
logging.info("info")
logging.warning("Warning")
logging.critical("critical")
logging.error("error")
