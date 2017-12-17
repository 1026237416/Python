# -*- coding: utf-8 -*-
import logging
import logging.config
import os.path
import re
import socket
from datetime import date, datetime
from subprocess import Popen, PIPE

from tornado import gen

from easted.core.authen import get_user
from easted.log.conf import *
from easted.utils.datetimeUtils import str2date, time2epoch, local2utc
from easted.utils.tornado_subprocess import call_subprocess

CONF = config.CONF
LOG = logging.getLogger('system')
__all__ = [
    'Type',
    'Operator',
    'init',
    'query_operation_log',
    'count_operation_log',
    'write',
    'del_files'
]


class Type(object):
    VM = 'vm'
    VDISK = 'vdisk'
    HOST = 'host'
    NETWORK = 'network'
    USER = 'user'
    TENANT = 'tenant'
    IMAGE = 'image'
    SECUIRTY_GROUP = 'security_group'
    GLOBAL_SETTINGS = 'global_settings'
    SNAPSHOT = 'snapshot'
    LICENSE = 'license'
    APP_TEMPLATE = 'template'
    APP_INSTANCE = 'instance'
    ALARM = 'alarm'


class Operator(object):
    CREATE = 'create'
    UPDATE = 'update'
    DELETE = 'delete'
    ADD = 'add'
    REMOVE = 'remove'
    UPLOAD = "upload"

    """user"""
    CANCEL_ADMIN_ROLE = 'cancel_admin_role'
    SET_ADMIN_ROLE = 'set_admin_role'
    SET_TENANT_ROLE = 'set_tenant_role'
    CANCEL_TENANT_ROLE = 'cancel_tenant_role'
    RESET_PASS = 'reset_pass'
    """tenant"""
    MODIFY_QUOTA = 'modify_quota'
    CRATE_RULE = 'create_rule'
    DELETE_RULE = 'delete_rule'
    ADD_USER = 'add_user'
    REMOVE_USER = "remove_user"
    CONFIG_NETWORK = 'config_network'

    """storage and compute"""
    SET_USER = 'set_user'
    ATTACH = 'attach'
    DETACH = 'detach'

    """security group"""

    """network tenant"""
    CONFIG_IP = 'config_subnet_ip'
    CONFIG_TENANT_IP = 'config_subnet_tenant_ip'
    CONFIG_HOST = 'config_host'
    CONFIG_TENANT_HOST = 'config_subnet_tenant_host'
    CONFIG_TENANT_ADD_HOST = 'add_tenant_host'
    CONFIG_TENANT_DELETE_HOST = 'del_tenant_host'
    CRATE_SUBNET = 'create_subnet'
    DELETE_SUBNET = 'delete_subnet'
    EDIT_SUBNET = 'edit_subnet'

    """image"""
    ONLINE = 'online'
    OFFLINE = 'offline'

    """compute"""
    MODIFY_SETTING = 'modify_setting'
    MIGRATE = 'migrate'
    CREATE_TEMPLATE = 'create_template'
    REBOOT = 'reboot'
    START = 'start'
    SHUTDOWN = 'shutdown'
    DEL_NIC = 'del_ip_port'
    ADD_NIC = 'add_ip_port'

    """backup"""
    RESTORE = 'restore'

    """host"""
    ADD_HOST = "add_host"
    DEL_HOST = "del_host"

    EXECUTE_ACTION = 'execute'


__MB_SIZE = 1048576
__KEYS = map(lambda x: x.strip(')s '), operation_log_format.split('%('))


def init(conf=None):
    global op_logger
    global sl_logger
    if not conf:
        conf = ECLOUD_SERVER_LOG_CONF
    logging.config.dictConfig(conf)
    op_logger = logging.getLogger('operation')

    if haveSyslog:
        sl_logger = logging.getLogger('syslog')


def write(request, typ, obj, operation, comment):
    """write operation log"""
    ecuser = get_user(request)
    user = str(ecuser['name'])
    role = str(ecuser['role'])
    msg = __format_message(user, role, typ, obj, operation, comment)
    __write_message(msg)


def __format_message(user, role, typ, obj, operation, comment):
    """format message"""

    format = {'user': user, 'role': role, 'type': typ, 'object': obj,
              'operation': operation}
    return (operation_log_format % format) + ' ' + '(' + comment + ')'


def __write_message(msg):
    """
    write operation log,  time and host information will
    be added by syslog server, but local file logger can't
    do this, so we must add them
    """
    if haveSyslog:
        # TODO: 数据中心信息没有写入
        sl_logger.info(msg)

    cur_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    op_logger.info(
        cur_time + ' ' + socket.gethostname() + ' ' + 'ecloud' + ' ' + CONF.keystone.region_name + ': ' + msg)


