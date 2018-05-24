# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models


# Create your models here.

class UserIPInfo(models.Model):
    ip = models.CharField(max_length=40, default="", verbose_name=u"节点IP地址")
    time = models.DateField(auto_now=True, verbose_name=u"更新时间")

    class Meta:
        verbose_name = u"用户访问地址信息"
        verbose_name_plural = verbose_name
        db_table = "useripinfo"


class BrowserInfo(models.Model):
    useragent = models.CharField(max_length=100, default="",
                                 verbose_name=u"用户浏览器Agent信息")
    models.CharField(max_length=256, verbose_name=u"设备唯一ID", default="")
    user_ip = models.ForeignKey("UserIPInfo", on_delete=models.CASCADE)

    class Meta:
        verbose_name = u"用户访问l浏览器信息"
        verbose_name_plural = verbose_name
        db_table = "browserinfo"
