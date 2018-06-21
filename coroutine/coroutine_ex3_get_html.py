#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: coroutine_ex3_get_html.py
    @time: 2018/5/27 20:52
    @desc:
"""
import time
import gevent
from urllib.request import urlopen
from gevent import monkey


def get_html(uri):
    print("Get html：%s" % uri)
    data = urlopen(uri).read()
    print("%d bytes received from %s" % (len(data), uri))


if __name__ == '__main__':
    urls = [
        "https://www.baidu.com",
        "https://www.python.org/",
        "https://github.com"
    ]
    start_time = time.time()
    for url in urls:
        get_html(url)
    print("Sync cost time: %s" % str(time.time() - start_time))

    async_start_time = time.time()
    gevent.joinall(
        [gevent.spawn(get_html, url) for url in urls]
    )
    print("异步cost", time.time() - async_start_time)
