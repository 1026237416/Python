# coding:utf-8
import commands
import datetime

__all__ = ["check_license_context", "check_hostid", "check_enddate", "get_date_interval",
           "check_nodes"]


# class License():
#     def __init__(self, pri_key, license_path):
#         self.pri_key = pri_key
#         self.license_path = license_path

def check_license_context(context):
    """
        校验license解密后的内容
    :param context:
    :return:
    """
    if isinstance(context, dict) is False:
        return False
    else:
        return True


def check_hostid(context):
    license_hostid = context.get("hostid")
    if license_hostid:
        status, hostid = commands.getstatusoutput("hostid")
        if license_hostid == hostid:
            return True
        else:
            return False
    else:
        return False


def check_enddate(context):
    enddate = context.get("enddate")
    if enddate:
        return True
    else:
        return False


def get_date_interval(context):
    """
    :param context: 授权信息
    :return: 距离结束日期天数， 过期返回false
    """
    enddate = str(context.get("enddate"))
    today = datetime.datetime.today().date()
    enddate = datetime.datetime.strptime(enddate, "%Y-%m-%d").date()
    date_interval = (enddate - today).days
    if date_interval < 0:
        return False
    else:
        return date_interval


def check_nodes(context):
    nodes = context.get("nodes")
    pass


if __name__ == "__main__":
    today = datetime.datetime.today().date()
    print today
    enddate = "2010-11-18"
    s = datetime.datetime.strptime(enddate, "%Y-%m-%d").date()
    print (s - today).days
