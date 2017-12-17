# coding:utf-8
import os, time

from easted import config
from easted.core import file
from easted.utils import datetimeUtils
from license_decode import *
from license_handle import *
from manor.util.generals import trace

config.register("license.license_path",
                default="../etc/downloads/license",
                setting_type=config.TYPE_STR, secret=True)
config.register("license.private_key_path",
                default="../etc/downloads/private_key",
                setting_type=config.TYPE_STR, secret=True)
CONF = config.CONF
LICENSE_PATH = CONF.license.license_path
PRIVATE_KEY_PATH = CONF.license.private_key_path
# LICENSE = "/opt/ecloud/etc/downloads/license"

# LICENSE_PATH = "C:\work\ecloud\code\src\main\etc\downloads\license"
# PRIVATE_KEY_PATH = "C:\work\ecloud\code\src\main\etc\downloads\private_key"
# LICENSE = "C:\work\ecloud\code\src\main\etc\downloads\license"

__all__ = ["license_get", "license_upload", "check_license", "license_exists",
           "pri_key_update", "pri_key_get", "hostid_get"]


def license_get():
    # 校验私钥
    try:
        LOG.debug("============================enter license_get==================================")
        res = license_exists()
        if res:
            pri_key = pri_key_get()
            LOG.debug("pri_key=%s", pri_key)
            if pri_key:
                license_obj = License(pri_key)
                export = __get_secret()
                LOG.debug("export=%s", export)
                context = license_obj.get_hardinfo(export)
                LOG.debug("context=%s", context)
                out_put = {
                    "hostid": context.get("hostid"),
                    # "startdate": int(time.mktime((context.get("startdate")))),
                    "startdate": __strdate2int(str(context.get("startdate"))),
                    "enddate": __strdate2int(str(context.get("enddate"))),
                    # "enddate": int(time.mktime((context.get("enddate")))),
                    "nodes": context.get("nodes"),
                }
                LOG.debug("out_put=%s", out_put)
                return [out_put]
            else:
                raise PrivateKeyNotExists
        else:
            raise LicenseNotExists

    except Exception as e:
        if e.message == PrivateKeyNotExists.msg:
            raise PrivateKeyNotExists
        if e.message == LicenseNotExists.msg:
            raise LicenseNotExists
        LOG.error("get license error:%s" % e)
        LOG.error(trace())
        raise LicenseAnalysisError


def __strdate2int(strdate):
    date = datetimeUtils.str2date2(strdate)
    return datetimeUtils.time2epoch(date)


def license_upload(self, private_key):
    """
        上传授权文件和私钥
    :param private_key:
    :return:
    """
    # 上传license
    try:
        __check_private_key(private_key)
        license_obj = License(private_key)
        file_metas = self.request.files['file']
        export = file_metas[0].get('body')
        context = license_obj.get_hardinfo(export)

        # 校验license类型
        __check_license_type(private_key, export)
        # 校验主机标识
        hostid_ok = check_hostid(context)
        if hostid_ok is False:
            raise HostidNotMatch
        # 校验结束日期
        res = check_enddate(context)
        if res is False:
            raise LicenseOverdue
        else:
            date_interval = get_date_interval(context)

        __check_license_context(context)

        pri_key_update(private_key)
        file.upload(self, LICENSE_PATH)
        return {"date_interval": date_interval}
    except Exception as e:
        LOG.error(e)
        LOG.error(trace())
        raise LicenseUpLoadFailed


def __check_license_context(context):
    """
        hostid: "0a0a7a03"
        startdate: "2010-04-06"
        enddate: "2020-11-21"
        nodes: 100
        version: "1.2.1v"
        customer: "陕西xxx公司"
    :param context:
    :return:
    """
    if "hostid" not in context:
        raise LicenseAnalysisError
    if "startdate" not in context:
        raise LicenseAnalysisError
    if "enddate" not in context:
        raise LicenseAnalysisError
    if "nodes" not in context:
        raise LicenseAnalysisError


def __get_secret():
    try:
        with open(LICENSE_PATH, "r") as f:
            export = f.read()
        return export
    except Exception as e:
        LOG.error("__get_secret error:%s" % e)
        LOG.error(trace())
        raise e


