# coding:utf-8
"""
@Create:lill
"""
import json
import time

from flask import Flask, request, jsonify

from testrunnerplugin import TestRunnerPlugin
from saveES import ElasticSearch
from stomp_engine import MessSendOrRecv

from common import Asset
from common import create_dir
from common import case_log
from common import unzip
from common import return_xml_status
from common import copy_report_to_local
from common import send_report_to_qloud
from kafka_engine import kafka_engine

from config import *

# 创建案例保存路径
create_dir(RESULT_PATH, ZIP_PATH)

asset = Asset(host=ASSETS_HOST, port=ASSETS_PORT, user=ASSETS_USER,
              passwd=ASSETS_PWD)

app = Flask(__name__)

test_runner_plugin = TestRunnerPlugin()
test_runner_plugin.enable()


# 测试引擎url
@app.route('/case/engine', methods=["POST"])
def case_engine_by_rest():
    """
    监听任务流，获取需执行的测试案例名称，
    从数据库获取对应案例信息并运行案例
    获取的参数：requestway requestinfo
              [run:案例名字，kill:案例名字,pause:案例名字, resume:案例名字]
    @return: 暂定返回执行的最终状态
    """
    # 获取前端数据
    data = json.loads(request.get_data())
    case_log.info("Receive new data ......")
    # 获取requestway & requestinfo
    requestway = data["requestway"]
    # 需获取名字，到数据库取得案例
    requestinfo = data["requestinfo"]
    # 获取流程的名称
    process_name = data["processName"]
    recv_msg = {"requestway": requestway,
                "requestinfo": requestinfo,
                "processName": process_name}
    case_log.info("Received info: %s" % recv_msg)

    if requestway in ["run", "kill", "pause", "resume"]:
        if requestway == "run":
            case_log.info("Start to [run] case......")
            run_rst = run_case(case_name=requestinfo, process_name=process_name)

            status = {'name': requestinfo, "status": run_rst}
        elif requestway == "kill":
            case_log.info("Start to [stop] case......")
            test_runner_plugin.OnStop()
            status = {'name': requestinfo, 'status': 'stop'}
        elif requestway == "pause":
            case_log.info("Start to [pause] case......")
            test_runner_plugin.OnPause()
            status = {'name': requestinfo, 'status': 'pause'}
        else:
            case_log.info("Start to [resume] case......")
            test_runner_plugin.OnContinue()
            status = {'name': requestinfo, 'status': 'resume'}
    else:
        status = {"name": requestinfo, "status": "requestway error!"}
        case_log.error("Received data error: %s" % status)

    # 返回json数据
    case_log.info("Return data: %s" % status)
    return jsonify(status)


