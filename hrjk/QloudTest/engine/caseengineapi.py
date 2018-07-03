# coding:utf-8
'''
@Create:lill
'''
import json
import platform
import os
import requests
import shutil
import time
import zipfile

from xml.etree import ElementTree as ET
from flask import Flask, request, jsonify
from testrunnerplugin import TestRunnerPlugin
from saveES import ElasticSearch
from connstomp import MessSendOrRecv
from common import Asset, ReadConf

conf = ReadConf(file_path="setting.conf")

server_port = conf.read_option(section="DEFAULT",
                               option="server_port",
                               default="9000")
sys_platform = platform.system()
if sys_platform == "Windows":
    ZIP_PATH = conf.read_option(section="DEFAULT",
                                option="ZIP_PATH",
                                default=u'E:\\auto_case\\case\\')
    RESULT_PATH = conf.read_option(section="DEFAULT",
                                   option="RESULT_PATH",
                                   default=u'/auto_case/case/')
elif sys_platform == "Linux":
    ZIP_PATH = conf.read_option(section="DEFAULT",
                                option="ZIP_PATH",
                                default=u'E:\\auto_case\\result\\')
    RESULT_PATH = conf.read_option(section="DEFAULT",
                                   option="RESULT_PATH",
                                   default=u'/auto_case/result/')

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

ASSETS_HOST = conf.read_option(section="asset_server",
                               option="host")
ASSETS_PORT = conf.read_option(section="asset_server",
                               option="port")
ASSETS_USER = conf.read_option(section="asset_server",
                               option="user")
ASSETS_PWD = conf.read_option(section="asset_server",
                              option="password")

REPORT_PATH = "report"
date_format = "%Y_%m_%d_%H_%M_%S"

ASSETS_SERVER = "%s:%s" % (ASSETS_HOST, ASSETS_PORT)
ASSETS_TYPE = "case"

asset = Asset(host=ASSETS_HOST, port=ASSETS_PORT, user=ASSETS_USER,
              passwd=ASSETS_PWD)

app = Flask(__name__)


# 测试引擎url
@app.route('/case/engine', methods=["POST"])
def CaseEngine():
    """
    监听任务流，获取需执行的测试案例名称，
    从数据库获取对应案例信息并运行案例
    获取的参数：requestway requestinfo
              [run:案例名字，kill:案例名字,pause:案例名字, resume:案例名字]
    @return: 暂定返回执行的最终状态
    """
    # 获取前端数据
    data = json.loads(request.get_data())
    print "Receive new data ......"
    # 获取requestway & requestinfo
    requestway = data["requestway"]
    # 需获取名字，到数据库取得案例
    requestinfo = data["requestinfo"]
    # 获取流程的名称
    process_name = data["processName"]
    # 创建案例保存路径
    create_dir()
    print(
        {"requestway": requestway,
         "requestinfo": requestinfo,
         "processName": process_name}
    )
    test_runner_plugin = TestRunnerPlugin()
    test_runner_plugin.enable()

    if requestway == "run":
        # 登录数据库
        login_status = asset.login()
        if not login_status:
            return "Failed to login asset base."
        else:
            if '\.Main' not in requestinfo:
                asset_name = requestinfo + '.zip'
                save_path = ZIP_PATH + asset_name
            else:
                requestname = requestinfo.split('\.Main')[0]
                asset_name = requestname + '.zip'
                save_path = ZIP_PATH + asset_name

            # 1、从资产信息库获取对应的资产信息
            asset_info = asset.get_asset_info(asset_name=asset_name)
            if not asset_info:
                report_error(
                    "Failed to get asset [%s] information." % asset_name)
            else:
                print(asset_info)
                # 2、将取出的数据存到本地, 并判断是否获取成功
                get_rst = asset.get_asset_package(
                    asset_info=asset_info,
                    save_path=save_path
                )
                if not get_rst:
                    report_error(
                        "Failed to get asset [%s] package." % asset_name)
                else:
                    # 3、解压zip文件内容
                    unzip(save_path, ZIP_PATH)
            # 4、运行案例
            test_runner_plugin.OnRun(requestinfo, ZIP_PATH)
            status = return_status()

            # 5、结果上传es
            es = ElasticSearch(
                index_name="showhtml",
                index_type="report",
                ip=ES_HOST
            )
            es.create_index()
            nowtime = es.index_data(RESULT_PATH)

            # 6、案例运行完之后将将结果拷贝到指定的report目录
            local_path = copy_report_to_local(case_name=requestinfo)

            # 7、将案例的运行报告保存到简云上
            send_report_to_qcloud(src_path=local_path, dst_path="")

            # 8、通过stomp告知前端
            message = {
                "status": 0,
                "qcloud_path": "/case/engine/report",
                "case": requestinfo
            }
            stompmess = MessSendOrRecv(ip=STOMP_HOST)
            stompmess.send_message(message=message)
            stompmess.disconnect()
            status = "OK"
    elif requestway == "kill":
        test_runner_plugin.OnStop()
        status = {'name': requestinfo, 'status': 'stop'}
    elif requestway == "pause":
        test_runner_plugin.OnPause()
        status = {'name': requestinfo, 'status': 'pause'}
    elif requestway == "resume":
        test_runner_plugin.OnContinue()
        status = {'name': requestinfo, 'status': 'pause'}
    else:
        status = ""
    # 返回json数据
    return jsonify(status)


