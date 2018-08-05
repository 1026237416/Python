#!/usr/bin/env python
# -*- coding:utf-8 -*-

# @version: v1.0
# @author: LIPING
# @license: Apache Licence
# @contact: ***
# @site: 
# @software: IntelliJ IDEA
# @file: MessageService.py
# @time: 2018/07/29 12:45
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer

from smtplib import SMTP
from smtplib import SMTPException
from email.mime.text import MIMEText
from email.header import Header

from message.api import MessageService

sender_addr = "imoocd@163.com"
auth_code = "aA111111"


class MessageServiceHandler():
    def send_mobile_message(self, mobile, message):
        print("Send Mobil message to: %s" % mobile)
        print("Message text: %s" % message)
        return True

    def send_email_message(self, email, message):
        print("Send Mobil message to: %s" % email)
        print("Message text: %s" % message)

        message_obj = MIMEText(_text=message,
                               _subtype="plain",
                               _charset="utf-8")
        message_obj["From"] = sender_addr
        message_obj["To"] = email
        message_obj["Subject"] = Header("*******", charset="utf-8")

        try:
            smtp_obj = SMTP(host="smtp.163.com")
            smtp_obj.login(user=sender_addr, password=auth_code)
            smtp_obj.sendmail(from_addr=sender_addr,
                              to_addrs=[email],
                              msg=message_obj.as_string())

            print("Sucess to send message to [%s]!" % email)
        except SMTPException as e:
            print("Failed to send message to [%s]: %s" % (email, e.message))
            return False



if __name__ == '__main__':
    handler = MessageServiceHandler()
    processor = MessageService.Processor(handler)
    transport = TSocket.TServerSocket("localhost", "9090")
    t_factory = TTransport.TFramedTransportFactory()
    p_factory = TBinaryProtocol.TBinaryProtocolAcceleratedFactory()

    server = TServer.TSimpleServer(processor, transport, t_factory, p_factory)
    print("Python thrift service start.......")
    server.serve()
    print("Python thrift service exit.......")
