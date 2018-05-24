# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render

# Create your views here.
import json

from django.http import HttpResponse
from .models import UserIPInfo
from .models import BrowserInfo

from admin.logger import logger


def user_info(request):
    ip_addr = request.META["REMOTE_ADDR"]
    user_ua = request.META["HTTP_USER_AGENT"]

    user_obj = UserIPInfo.objects.filter(ip=ip_addr)
    if not user_obj:
        res = UserIPInfo.objects.create(ip=ip_addr)
        ip_addr_id = res.id
        logger.info("Add host ip [%s] to database" % ip_addr)
    else:
        logger.info("IP [%s] already exist in database." % ip_addr)
        ip_addr_id = user_obj[0].id

    BrowserInfo.objects.create(
        useragent=user_ua,
        user_ip_id=ip_addr_id
    )

    result = {
        "STATUS": "success",
        "INFO": "User Info",
        "IP": ip_addr,
        "UA": user_ua
    }
    return HttpResponse(json.dumps(result), content_type="application/json")


def user_history(request):
    ip_list = UserIPInfo.objects.all()
    info = {}
    for item in ip_list:
        info[item.ip] = [b_obj.useragent for b_obj in
                         BrowserInfo.objects.filter(user_ip_id=item.id)]
    result = {
        "STATUS": "success",
        "INFO": info
    }

    return HttpResponse(json.dumps(result), content_type="application/json")