def __check_private_key(private_key):
    if len(private_key) == 0:
        raise PrivateKeyNotExists


def __check_license_type(private_key, export):
    try:
        license_obj = License(private_key)
        context = license_obj.get_hardinfo(export)
        # 校验license格式
        context_exists = check_license_context(context)
        if context_exists is False:
            raise LicenseNotStandard
    except Exception as e:
        LOG.error("__check_license_type error:%s" % e)
        LOG.error(trace())
        raise e


def check_license():
    """
        校验授权文件和私钥
    :return:
    """
    try:
        # 校验私钥
        private_key = pri_key_get()
        if private_key is False:
            raise PrivateKeyNotExists

        # 校验license是否存在
        exist_ok = license_exists()
        if exist_ok is False:
            raise LicenseNotExists

        export = __get_secret()
        license_obj = License(private_key)
        context = license_obj.get_hardinfo(export)
        # 校验license格式
        context_exists = check_license_context(context)
        if context_exists is False:
            raise LicenseNotStandard
        # 校验主机标识
        hostid_ok = check_hostid(context)
        if hostid_ok is False:
            raise HostidNotMatch
        # 校验结束日期
        res = check_enddate(context)
        if res is False:
            raise LicenseOverdue
        else:
            date_interval = get_date_interval(context)
        return {"date_interval": date_interval}
        # 检验节点数
    except Exception as e:
        LOG.error("check license error:%s" % e)
        LOG.error(trace())
        raise e


def license_exists():
    """
        授权文件是否存在
    :return:
    """
    try:
        if os.path.exists(LICENSE_PATH):
            return True
        else:
            return False
    except Exception as e:
        LOG.error("check license exists error:%s" % e)
        LOG.error(trace())
        raise e


def pri_key_update(pri_key):
    """
        修改私钥
    :param pri_key:
    :return:
    """
    if len(pri_key) == 0:
        raise PrivateKeyNotExists
    # if not os.path.exists(PRIVATE_KEY_PATH):
    #     status, output = commands.getstatusoutput("touch %s" % PRIVATE_KEY_PATH)
    if not os.path.exists(PRIVATE_KEY_PATH):
        status, output = commands.getstatusoutput("touch %s" % PRIVATE_KEY_PATH)
    try:
        with open(PRIVATE_KEY_PATH, 'wb') as fileopt:
            fileopt.write(pri_key)
    except Exception as e:
        LOG.error(e)
        LOG.error(trace())
        raise e


def pri_key_get():
    """
        获取私钥
    :return:
    """
    try:
        if os.path.exists(PRIVATE_KEY_PATH):
            with open(PRIVATE_KEY_PATH, 'r') as fileopt:
                pri_key = fileopt.read()
                if pri_key:
                    return pri_key
                else:
                    return None
        else:
            return None
    except Exception as e:
        LOG.error("get license pri key error:%s" % e)
        LOG.error(trace())
        raise LicenseAnalysisError


def hostid_get():
    """
        获取主机标识
    :return:
    """
    try:
        LOG.debug("==========================enter hostid_get=============================")
        status, hostid = commands.getstatusoutput("hostid")
        LOG.debug("status=%s, output=%s", status, hostid)
        if status == 0:
            return hostid
        else:
            raise GetHostIdError
    except Exception as e:
        LOG.error("get hostid error:%s" % e)
        LOG.error(trace())
        raise GetHostIdError



# def license_storage(license_context):
#
#     if os.path.exists(LICENSE_PATH):
#         status, output = commands.getstatusoutput("rm -rf %s" % LICENSE_PATH)
#
#     if not os.path.exists(LICENSE):
#         status, output = commands.getstatusoutput("mkdir %s" % LICENSE)
#     status, output = commands.getstatusoutput("touch %s" % LICENSE_PATH)
#
#     with open(LICENSE_PATH, 'w+') as fileopt:
#         fileopt.write(license_context)


if __name__ == "__main__":
    # check_license()
    s = "2020-11-21"
    created_at = datetimeUtils.str2date2(s)
    a = datetimeUtils.time2epoch(created_at)
    print a
