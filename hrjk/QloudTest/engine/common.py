#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.1
    @author: li
    @site: 
    @software: PyCharm
    @file: common.py
    @time: 2018/6/29 11:23
"""
import os
import requests
import json

from configparser import ConfigParser
from configparser import NoOptionError, NoSectionError


class Asset(object):
    """
    提供对资产信息库的操作，主要包括登录资产信息库，获取资产信息，下载案例包
    """

    def __init__(self, host, port, user, passwd):
        """
        实例化的时候需要提供资产信息库的主机、端口号、访问的用户名密码等信息
        @param host: 资产信息库主机IP
        @param port: 资产信息库主机端口号
        @param user: 访问资产信息库的用户名
        @param passwd: 访问资产信息库的密码
        """
        self.host = host
        self.port = port
        self.user = user
        self.passwd = passwd
        self.asset_server = "%s:%s" % (self.host, self.port)

        self.session = requests.Session()
        self.cookies = None

    def login(self):
        """
        登录资产信息库，获得访问资产信息库的访问权限
        @return: 登录成功：True
                  登录失败：False
        """
        try:
            login_url = "https://{host}/publisher/apis/authenticate".format(
                host=self.asset_server
            )
            login_data = json.dumps(
                {
                    'username': self.user,
                    'password': self.passwd,
                }
            )
            login_resp = self.session.post(
                url=login_url,
                data=login_data
            )
            if int(login_resp.status_code) != 200:
                raise Exception(login_resp.content)

            resp_data = json.loads(login_resp.content)
            print resp_data
        except Exception as e:
            err_msg = "Failed to login asset base: %s" % e.message
            print(err_msg)

    def query_assets(self, assets_type="case"):
        """
        查询资产信息库上对应资产类型的所有资产信息，默认查询的是‘case’类型
        @param assets_type: 资产信息的类型，默认查询类型为case
        @return: assets_infos: 对应资产类型的所有资产清单信息
        """
        try:
            query_url = "http://{host}/assets?type={type}".format(
                host=self.asset_server,
                type=assets_type
            )
            resp = self.session.get(url=query_url)
            resp_data = json.loads(json.loads(resp.content).encode('utf-8'))
            assets_infos = resp_data.get("list", None)
            # print assets_infos
            return assets_infos
        except Exception as e:
            print("Failed to query assets information: %s" % e.message)

    def get_asset_info(self, asset_name=None, asset_id=None):
        """
        根据调用者提供的资产资产名称或者资产ID获取资产的相信信息
        @param asset_name: 资产名称
        @param asset_id: 资产ID
        @return: 成功：asset_info:返回资产详细信息
        """
        try:
            if not (asset_name or asset_id):
                # 若请求方传递的案例名称和案例id均为空则抛出异常
                raise Exception("asset_name or asset_id is None")

            result_asset_info = {}
            assets_infos = self.query_assets(assets_type="case")
            print(assets_infos)
            for info in assets_infos:
                tmp_name = info.get("attributes").get("overview_name")
                get_asset_name = tmp_name[0] if isinstance(tmp_name,
                                                           list) else tmp_name

                if asset_name == get_asset_name or asset_id == str(info["id"]):
                    result_asset_info["name"] = get_asset_name
                    result_asset_info["id"] = str(info["id"])
                    tmp_path = info.get("attributes").get("overview_filepath")
                    result_asset_info["path"] = str(tmp_path[0] if isinstance(
                        tmp_path, list) else tmp_path)
                    result_asset_info["type"] = str(info["type"])
                    result_asset_info["mediaType"] = str(info["mediaType"])

                    break
            if result_asset_info:
                return result_asset_info
            else:
                return False
        except Exception as e:
            print("Failed to get %s asset info: %s" % (
                asset_name if asset_name else asset_id, e.message))

    def get_asset_package(self, asset_info, save_path):
        """
        根据提供的资产信息(asset_info)，从资产服务器上获取对应案例的压缩包，并保存到指定的路径(save_path)
        @param asset_info: 资产的详细信息
        @param save_path: 案例的压缩包下载后保存的位置
        @return: Returns:成功返回True，失败返回False
        """
        try:
            asset_path = asset_info.get("path")
            request_url = "http://{host}/artifact?path={path}".format(
                host=self.asset_server,
                path=asset_path
            )
            resp = self.session.get(url=request_url, stream=True)

            with open(save_path, "wb") as fs:
                for chunk in resp.iter_content(chunk_size=1024 * 10):
                    if chunk:
                        fs.write(chunk)
            if os.path.exists(save_path):
                print("Get case package [%s] success, save path: [%s]" % (
                    asset_info.get("name"), save_path))
                return True
            else:
                return False
        except Exception as e:
            print("Failed to get %s asset package: %s" % (
                asset_info["name"], e.message))
            return False


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


if __name__ == '__main__':
    S = Asset(host="192.168.11.78", port="8081", user="admin", passwd="pass")
    infos = S.get_asset_info("test.zip")
    print infos
    S.get_asset_package(infos, "test.zip")
