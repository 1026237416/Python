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
import requests
import json
import zipfile
import time
import shutil

try:
    import xml.etree.cElementTree as ElementTree
except ImportError:
    import xml.etree.ElementTree as ElementTree

from log import log
from savereport import S3
from config import *

case_log = log(
    log_name="run_case",
    path=log_path
)


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
            try:
                login_resp = self.session.post(
                    url=login_url,
                    data=login_data
                )
            except Exception as e:
                print(e.message)
                return True
            print(login_resp)
            if int(login_resp.status_code) != 200:
                raise Exception(login_resp.content)

            resp_data = json.loads(login_resp.content)
            print(resp_data)
        except Exception as e:
            err_msg = "Failed to login asset base: %s" % e.message
            print(err_msg)
            return False

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
            case_log.debug("Query all asset info: %s" % assets_infos)
            return assets_infos
        except Exception as e:
            case_log.error("Failed to query assets information: %s" % e.message)
            return False

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
            case_log.debug("Get all asset information: %s" % assets_infos)

            if not assets_infos:
                raise Exception("Failed to query assets information")

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
                case_log.info(
                    "Get case [%s] info: %s" % (asset_name, result_asset_info))
                return True, result_asset_info
            else:
                raise Exception("Get case [%s] info is None!" % asset_name)
        except Exception as e:
            err_msg = "Failed to get %s asset info: %s" % (
                asset_name if asset_name else asset_id, e.message)
            case_log.error(err_msg)
            return False, err_msg

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
                case_log.info("Get [%s] package success, save path: [%s]" % (
                    asset_info.get("name"), save_path))
                return True
            else:
                raise Exception(
                    "Not found case package in path: %s" % save_path)
        except Exception as e:
            case_log.error("Failed to get %s asset package: %s" % (
                asset_info["name"], e.message))
            return False


def create_dir(*args):
    """
    创建案例运行时保存案例压缩包和案例生成报告的文件夹
    @return: 
    """
    for path in args:
        if not os.path.isdir(path):
            os.makedirs(path)


def unzip(zip_path, extract_path):
    """
    将传入路径下zip_path的zip文件解压到指定路径extract_path下
    Args:
        zip_path: zip文件路径
        extract_path: zip文件解压目的路径
    Returns: 解压成功返回True， 失败返回错误信息
    """
    try:
        if os.path.exists(zip_path):
            zip_info = zipfile.ZipFile(zip_path)
            zip_info.extractall(extract_path)
            zip_info.close()
            case_log.info("Extract package [%s] to path [%s] success." % (
                zip_path, extract_path))
            return True
        else:
            raise Exception("No such file or directory: [%s]" % zip_path)
    except Exception as e:
        err_msg = "Failed to extract file [%s]: %s" % (zip_path, e.message)
        case_log.error(err_msg)
        return err_msg


def return_xml_status(report_path, case_name):
    """
    从案例的运行结束生成的报告文件“output.xml”中解析出需要的信息
    @param report_path: 
    @param case_name: 
    @return: 成功返回True和提取到的报告信息， 
             失败返回False和错误信息
    """
    try:
        if not os.path.isfile(report_path):
            raise Exception("No such file: %s" % report_path)
        else:
            elem = ElementTree.parse(report_path).getroot()

            result = []
            for item in elem.iter("stat"):
                result.append(item)

            report_info = result[-1].attrib
            del report_info["id"]
            case_log.info("Get report info: %s" % report_info)
            return True, report_info
    except Exception as e:
        err_msg = "Failed to parser case [%s] report file：%s" % (case_name, e)
        case_log.error(err_msg)
        return False, err_msg


def copy_report_to_local(case_name, process_name):
    """
    将案例运行结束后生成的报告拷贝到指定的report目录，并以执行的格式存储
    @param case_name: 案例名称
    @param process_name: 流程名称
    @return: 拷贝成功返回报告的存储路径
    """
    report_filename = "report.html"
    log_filename = "log.html"
    # output_filename = "output.xml"
    timestamp = time.strftime(date_format, time.localtime(time.time()))

    # 案例的结果会保存到本地的“report_path/process_name/case_name”路径下
    local_report_path = os.path.join(REPORT_PATH, process_name,
                                     "_".join([case_name, timestamp]))

    if not os.path.isdir(local_report_path):
        os.makedirs(local_report_path)

    for filename in [report_filename, log_filename]:
        shutil.copy(src=os.path.join(RESULT_PATH, filename),
                    dst=os.path.join(local_report_path, filename))
        if not os.path.exists(os.path.join(local_report_path, filename)):
            err_msg = ("Not found [%s] report file '%s' in path:%s"
                       % (case_name, filename, local_report_path))
            case_log.error(err_msg)
            return False, err_msg

    return True, local_report_path


def send_report_to_qloud(process_name, case_name, local_path,
                         bucket_name="case"):
    """
    将案例的运行报告拷贝到简云上的共享对象存储上
    :param process_name: 流程名称
    :param case_name: 案例名称
    :param local_path: 案例报告的本地路径
    :param bucket_name: bucket名称
    :return: 案例在简云的对象存储服务器的share url
    """
    s3_client = S3(s3_server_ip=S3_SERVER_IP,
                   s3_server_port=S3_SERVER_PORT,
                   s3_server_user=S3_SERVER_USER,
                   s3_server_pwd=S3_SERVER_PWD)

    # 1、判断bucket是否存在，不存在则创建
    s3_client.create_bucket(bucket_name=bucket_name)

    # 2、获取本地的案例报告下的文件列表,并得到文件的路径
    file_list = [
        os.path.join(local_path, name) for name in os.listdir(local_path) if
        name in NEED_REPORT_FILE
    ]
    if len(file_list) == len(NEED_REPORT_FILE):
        pass
    else:
        pass

    # 3、得到案例存储到S3上的路径（格式：process_name/case_name)
    obj_path = "/".join([process_name, case_name])

    # 4、将本地报告存储到s3上
    for local_file in file_list:
        s3_client.upload_file(
            bucket_name=bucket_name,
            object_path="/".join([obj_path, os.path.basename(local_file)]),
            file_path=local_file
        )

    # 5、获取report.html和log.html的share url
    log_url = s3_client.get_file_share_url(
        bucket_name=bucket_name,
        object_name="/".join([obj_path, "log.html"])
    )
    report_url = s3_client.get_file_share_url(
        bucket_name=bucket_name,
        object_name="/".join([obj_path, "report.html"])
    )
    if str(S3_SERVER_PORT) not in report_url:
        report_url = report_url.replace(S3_SERVER_IP,
                                        ":".join([S3_SERVER_IP,
                                                  str(S3_SERVER_PORT)]))
    if str(S3_SERVER_PORT) not in log_url:
        log_url = log_url.replace(S3_SERVER_IP,
                                  ":".join([S3_SERVER_IP,
                                            str(S3_SERVER_PORT)]))

    url_map = {
        "log.html": log_url,
        "report.html": report_url
    }

    print(url_map)
    return url_map


def report_error(err_msg):
    """
    对异常情况的处理, 当捕获到异常，或者处理非正常流程可调用该方法
    @param err_msg: 错误信息
    @return: 
    """
    print(err_msg)


if __name__ == '__main__':
    S = Asset(host="192.168.11.78", port="8081", user="admin", passwd="pass")
    infos = S.get_asset_info("1.zip")
    print(infos)
    # S.get_asset_package(infos, "test_case.zip")
    # print S.login()
    # from config import log_path
    # print log_path
