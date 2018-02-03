#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: urls.py
    @time: 2018/1/7 21:17
"""

from django.conf.urls import url
from tv_site.views import tv_center

tv_urlpatterns = [
    url(r"^\d{1}/$", tv_center, name="tv-url")
]