def filter_by_time(lines, start_time, end_time):
    if start_time and end_time:
        return filter(lambda x: start_time <= x[:19] <= end_time, lines)
    elif start_time:
        return filter(lambda x: x[:19] >= start_time, lines)
    elif end_time:
        return filter(lambda x: x[:19] <= end_time, lines)
    else:
        return lines


def count_operation_log(
        start_time=None, end_time=None,
        user=None, role=None, typ=None,
        operation=None, region=None, obj=None, start=0, limit=25):
    if limit < 1:
        return 0
    if start < 0:
        return 0
    files = __find_file_by_time(start_time, end_time)
    cmd = __gen_filter_cmd(files, user, role, typ, operation, obj, region)
    if not cmd:
        return 0
    process = Popen(cmd + "|wc -l", shell=True, stdout=PIPE)
    total = 0
    try:
        while True:
            result = process.stdout.readlines()
            if not result:
                break
            total = result[0].replace("\n", "")
    except Exception, e:
        raise e

    return int(total)


@gen.coroutine
def query_operation_log(
        start_time=None, end_time=None,
        user=None, role=None, typ=None,
        operation=None, region=None, obj=None, fuzzy=False, start=0, limit=25):
    """
    query operation log:
    we for a process to execute grep command to filter lines and
    write the lines into pipe, we must call communicate to wait
    the sub process terminate before the function retrun
    """
    res = {
        "total": 0,
        "records": []
    }
    if limit < 1:
        raise gen.Return(res)
    if start < 0:
        raise gen.Return(res)

    files = __find_file_by_time(start_time, end_time)
    cmd = __gen_filter_cmd(files, user, role, typ, operation, obj, region,
                           fuzzy=fuzzy)
    if not cmd:
        raise gen.Return(res)
    LOG.debug(cmd)
    rs, er = yield call_subprocess(cmd)
    LOG.debug(rs)
    if er:
        LOG.error(er)
    lines = rs.split('\n')
    lines.remove("")
    result = filter_by_time(lines, start_time, end_time)
    result = sorted(result, key=lambda x: x[:19], reverse=True)
    total = len(result)

    rs = list()
    if limit:
        result = result[start:start + limit]
    else:
        result = result[start:]
    for l in result:
        try:
            line = __parse(l)
        except (Exception, TypeError):
            LOG.error("parse log error! %s", l)
            continue
        rs.append(line)
    raise gen.Return({
        "total": total,
        "records": rs
    })


def __set_dict_value(dct, key, value):
    if value:
        dct[key] = value
    else:
        dct[key] = '.*'


def __gen_filter_cmd(files, user, role, typ, operation, obj, region, fuzzy=False):
    format_dict = {
        'user': '', 'role': '', 'type': '',
        'object': ".*" + obj + ".*" if obj else ".*", 'operation': ''
    }
    if not fuzzy and obj:
        format_dict["object"] = obj
    if not files:
        return None

    __set_dict_value(format_dict, 'user', user)
    __set_dict_value(format_dict, 'role', role)
    __set_dict_value(format_dict, 'type', typ)
    __set_dict_value(format_dict, 'operation', operation)

    cmd = '''cat '''
    for f in files:
        cmd += (f + ' ')
    format_str = operation_log_format % format_dict
    if region:
        filter_str = '| grep "%s: %s ("' % (region, format_str)
    else:
        filter_str = '| grep ": %s ("' % format_str
    return cmd + filter_str


def __parse(line):
    """
    split the line and put the fields into a dict
    """
    dct = dict(time='', region='', user='', role='', type='',
               operation='', object='', des='')

    line = line.strip('\n')

    dct['time'] = time2epoch(local2utc(str2date(line[0:19])))
    pos = line.find(': ')
    vals_ = line[pos + 1:].split(' ')
    reg_beg = line[:pos].rfind(' ') + 1
    dct['region'] = line[reg_beg:pos]

    dct[__KEYS[1]] = vals_[1]
    dct[__KEYS[2]] = vals_[2]
    dct[__KEYS[3]] = vals_[3]
    dct[__KEYS[4]] = vals_[4]
    dct[__KEYS[5]] = vals_[5]

    if len(vals_) == 7:
        dct['des'] = vals_[6]
    else:
        for i in range(len(vals_) - 6):
            dct['des'] += (vals_[i + 6] + ' ')
    dct['des'] = dct['des'].strip(' ()')
    return dct


