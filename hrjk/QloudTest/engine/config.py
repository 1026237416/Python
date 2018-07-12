#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @software: PyCharm
    @file: config.py
    @time: 2018/7/2 9:58
"""
import platform
import os

from configparser import ConfigParser
from configparser import NoOptionError, NoSectionError


class ReadConf(object):
    """
    读取系统运行时需要配置的参数，包括：
        flask运行的端口号
        ElasticSearch主机的IP、端口号、用户名密码
        stomp主机的IP、端口号、用户名密码
        资产信息库asset的IP、端口号、用户名密码
    """

    def __init__(self, file_path):
        self.file_path = file_path

        self.cf = ConfigParser()
        self.cf.read(self.file_path)

    def read_option(self, section, option, default=""):
        """
        读取配置文件中配置的参数， 若选项没有配置，则配置为default配置的值
        @param section: session名称
        @param option: option名称
        @param default: 默认值
        @return: 获取到的值或者默认值
        """
        try:
            get_data = self.cf.get(section=section, option=option)
            return get_data if get_data else default
        except (NoOptionError, NoSectionError):
            return default


conf = ReadConf(file_path="setting.conf")

server_port = conf.read_option(section="DEFAULT",
                               option="server_port",
                               default="9000")
sys_platform = platform.system()
if sys_platform == "Windows":
    ZIP_PATH = conf.read_option(section="DEFAULT",
                                option="ZIP_PATH",
                                default=r'E:\auto_case\case')
    RESULT_PATH = conf.read_option(section="DEFAULT",
                                   option="RESULT_PATH",
                                   default=r"E:\auto_case\result")
    REPORT_PATH = conf.read_option(section="DEFAULT",
                                   option="REPORT_PATH",
                                   default=r"E:\auto_case\report")
elif sys_platform == "Linux":
    ZIP_PATH = conf.read_option(section="DEFAULT",
                                option="ZIP_PATH",
                                default='/auto_case/case/')
    RESULT_PATH = conf.read_option(section="DEFAULT",
                                   option="RESULT_PATH",
                                   default='/auto_case/result/')
    REPORT_PATH = conf.read_option(section="DEFAULT",
                                   option="REPORT_PATH",
                                   default=r"/auto_case/report/")

ES_HOST = conf.read_option(section="ElasticSearch",
                           option="host")
ES_PORT = conf.read_option(section="ElasticSearch",
                           option="port",
                           default="9200")
ES_USER = conf.read_option(section="ElasticSearch",
                           option="user",
                           default="")
ES_PWD = conf.read_option(section="ElasticSearch",
                          option="password",
                          default="")

STOMP_HOST = conf.read_option(section="Stomp_server",
                              option="host")
STOMP_PORT = conf.read_option(section="Stomp_server",
                              option="port",
                              default="61613")
STOMP_USER = conf.read_option(section="Stomp_server",
                              option="user",
                              default="")
STOMP_PWD = conf.read_option(section="Stomp_server",
                             option="password",
                             default="")

ASSETS_HOST = conf.read_option(section="asset_server", option="host")
ASSETS_PORT = conf.read_option(section="asset_server", option="port")
ASSETS_USER = conf.read_option(section="asset_server", option="user")
ASSETS_PWD = conf.read_option(section="asset_server", option="password")

S3_SERVER_IP = conf.read_option(section="object_server", option="ip")
S3_SERVER_PORT = int(conf.read_option(section="object_server", option="port"))
S3_SERVER_USER = conf.read_option(section="object_server", option="access_key")
S3_SERVER_PWD = conf.read_option(section="object_server",
                                 option="secret_access_key")

date_format = "%Y%m%d%H%M%S"

ASSETS_SERVER = "%s:%s" % (ASSETS_HOST, ASSETS_PORT)
ASSETS_TYPE = "case"

QLOUD_PATH = "/auto_case/result/"

log_path = os.path.join(os.path.dirname(RESULT_PATH), "case.log")


RUN_ERROR = -1
RUN_SUCCESS = 0

NEED_REPORT_FILE = [
    "report.html",
    "log.html"
]

recv_destination = "/case/engine"
send_destination = "/queue/test_case"

support_exec_type = ["run", "kill", "pause", "resume"]
