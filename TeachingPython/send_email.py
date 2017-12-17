#!/usr/bin/env python
# -*- coding: utf-8 -*-

__data__ = "2017/4/4"
__author__ = "liping"

import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr


def email():
    msg_txt = """24
    emial test
    """
    msg = MIMEText(msg_txt, 'plain', 'utf-8')

    msg['Form'] = formataddr(["liping", '394345768@qq.com'])
    msg['To'] = formataddr(["liping", '1026237416@qq.com'])
    msg['Subject'] = "Mail Test"

    server = smtplib.SMTP("smtp.qq.com", 465)
    server.login("394345768@qq.com", "mushiqianmeng010")
    server.sendmail("394345768@qq.com", ['1026237416@qq.com', ], msg.as_string())
    server.quit()


email()
