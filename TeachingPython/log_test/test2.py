#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: test2.py
    @time: 2017/4/23 18:42
"""

import logging

logger = logging.getLogger("simple_example")
formatter = logging.Formatter("%(asctime)s -%(name)s -%(levelname)s -%(message)s")

ch = logging.StreamHandler()
fh = logging.FileHandler("test2.log")

logger.setLevel(logging.DEBUG)
ch.setLevel(logging.DEBUG)
fh.setLevel(logging.INFO)

ch.setFormatter(formatter)
fh.setFormatter(formatter)

logger.addHandler(ch)
logger.addHandler(fh)

logger.debug("debug message")
logger.info("info message")
logger.warn("warn message")
logger.error("error message")