def case_engine_by_mq(data, key=None):
    try:
        print("Receive New Message: %s" % data)
        case_log.info("Receive New Message: %s" % data)

        receive_data = json.loads(data)
        case_log.info("Receive new message Key ID: %s" % key)

        if not isinstance(receive_data, dict):
            err_msg = "Receive data is error, data: %s" % receive_data
            raise Exception(err_msg)

        execute_type = str(receive_data.get("requestway", None))
        case_name = str(receive_data.get("requestinfo", None))
        process_name = str(receive_data.get("processName", None))
        parser_data = {"requestway": execute_type, "requestinfo": case_name,
                       "processName": process_name}
        case_log.debug("The data parsed is: %s" % parser_data)

        if not (execute_type and case_name and process_name):
            err_msg = "Receive data is error, data: %s" % receive_data
            raise Exception(err_msg)

        if execute_type not in support_exec_type:
            err_msg = "Receive data is error, not support execute case type!"
            raise Exception(err_msg)
    except Exception as e:
        case_log.error("Receive an error data: %s" % e.message)
    else:
        status = {}
        try:

            if execute_type == "run":
                case_log.info("Start to [run] case......")
                run_rst = run_case(case_name=case_name,
                                   process_name=process_name)
                print(run_rst)
                status = {'name': case_name, "status": run_rst}

                # 9、案例运行结束，将结果通过stomp告知前端，并通知conductor
                case_log.debug("Start send message to fount page......")
                stomp_mess.send_message(message=run_rst,
                                        destination=fount_destination)

            elif execute_type == "kill":
                case_log.info("Start to [stop] case......")
                test_runner_plugin.OnStop()
                status = {'name': case_name, 'status': 'stop'}

            elif execute_type == "pause":
                case_log.info("Start to [pause] case......")
                test_runner_plugin.OnPause()
                status = {'name': case_name, 'status': 'pause'}

            else:
                case_log.info("Start to [resume] case......")
                test_runner_plugin.OnContinue()
                status = {'name': case_name, 'status': 'resume'}

        except Exception as e:
            err_msg = "Execute task failed: %s, return info: %s" % (
                e.message, status)
            case_log.error(err_msg)
            status = {'name': case_name, 'status': status}

        finally:
            conductor_resp_msg = "Execute Case %s finish: %s" % (case_name,
                                                                 str(status))
            case_log.debug(
               "Start to response to conductor: %s" % str(conductor_resp_msg))
            ack_msg = 1
            kafka_client = kafka_engine()
            kafka_client.send_msg(topic_name=conductor_resp_topic,
                                  msg=ack_msg,
                                  key=key)


def run_case(case_name, process_name):
    """
    接收前端任务执行的操作类型为“run”时，会调用该方法来做具体的操作
    @param case_name: 案例的名称
    @param process_name: 流程的名称
    @return: 返回案例的运行结果
    """
    result = {
        "status": RUN_SUCCESS,
        "casename": case_name,
        "processName": process_name,
        "path": "",
        "msg": ""
    }
    try:
        # 登录数据库
        login_status = asset.login()
        if not login_status:
            err_msg = "Failed to login asset base."
            result["status"] = RUN_ERROR
            result["msg"] = err_msg

            case_log.error(result)
            return result
        else:
            if '\.Main' in case_name:
                case_name = case_name.split('\.Main')[0]

            if "." in case_name:
                if case_name.split(".")[-1] in support_asset_file_type:
                    asset_name = case_name
                else:
                    asset_name = ".".join([case_name, default_asset_file_type])
            else:
                asset_name = ".".join([case_name, default_asset_file_type])
            save_path = os.path.join(ZIP_PATH, asset_name)
            case_log.debug("Get asset name is: %s" % asset_name)
            case_log.debug("Asset package save path is: %s" % save_path)

            # 1、从资产信息库获取案例对应的资产信息
            get_status, get_info = asset.get_asset_info(asset_name=asset_name)
            if not get_status:
                # 获取案例的信息失败，返回status为RUN_ERROR及错误信息
                err_msg = "Failed to get asset [%s] information: %s" % (
                    asset_name, get_info)
                result["status"] = RUN_ERROR
                result["msg"] = err_msg

                case_log.error(result)
                return result
            else:
                case_log.info(
                    "Get asset [%s] infos: %s" % (asset_name, get_info))

            # 2、将取出的数据存到本地, 并判断是否获取成功
            get_rst = asset.get_asset_package(asset_info=get_info,
                                              save_path=save_path)
            if not get_rst:
                # 获取案例压缩包失败，返回status为RUN_ERROR及错误信息
                err_msg = "Failed to get asset [%s] package." % asset_name
                result["status"] = RUN_ERROR
                result["msg"] = err_msg

                case_log.error(result)
                return result
            else:
                case_log.info("Get case package success.")

            # 3、解压zip文件内容，解压成功返回True，失败返回错误信息
            case_log.debug("Start to Extract case package......")
            unzip_result = unzip(save_path, ZIP_PATH)
            if unzip_result is not True:
                # 解压案例压缩包失败，返回status为RUN_ERROR及错误信息
                result["status"] = RUN_ERROR
                result["msg"] = unzip_result

                case_log.error(result)
                return result

            # 4、运行案例
            case_log.debug("Start to run case......")
            test_runner_plugin.OnRun(case_name, ZIP_PATH)
            time.sleep(10)

            # 5、解析案例运行结束后生成的"output.xml"文件
            case_log.debug("Start to parser case report output.xml file......")
            status, report_info = return_xml_status(
                report_path=os.path.join(RESULT_PATH, "output.xml"),
                case_name=case_name
            )
            if not status:
                # 解析案例报告失败，直接返回
                result["status"] = RUN_ERROR
                result["msg"] = report_info

                case_log.error(result)
                return result
            else:
                # 解析报告成功,日志记录
                case_log.debug("Get report info is: %s" % report_info)

            # 6、结果上传es
            case_log.debug("Start to save report to ElasticSearch......")
            es = ElasticSearch(
                index_name="showhtml",
                index_type="report",
                ip=ES_HOST
            )
            es.create_index()
            save_es_time = es.index_data(RESULT_PATH)
            case_log.info(
                "Save case [%s] report to ElasticSearch at time: %s" % (
                    asset_name.split(".")[0], save_es_time
                ))

            # 7、案例运行完之后将将结果拷贝到指定的report目录, 并检查
            case_log.debug("Start to copy report file to local path......")
            status, report_msg = copy_report_to_local(case_name=case_name,
                                                      process_name=process_name)
            if not status:
                result["status"] = RUN_ERROR
                result["msg"] = report_msg
                case_log.error(result)
                return result
            else:
                local_path = report_msg
                case_log.info("Save case [%s] report to local path: %s" % (
                    case_name, local_path))

            # 8、将案例的运行报告保存到简云上
            case_log.debug("Start to copy report file to qloud path......")
            qloud_path = send_report_to_qloud(
                process_name=process_name,
                case_name=case_name,
                local_path=local_path
            )
            result["path"] = qloud_path

            return result
    except Exception as e:
        err_msg = "Failed to execute [run] case: %s" % e.message
        result["status"] = RUN_ERROR
        result["msg"] = err_msg
        case_log.error(result)
        return result