def __find_file_by_time(start_date=None, end_date=None):
    """
    find files between start_date and end_date
    """
    new_files = []
    start_time = None
    end_time = None
    files = os.listdir(ecloud_log_dir)
    start_time_tmp = __transfer_str_to_datetime(start_date)
    end_time_tmp = __transfer_str_to_datetime(end_date)
    if start_time_tmp:
        start_time = start_time_tmp.date()
    if end_time_tmp:
        end_time = end_time_tmp.date()
    today = date.today()

    if None not in [start_time, end_time] and start_time_tmp > end_time_tmp:
        return new_files
    if start_time is not None and today < start_time:
        return new_files

    for one_file in files:
        file_path = os.path.join(ecloud_log_dir, one_file)
        if not os.path.isfile(file_path):
            continue
        if __get_by_opt_file(one_file):
            if start_time is not None and end_time is not None:
                if start_time <= today <= end_time:
                    new_files.append(file_path)
            elif start_time is not None and start_time <= today:
                new_files.append(file_path)
            elif end_time is not None and end_time >= today:
                new_files.append(file_path)
            else:
                new_files.append(file_path)
            continue

        file_time = __get_time_by_file(one_file)
        if file_time is None:
            continue
        if None not in [start_time, end_time]:
            if start_time <= file_time <= end_time:
                new_files.append(file_path)
        elif start_time is not None:
            if file_time >= start_time:
                new_files.append(file_path)
        elif end_time is not None:
            if file_time <= end_time:
                new_files.append(file_path)
        else:
            new_files.append(file_path)
    return new_files


def __get_time_by_file(file_name):
    """
    the format of file like ecloud.log.2015-11-19
    """
    file_date = None
    pattern = 'operation\w*.log.(\d{4}-\d{1,2}-\d{1,2})$'
    result = re.match(pattern, file_name)
    if result:
        date_str = result.groups()[0]
        try:
            file_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError('the filename format is not correct')
    return file_date


def __get_by_opt_file(file_name):
    """
    the format of file like ecloud.log
    """
    pattern = '^operation\w*.log$'
    result = re.match(pattern, file_name)
    return result is not None


def __transfer_str_to_datetime(date_str):
    date_obj = None
    if date_str is None:
        return date_obj
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
    except ValueError:
        raise ValueError('parameter format is not correct')
    return date_obj


def del_files():
    """
    delete files if total size greater than the size of you set
    """
    LOG.debug("*************************************************")
    LOG.debug("***********   Clean    Log   Start   ************")
    LOG.debug("*************************************************")
    current_size = _get_dir_size(CONF.log.file_path)
    if current_size > max_size:
        delete_files = _get_delete_files()
        for each in delete_files:
            if os.path.exists(each):
                os.remove(each)
    LOG.debug("*************************************************")
    LOG.debug("***********   Clean    Log   End   ************")
    LOG.debug("*************************************************")


def _get_delete_files():
    """
    get the file list of need delete
    """
    delete_files = []
    files = os.listdir(ecloud_log_dir)
    pattern = '(ecloud|error)\w*.log.(\d{4}-\d{1,2}-\d{1,2})$'
    date_now = datetime.now()
    for each in files:
        file_name = os.path.join(ecloud_log_dir, each)
        if os.path.isfile(file_name):
            result = re.match(pattern, each)
            if result:
                file_time = datetime.strptime(result.groups()[1], '%Y-%m-%d')
                timedelta = date_now - file_time
                if timedelta.days > max_stay_time:
                    delete_files.append(file_name)
    return delete_files


def _get_dir_size(directory):
    """
    get size of dir, the unit is MB
    """
    size = 0l
    for (root, _, files) in os.walk(directory):
        for name in files:
            try:
                size += os.path.getsize(os.path.join(root, name))
            except:
                continue
    size_gb = float(size) / __MB_SIZE
    return size_gb


def main():
    # with open("/home/megoo/projects/python_projects/timeline.txt") as timeline:
    #     time_line = timeline.readlines()
    # print time_line
    # a = query_operation_log(start_time="2016-07-02 00:00:00", end_time="2016-07-04 23:59:59")

    # pattern = '^operation\w*.log$'
    # result = re.match(pattern, "operation_region.log.2016")

    # print result

    # time_line = sorted(time_line, reverse=True, key=lambda x: x[:19])
    # print time_line
    # import datetime
    # print datetime.datetime.now().strftime("%Y-%m-%d")
    del_files()


if __name__ == '__main__':
    main()