def copy_report_to_local(case_name):
    """
    将案例运行结束后生成的报告拷贝到指定的report目录，并以执行的格式存储
    @param case_name: 案例名称
    @return: 拷贝成功返回报告的存储路径
    """
    report_filename = "report.html"
    log_filename = "log.html"
    output_filename = "output.xml"
    timestamp = time.strftime(date_format, time.localtime(time.time()))

    report_path = os.path.join(REPORT_PATH, "_".join([case_name, timestamp]))

    filename_list = [report_filename, log_filename, output_filename]

    if not os.path.isdir(REPORT_PATH):
        os.mkdir(REPORT_PATH)

    if not os.path.isdir(report_path):
        os.mkdir(report_path)

    for filename in filename_list:
        shutil.copy(src=os.path.join(RESULT_PATH, filename),
                    dst=os.path.join(report_path, filename))

    return report_path


def send_report_to_qcloud(src_path, dst_path):
    """
    将案例的运行报告拷贝到简云指定的目录下
    @param src_path: 
    @param dst_path: 
    @return: 
    """
    pass


def create_dir():
    """
    创建案例运行时保存案例压缩包和案例生成报告的文件夹
    @return: 
    """
    if not os.path.isdir(ZIP_PATH):
        os.makedirs(ZIP_PATH)
    if not os.path.isdir(RESULT_PATH):
        os.makedirs(RESULT_PATH)


def return_status():
    """
    从案例的运行结束生成的报告文件“output.xml”中解析出需要的信息
    @return: 提取到的报告信息
    """
    e = ET.parse(RESULT_PATH + u'output.xml').getroot()

    l = []
    for i in e.iter("stat"):
        l.append(i)
    status = l[-1].attrib
    del status['id']
    return status


def unzip(zip_path, extract_path):
    """
    将传入路径下zip_path的zip文件解压到指定路径extract_path下
    Args:
        zip_path: zip文件路径
        extract_path: zip文件解压目的路径
    Returns: 解压成功返回True， 失败返回False
    """
    try:
        if os.path.exists(zip_path):
            zip_info = zipfile.ZipFile(zip_path)
            zip_info.extractall(extract_path)
            zip_info.close()
            print("Extract package [%s] to path [%s] success." % (
                zip_path, extract_path))
        else:
            raise Exception("No such file or directory: [%s]" % zip_path)
    except Exception as e:
        report_error("Failed to extract file [%s]: %s" % (zip_path, e.message))


def login(user, passwd):
    """
    登录资产信息库，获得访问资产信息库的访问权限
    @param user: 登录资产信息库的用户名
    @param passwd: 登录资产信息库的密码
    @return: 登录成功：True
              登录失败：False
    """
    try:
        login_url = "https://{host}/publisher/apis/authenticate".format(
            host=ASSETS_SERVER
        )
        session = requests.session()
        login_data = json.dumps({
            'username': user,
            'password': passwd,
        })
        r = session.get(login_url, data=login_data, verify=False)
        return r.status_code
    except Exception as e:
        err_msg = "Failed to login asset base: %s" % e.message
        report_error(err_msg)


def report_error(err_msg):
    """
    对异常情况的处理, 当捕获到异常，或者处理非正常流程可调用该方法
    @param err_msg: 错误信息
    @return: 
    """
    print(err_msg)


if __name__ == "__main__":
    app.debug = True
    app.run(host="0.0.0.0", port=int(server_port))
    # create_dir()
    # test_runner_plugin = TestRunnerPlugin()
    # test_runner_plugin.enable()
    # test_runner_plugin.OnRun(
    #     'AUTO_PRO',
    #     '/home/pandas/workspace/linux_windows_qloudTest/case')
    # report_result()
    # info = get_asset_info(asset_name="201.zip")
    # print get_asset_package(info, "201.zip")
    # copy_report_to_local(case_name="aaa")
    # print get_asset_info("2023.zip")