def start_application_by_stomp():
    stomp_mess.recv_message(destination=conductor_recv_topic,
                            subscription_id="run_case")
    stomp_mess.run_forever()


def start_application_by_kafka():
    kafka_client = kafka_engine()
    kafka_client.recv_msg(case_engine_by_mq)


def start_application_by_rest():
    app.debug = True
    app.run(host="0.0.0.0", port=int(server_port))


if __name__ == "__main__":
    print("Start engine server......")
    stomp_mess = MessSendOrRecv(ip=STOMP_HOST, callback=case_engine_by_mq)
    start_application_by_kafka()

    # app.debug = True
    # app.run(host="0.0.0.0", port=int(server_port))

    # create_dir()
    # test_runner_plugin = TestRunnerPlugin()
    # test_runner_plugin.enable()
    # test_runner_plugin.OnRun("20180710220735-ywcs.test.WEB",'/auto_case/case')
    # # report_result()
    # info = get_asset_info(asset_name="201.zip")
    # print get_asset_package(info, "201.zip")
    # copy_report_to_local(case_name="aaa")
    # print get_asset_info("2023.zip")

    # stompmess = MessSendOrRecv(ip="192.168.11.20")
    # msg = {
    #     "status": 0,
    #     "path": "/home/case/ds",
    #     "casename": "aaa",
    #     "processName": "a1",
    #     "msg": ""
    # }
    # stompmess.send_message(message=msg)
    # # stompmess.recv_message()
    # stompmess.disconnect()
    # send_report_to_qloud(process_name="aaa",
    #                      case_name="bbb",
    #                      local_path=r"E:\auto_case\result")
