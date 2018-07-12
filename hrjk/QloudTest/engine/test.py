# -*- coding:utf-8 -*-
import zipfile
# import wx
import tempfile
import os
import shutil
import platform
from configparser import ConfigParser
from configparser import NoOptionError, NoSectionError

from flask import Flask

ZIP_PATH_WINDOWS = u'E:\\auto_case\\case\\'
ZIP_PATH_LINUX = u''
SAVE_PATH_WINDOWS = u'E:\\auto_case\\result\\'
SAVE_PATH_LINUX = u''


def unzip(zipath, filepath):
    zipinfo = zipfile.ZipFile(zipath)
    zipinfo.extractall(filepath)
    zipinfo.close()


def create_dir():
    sysstr = platform.system()
    print sysstr
    if sysstr == "Windows":
        if not os.path.isdir(ZIP_PATH_WINDOWS):
            os.makedirs(ZIP_PATH_WINDOWS)
            os.makedirs(SAVE_PATH_WINDOWS)
    elif sysstr == "Linux":
        if not os.path.isdir(ZIP_PATH_LINUX):
            os.makedirs(ZIP_PATH_LINUX)
            os.makedirs(SAVE_PATH_LINUX)


def read_conf(config_path):
    cf = ConfigParser()
    cf.read(config_path)

    tmp_data = cf.get(section="DEFAULT1", option="server_port")
    server_port = tmp_data if tmp_data else 9000

    print server_port


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

        if not os.path.isfile(self.file_path):
            pass
        else:
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

#
# # read_conf("setting.conf")
#
# r = ReadConf('setting.conf')
# print r.read_option(section="DEFAULT", option="server_port", default="666")

if __name__ == '__main__':
    from connstomp import MessSendOrRecv
    from config import recv_destination

    # msg = json.dumps({"a": "aa", "b": "bb"})
    msg = {"requestway": "run", "requestinfo": "110", "processName": "myProcess"}
    stompmess = MessSendOrRecv(ip="192.168.11.20")
    stompmess.send_message(message=msg, destination=recv_destination)
    # stompmess.recv_message()
    stompmess.disconnect()



