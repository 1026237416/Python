# -*- coding: utf-8 -*-
import logging
import os
import smtplib
from email.header import Header
from email.mime.text import MIMEText

from easted import config
from easted import log
from easted.core.exception import SendMailFailed
from threadpool import GlobalThreadPool

__author__ = 'yangkefeng@easted.com.cn'
__time__ = '16-2-2'

LOG = logging.getLogger('system')
CONF = config.CONF

config.register('mail.template_dir', setting_type=config.TYPE_STR, default="../etc/mail", secret=True)
config.register('mail.smtp_host', setting_type=config.TYPE_STR)
config.register('mail.smtp_port', default=25, setting_type=config.TYPE_INT)
config.register('mail.username', setting_type=config.TYPE_STR)
config.register('mail.password', setting_type=config.TYPE_STR)
config.register('mail.time_out', default=120, setting_type=config.TYPE_INT, secret=True)


def __send_mail(to_list, sub, content):
    mail_user = CONF.mail.username
    mails = mail_user.split('@')
    user = mails[0]

    sender = "%s<%s>" % (user, mail_user)
    content = content.strip('\n')
    content_type = 'html' if content.startswith("<!DOCTYPE html>") and \
                             content.endswith("</html>") else 'plain'
    msg_root = MIMEText(content, content_type, 'utf-8')
    msg_root['Subject'] = Header(sub, 'utf-8')
    msg_root['From'] = sender
    msg_root['To'] = ';'.join(to_list)

    server = smtplib.SMTP(timeout=CONF.mail.time_out)

    try:
        server.connect(host=CONF.mail.smtp_host, port=CONF.mail.smtp_port)
        server.login(user=mail_user, password=CONF.mail.password)
        server.sendmail(from_addr=sender,
                        to_addrs=to_list,
                        msg=msg_root.as_string())
    except Exception, e:
        LOG.error("connect host:%s port:%s and send mail to '%s' has error: %s", CONF.mail.smtp_host, CONF.mail.smtp_port,to_list, e.message)
        raise e
    finally:
        server.quit()


def __read_email_template(template_name):
    tmpl_path = os.path.join(CONF.mail.template_dir, template_name)
    LOG.debug("send mail current path is : %s  tmpl_path is : %s", os.getcwd(), tmpl_path)
    with open(tmpl_path, 'r') as tmpl:
        mail_content = ''.join(tmpl.readlines())
    return unicode(mail_content, "utf-8")


def send_mail(to_list, subject, content=None, template=None, params=None):
    try:
        if not content:
            mail_content = __read_email_template(template)
            if params:
                mail_content = mail_content % params
        else:
            mail_content = content
        __send_mail(to_list=to_list, sub=subject, content=mail_content)
        LOG.debug('send alarm mail success...')
    except Exception, e:
        LOG.error(e)
        raise SendMailFailed()


def send_mail_task(*args, **kwargs):
    GlobalThreadPool().instance.add_task("send mail task",
                                         send_mail,
                                         args=args,
                                         kwargs=kwargs)


if __name__ == '__main__':
    log.init()
    mail_to_list = ["luheng@easted.com.cn"]
    subject = "欢迎使用EASTED ECloud云平台"
    tmpl = "/opt/ecloud/main/etc/mail/create_user.html"
    params = {"user": u"高山",
              "name": "gaoshan",
              "password": "create_user",
              "url": "https://127.0.0.1:8443"
              }
    send_mail_task(
            to_list=["luheng@easted.com.cn"],
            subject=subject,
            template=tmpl,
            params=params
    )
    import time

    time.sleep(10)
