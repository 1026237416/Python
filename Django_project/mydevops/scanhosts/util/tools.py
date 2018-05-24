#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: tools.py
    @time: 2018/5/10 22:08
"""

from django.core.mail import send_mail
import time

from admin.logger import logger


class SendMail():
    def __init__(self, recv_addr, sub_info, content):
        sub_data = time.strftime(
            format="%Y-%m-%d %H:%M:%S",
            p_tuple=time.localtime()
        )
        self.recv_addr = recv_addr
        self.sub_info = sub_info
        self.content = content

    def send(self):
        try:
            send_mail(
                subject=self.sub_info,
                message=self.content,
                from_email="*********",
                recipient_list=self.recv_addr,
                fail_silently=False
            )
            return True
        except Exception as e:
            print("Failed to send email to [%s]: %s" % (self.recv_addr, str(e)))
            logger.error(
                "Failed to send email to [%s]: %s" % (self.recv_addr, str(e)))
            return False
