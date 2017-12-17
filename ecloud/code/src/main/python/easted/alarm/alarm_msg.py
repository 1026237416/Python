# -*- coding: utf-8 -*-
import datetime
import logging

from tornado import gen
from easted.core.consumer import MessageExecuter
from easted import config
from easted.alarm.alarm import insert, insert_or_update, get_time
from easted.alarm.constant import ALARM_VM_REBOOT_MESSAGE, ALARM_VM_STOP_MESSAGE
from easted.alarm.ipmi_snmp import ipmi_lib, assert_feild
from easted.host.host import get_host_by_ipmi
from easted.compute import get_servers_metadata
from easted.core import mail
from easted.utils.cacheUtils import eval_val
from easted.utils.datetimeUtils import date2str, str2date, utc2local
from easted.host.exception import HostNotExist

CONF = config.CONF
LOG = logging.getLogger('system')

__all__ = [
    "snmp_message"
]

vm_message_map = {
    ALARM_VM_REBOOT_MESSAGE:u"重启",
    ALARM_VM_STOP_MESSAGE:u"关机"
}
config.register('alarm.mails', setting_type=config.TYPE_LIST,
                default=[])

alarm_level = {
    "notice": u"注意",
    "warning": u"警告",
    "fatal": u"故障"
}

def __get_sensor_type_code(specific_trap):
    return (0x00ff0000 & specific_trap) >> 16


def __get_event_type_code(specific_trap):
    return (0x0000ff00 & specific_trap) >> 8


def __get_offset(specific_trap):
    return 0x000000ff & specific_trap


def __get_assert(offset):
    return (0x80 & offset) >> 7


def __get_code(offset):
    return 0xf & offset


def __code_to_str(lib, sensor_code, offset):
    for l in lib:
        if l["code"] == sensor_code:
            description = l.get('Description', None)
            if isinstance(description, dict):
                tmp = description.get(__get_code(offset), '')
                s = "%s: %s - %s" % (l['name'], tmp, assert_feild[__get_assert(offset)])
            else:
                s = "%s: %d - %s" % (l['name'], offset, assert_feild[__get_assert(offset)])
            return s
    return None


def __get_level(var_binds):
    level = var_binds[53:55]
    if level == '02':
        l = 'warning'
    elif level < '02':
        l = 'notice'
    else:
        l = 'fatal'
    return l


def __get_time():
    return datetime.datetime.utcnow()


@gen.coroutine
def __get_host_name(ipmi_ip):
    hosts = yield get_host_by_ipmi(ipmi_ip=ipmi_ip)
    if not hosts:
        raise HostNotExist
    host_name = hosts[0]["name"]
    raise gen.Return(host_name)


@gen.coroutine
def snmp_message(body):
    body_dct = eval_val(body)
    LOG.debug("snmp_msg %s" % body)
    specific_trap = body_dct['specific_trap']
    sensor_code = __get_sensor_type_code(specific_trap)
    event_code = __get_event_type_code(specific_trap)
    offset = __get_offset(specific_trap)

    if event_code == 0x6f:
        sensor_lib = ipmi_lib["Sensor_Types"]
        out = __code_to_str(sensor_lib, sensor_code, offset)
    elif 0x00 < event_code < 0x0d:
        event_lib = ipmi_lib["Generic_Event_Types"]
        out = __code_to_str(event_lib, sensor_code, offset)
    else:
        # we can't parse the message, just drop it now
        raise gen.Return(None)
    if not out:
        raise gen.Return(None)
    target = yield __get_host_name(body_dct['host'])
    level = __get_level(body_dct['var_binds'])
    msg = out
    time = __get_time()
    LOG.debug("The time is %s" % time)
    typ = 'host'
    old_time = yield get_time(target, msg)
    LOG.debug("Old time is  %s" % old_time)
    new_mail = True
    if old_time:
        update_or_create_time = old_time['update_at'] \
            if old_time['update_at'] else old_time['create_at']
        LOG.debug("update time is %s" % update_or_create_time)
        if update_or_create_time.day >= time.day:
            new_mail = False
    yield insert_or_update(target, typ, level, msg, date2str(time))
    mail_list = CONF.alarm.mails
    LOG.debug("to_mails: %s, can_mail: %s" % (mail_list, new_mail))
    if mail_list and new_mail:
        params = {
            "target": target,
            "level": alarm_level[level],
            "message": msg,
            "time": date2str(utc2local(time))
        }
        LOG.debug("mail_msg: %s" % params)
        mail.send_mail_task(
            to_list=mail_list,
            subject=u"云主机/宿主机告警",
            template="alarm.html",
            params=params
        )
    else:
        LOG.info("Mail list is empty or don't need send mail!")
    LOG.info("__snmp_message %s: end" % str(specific_trap))


