# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.db import models
from django.utils import timezone

from django.db import models


# Create your models here.

# 记录用户登录信息
class ConnectionInfo(models.Model):
    ssh_host_ip = models.CharField(max_length=40,
                                   default="",
                                   verbose_name=u"SSH用户登录IP",
                                   null=True)
    ssh_host_port = models.CharField(max_length=10,
                                     default='',
                                     verbose_name=u'ssh登录的端口',
                                     null=True)
    ssh_username = models.CharField(max_length=10,
                                    default='',
                                    verbose_name=u'ssh用户名',
                                    null=True)
    ssh_userpasswd = models.CharField(max_length=40,
                                      default='',
                                      verbose_name=u'ssh用户密码',
                                      null=True)
    ssh_rsa = models.CharField(max_length=64,
                               default='',
                               verbose_name=u'ssh私钥')
    rsa_pass = models.CharField(max_length=64,
                                default='',
                                verbose_name=u'私钥的密钥')
    # 0-登录失败,1-登录成功
    ssh_status = models.IntegerField(default=0,
                                     verbose_name=u'用户连接状态,0-登录失败,1-登录成功')
    # 1-rsa登录,2-dsa登录,3-普通用户_rsa登录,4-docker成功,5-docker无法登录
    ssh_type = models.IntegerField(default=0,
                                   verbose_name=u'用户连接类型, '
                                                u'1-rsa登录,'
                                                u'2-dsa登录,'
                                                u'3-ssh_rsa登录,'
                                                u'4-docker成功,'
                                                u'5-docker无法登录')
    # 唯一对象标示
    sn_key = models.CharField(max_length=256,
                              verbose_name=u"唯一设备ID",
                              default="")

    class Meta:
        verbose_name = u'用户登录信息表'
        verbose_name_plural = verbose_name
        db_table = "connection_info"


# 用户登录信息表(交换机、网络设备)
class NetConnectionInfo(models.Model):
    tel_username = models.CharField(max_length=10,
                                    default='',
                                    verbose_name=u'用户名',
                                    null=True)
    tel_user_passwd = models.CharField(max_length=40,
                                       default='',
                                       verbose_name=u'设备用户密码',
                                       null=True)
    tel_en_passwd = models.CharField(max_length=40,
                                     default='',
                                     verbose_name=u'设备超级用户密码',
                                     null=True)
    tel_host_port = models.CharField(max_length=10,
                                     default='',
                                     verbose_name=u'设备登录的端口',
                                     null=True)
    tel_hostip = models.CharField(max_length=40,
                                  default='',
                                  verbose_name=u'设备登录的ip',
                                  null=True)

    # 0-登录失败,1-登录成功
    tel_status = models.IntegerField(default=0,
                                     verbose_name=u'用户连接状态,'
                                                  u'0-登录失败,'
                                                  u'1-登录成功')
    tel_type = models.IntegerField(default=0,
                                   verbose_name=u'用户连接类型, '
                                                u'1-普通用户可登录,'
                                                u'2-超级用户可登录')
    # 唯一对象标示
    sn_key = models.CharField(max_length=256,
                              verbose_name=u"唯一设备ID",
                              default="")

    dev_info = models.ForeignKey('NetWorkInfo', on_delete=True)

    class Meta:
        verbose_name = u'网络设备用户登录信息'
        verbose_name_plural = verbose_name
        db_table = "netconnectioninfo"
