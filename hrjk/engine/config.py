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
        env_dist = os.environ
        try:
            if option in env_dist.keys():
                get_data = env_dist.get(option)
            else:
                get_data = self.cf.get(section=section, option=option).strip()
            return get_data if get_data else default
        except (NoOptionError, NoSectionError):
            return default

    @staticmethod
    def port_to_int(value, default_value):
        """
        将端口号转换为int类型
        :param value: 
        :param default_value: 
        :return: 
        """
        if value.isdigit():
            port = int(value)
        else:
            port = int(default_value)
        return port


conf = ReadConf(file_path="setting.conf")

server_port = conf.read_option(section="DEFAULT",
                               option="server_port",
                               default="9000")
server_port = conf.port_to_int(server_port, "9000")

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
    LOG_PATH = conf.read_option(section="DEFAULT",
                                option="LOG_PATH",
                                default=r"E:\auto_case\log\case_engine.log")
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
    LOG_PATH = conf.read_option(section="DEFAULT",
                                option="REPORT_PATH",
                                default=r"/auto_case/log/case_engine.log")

ES_HOST = conf.read_option(section="ElasticSearch",
                           option="ES_HOST",
                           default="192.168.11.20")
ES_PORT = conf.read_option(section="ElasticSearch",
                           option="ES_PORT",
                           default="9200")
ES_PORT = conf.port_to_int(ES_PORT, "9200")

ES_USER = conf.read_option(section="ElasticSearch",
                           option="ES_USER",
                           default="")
ES_PWD = conf.read_option(section="ElasticSearch",
                          option="ES_PASSWORD",
                          default="")

STOMP_HOST = conf.read_option(section="Stomp_server",
                              option="STOMP_HOST",
                              default="192.168.11.20")
STOMP_PORT = conf.read_option(section="Stomp_server",
                              option="STOMP_PORT",
                              default="61613")
STOMP_PORT = conf.port_to_int(STOMP_PORT, "61613")

STOMP_USER = conf.read_option(section="Stomp_server",
                              option="STOMP_USER",
                              default="")
STOMP_PWD = conf.read_option(section="Stomp_server",
                             option="STOMP_PASSWORD",
                             default="")

ASSETS_HOST = conf.read_option(section="asset_server", option="ASSET_HOST",
                               default="192.168.11.25")
ASSETS_PORT = conf.read_option(section="asset_server", option="ASSET_PORT",
                               default="8086")
ASSETS_USER = conf.read_option(section="asset_server", option="ASSET_USER",
                               default="")
ASSETS_PWD = conf.read_option(section="asset_server", option="ASSET_PASSWD",
                              default="")

S3_SERVER_IP = conf.read_option(section="object_server", option="S3_HOST",
                                default="192.168.11.20")
S3_SERVER_PORT = conf.read_option(section="object_server", option="S3_PORT",
                                  default="9001")
S3_SERVER_PORT = conf.port_to_int(S3_SERVER_PORT, "9001")
S3_SERVER_USER = conf.read_option(
    section="object_server",
    option="S3_ACCESS_KEY",
    default="AKIAIOSFODNN7EXAMPLE")
S3_SERVER_PWD = conf.read_option(
    section="object_server",
    option="S3_SECRET_ACCESS_KEY",
    default="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
)

KAFKA_HOST = conf.read_option(section="kafka_server", option="KAFKA_HOST",
                              default="192.168.11.20")

KAFKA_PORT = conf.read_option(section="kafka_server", option="KAFKA_PORT",
                              default="9092")
KAFKA_PORT = conf.port_to_int(KAFKA_PORT, "9092")

KAFKA_PATH = conf.read_option(
    section="kafka_server",
    option="KAFKA_PATH",
    default="/workspace/repository/kafka/kafka_2.11-1.1.0")

date_format = "%Y%m%d%H%M%S"

ASSETS_SERVER = "%s:%s" % (ASSETS_HOST, ASSETS_PORT)
ASSETS_TYPE = "case"

RUN_ERROR = -1
RUN_SUCCESS = 0

NEED_REPORT_FILE = [
    "report.html",
    "log.html"
]

conductor_recv_topic = "EVENT.QLOUD_TEST_ENGINE"
conductor_resp_topic = "EVENT.QLOUD_TEST_ENGINE_ACK"
fount_destination = "/qloud/test_engine_report"

support_exec_type = ["run", "kill", "pause", "resume"]

support_asset_file_type = ["zip"]
default_asset_file_type = "zip"
