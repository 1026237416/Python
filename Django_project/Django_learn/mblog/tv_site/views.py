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

from datetime import datetime
from django.shortcuts import render
from django.http import HttpResponse
from django.template.loader import get_template
# Create your views here.


def tv_center(request, tvno="0"):
    tv_list = [
        {
            "name": "CCTV 1",
            "tvcode": "cctv1"
        },
        {
            "name": "CCTV 6",
            "tvcode": "cctv6"
        },
    ]
    # templates = get_template("tv_center.html")
    now = datetime.now()
    tvno = tvno

    tv = tv_list[int(tvno)]
    # html = templates.render(locals())
    print locals()

    # return HttpResponse(html)

tv_center(11)