@gen.coroutine
def vm_message(host_name, vm_alarm_type):
    time = __get_time()
    yield insert(host_name, 'vm', 'warning', vm_alarm_type, date2str(time))
    mail_list = CONF.alarm.mails
    if mail_list:
        params = {
            "target": host_name,
            "level": alarm_level['warning'],
            "message": vm_message_map[vm_alarm_type],
           #"time": date2str(utc2local(str2date(time)))
            "time": date2str(utc2local(time))
        }
        LOG.debug("send vm alarm mail: %s" % params)
        mail.send_mail_task(
            to_list=mail_list,
            subject=u"云主机/宿主机告警",
            template="alarm.html",
            params=params
        )
    else:
        LOG.debug("Mail list is empty!")


class PowerOffExecuter(MessageExecuter):
    def event(self):
        return "compute.instance.power_off.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        raise gen.Return(True)

    @gen.coroutine
    def execute(self):
        try:
            metadata = self._message.get("metadata")
            extend = eval(metadata["extend"])
            keepalive = extend.get("keepalive", 0)
            hostname = self._message.get("hostname")
            if keepalive:
                yield vm_message(hostname, ALARM_VM_STOP_MESSAGE)
        except Exception, e:
            LOG.error("vm power off end process error %s" % e)


class ShutDownExecuter(MessageExecuter):
    def event(self):
        return "stop_instance"

    def queue(self):
        return "ecloud-alarm"

    @gen.coroutine
    def prepare(self):
        raise gen.Return(True)

    @gen.coroutine
    def execute(self):
        try:
            uuid = self._message.get("uuid")
            metadata = yield get_servers_metadata(uuid)
            extend = metadata["extend"]
            keepalive = extend.get("keepalive", 0)
            hostname = self._message.get("hostname")
            if keepalive:
                yield vm_message(hostname, ALARM_VM_STOP_MESSAGE)
        except Exception, e:
            LOG.error("vm power off end process error %s" % e)




@gen.coroutine
def main():
    snmptrapd = '{"var_binds": "373030314D53002590A7F2A8000000000055224B5170FFFF202002205' \
                '50A00F1FFFF0000000000197C2A00003406801001085053205374617475732020202020", ' \
                '"host": "10.10.133.220", "specific_trap": 552705}'
    snmptrapd1 = '{"var_binds": "373030314D53002590ADA7C0000000000015224BE9A2FFFF2020022055' \
                '0A00F1FFFF0000000000197C2A00003406801001085053205374617475732020202020",' \
                ' "host": "10.10.133.220", "specific_trap": 552833}'
    yield snmp_message(snmptrapd)

    vm_stop = ''
    # with open("/home/megoo/projects/python_projects/stop.txt") as stop:
    #     vm_stop = stop.readline()
    # print vm_stop
    # yield __vm_message(vm_stop)
    # vm_stop2 = vm_stop.replace("\\", '').replace(': "{', ':{').replace('}"', '}')
    # vm_stop2 = vm_stop2.replace(': "[', ': [').replace(']"', ']').replace("u'", '"').replace("'", '"')
    # vm_stop2 = vm_stop2.replace("null", '""').replace("false", "False").replace("true", "True")
    # vm_body = eval(vm_stop2)
    #
    # nova_object_data = vm_body['oslo.message']['args']['instance']['nova_object.data']
    # target = nova_object_data['hostname']
    # isha = yield get_keepalive(nova_object_data['uuid'])
    # time = nova_object_data['updated_at'].replace('T', ' ')[:19]
    # print target, isha, time
    # print vm_body
    # vm_message = vm_body['oslo.message']['method']
    # print vm_body, vm_message


if __name__ == '__main__':
    from tornado import ioloop
    from easted.core import dbpools
    from easted import log

    log.init()
    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
