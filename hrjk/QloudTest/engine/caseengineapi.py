# coding:utf-8
'''
@Create:lill
'''
import requests
import zipfile
import platform
import shutil
import json, os, xml.etree.ElementTree as ET
from flask import Flask, request, jsonify
from testrunnerplugin import TestRunnerPlugin
from saveES import ElasticSearch
from connstomp import MessSendOrRecv

# Windows平台的ZIP与result路径
ZIP_PATH_WINDOWS = u'E:\\auto_case\\case\\'
RESULT_PATH_WINDOWS = u'E:\\auto_case\\result\\'
# Linux平台的ZIP与result路径
ZIP_PATH_LINUX = u'\\auto_case\\case\\'
RESULT_PATH_LINUX = u'\\auto_case\\result\\'

app = Flask(__name__)


# 测试引擎url
@app.route('/case/engine', methods=["POST"])
def CaseEngine():
    '''
    监听任务流，获取需执行的测试案例名称，
    从数据库获取对应案例信息并运行案例
    获取的参数：requestway requestinfo
              [run:案例名字，kill:案例名字,pause:案例名字, resume:案例名字]
    :return:暂定返回执行的最终状态
    '''
    # 获取前端数据
    data = json.loads(request.get_data())
    # 获取requestway & requestinfo
    requestway = data["requestway"]
    # 需获取名字，到数据库取得案例
    requestinfo = data["requestinfo"]
    # 创建案例保存路径
    create_dir()
    test_runner_plugin = TestRunnerPlugin()
    test_runner_plugin.enable()

    sysstr = platform.system()
    if sysstr == "Windows":
        fixed_path = ZIP_PATH_WINDOWS
    elif sysstr == "Linux":
        fixed_path = ZIP_PATH_LINUX
    else:
        fixed_path = ZIP_PATH_WINDOWS

    if requestway == "run":
        uuid = "f57636f0-28ad-47e4-b46e-a2930d540307"
        # 登录数据库
        status = login()
        if status == 200:
            if '\.Main' not in requestinfo:
                save_path = fixed_path + requestinfo + u'.zip'
                # 发送请求，获取结果
                result = get(requestinfo, uuid)
            else:
                requestname = requestinfo.split('\.Main')[0]
                save_path = fixed_path + requestinfo + u'.zip'
                # 发送请求，获取结果
                result = get(requestname, uuid)
            # 将取出的数据存到本地
            with open(save_path, "wb") as f:
                f.write(result)
            f.close()
            # 解压zip文件内容
            unzip(save_path, fixed_path)
            # 运行案例
            test_runner_plugin.OnRun(requestinfo, fixed_path)
            status = return_status()
            # 结果上传es
            es = ElasticSearch('showhtml', 'report', '192.168.11.20')
            # 默认创建的index为‘report’
            es.create_index()
            if os.path.isdir(RESULT_PATH_WINDOWS):
                nowtime = es.index_data(RESULT_PATH_WINDOWS)
            elif os.path.isdir(RESULT_PATH_LINUX):
                nowtime = es.index_data(RESULT_PATH_LINUX)
            # 将结果发布到事业总线
            stompmess = MessSendOrRecv()
            stompmess.send_message()
            stompmess.recv_message()
            stompmess.disconnect()
        else:
            return "密码错误"
    elif requestway == "kill":
        test_runner_plugin.OnStop()
        status = {'name': requestinfo, 'status': 'stop'}
    elif requestway == "pause":
        test_runner_plugin.OnPause()
        status = {'name': requestinfo, 'status': 'pause'}
    elif requestway == "resume":
        test_runner_plugin.OnContinue()
        status = {'name': requestinfo, 'status': 'pause'}
    # 返回json数据
    return jsonify(status)


def create_dir():
    '''创建指定路径下的文件夹'''
    sysstr = platform.system()
    if sysstr == "Windows":
        if not os.path.isdir(ZIP_PATH_WINDOWS):
            os.makedirs(ZIP_PATH_WINDOWS)
            os.makedirs(RESULT_PATH_WINDOWS)
    elif sysstr == "Linux":
        if not os.path.isdir(ZIP_PATH_LINUX):
            os.makedirs(ZIP_PATH_LINUX)
            os.makedirs(RESULT_PATH_LINUX)


def rmfile(file_path):
    '''删除临时案例文件'''
    os.remove(rmfile)
    shutil.rmtree(rmfile.split('.zip'))


def return_status():
    '''运行案例处理函数
    :param file_path:
    :return:
    '''
    sysstr = platform.system()
    if sysstr == "Windows":
        e = ET.parse(RESULT_PATH_WINDOWS + u'output.xml').getroot()
    elif sysstr == "Linux":
        e = ET.parse(RESULT_PATH_LINUX + u'output.xml').getroot()

    l = []
    for i in e.iter("stat"):
        l.append(i)
    status = (l[-1].attrib)
    del status['id']
    return status


def unhalfzip(zipinfo, filepath):
    '''将传递的zip文件内容解压到指定路径下
    '''
    zipinfo.extractall(filepath)
    zipinfo.close()


def unzip(zipath, filepath):
    '''将传入路径下的zip文件解压到指定路径下
    '''
    zipinfo = zipfile.ZipFile(zipath)
    zipinfo.extractall(filepath)
    zipinfo.close()


def login():
    '''登录数据库处理函数 访问 Get an asset of a certain type 库
    '''
    HOST = "https://www.showdoc.cc/web/#/73173613871423"
    session = requests.session()
    login_data = json.dumps({
        'password': "abc123456789",
        'submit': 'login',
    })
    r = session.get(HOST, data=login_data, verify=False)
    return r.status_code


def get(name, uuid):
    '''get请求函数
    '''
    url_search = "https://www.showdoc.cc/web/#/QloudID?page_id=419572888985201"
    url = "%s/governance/%s/%s" % (url_search, name, uuid)
    print(url)
    r = requests.get(url, verify=False)
    print(r.text)
    # 解析json 返回数据
    result = json.loads(r.text)
    return result


if __name__ == "__main__":
    app.debug = True
    app.run()
    # create_dir()
    # test_runner_plugin = TestRunnerPlugin()
    # test_runner_plugin.enable()
    # test_runner_plugin.OnRun('AUTO_PRO','E:\\')
