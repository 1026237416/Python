# -*- coding: utf-8 -*-
import logging
import re
import subprocess
from easted.utils.tornado_subprocess import call_subprocess
from easted.compute import get_host_by_stategy, get_vms_nics

try:
    import json
except ImportError:
    import simplejson as json
from tornado import gen

from easted.config import CONF
from easted.core import dbpools
from easted.utils import required, ping
from easted.host.host import get_migrate_available_host
from constant import *
from exception import LiveMigrateVmStatusError, \
    ColdMigrateVmStatusError, \
    MigrateBeyondDomain, MigrateFailed, HostUnAvailable
from server import get_server, list_server
from common import live_migrate_request, add_server_meta, server_action, Control
from easted.host.host import list_simple_hosts
from easted import config
from easted.core.consumer import MessageExecuter

CONF = config.CONF
MIGRATE_COLD, MIGRATE_LIVE = 'COLD_MIGRATE', 'LIVE_MIGRATE'

__author__ = 'litao@easted.com.cn'
LOG = logging.getLogger("system")

__all__ = ["MIGRATE_COLD",
           "MIGRATE_LIVE",
           "cold_migrate",
           "live_migrate",
           "computer_monitor",
           "VMMigrate"]


class VMMigrate(object):
    def __init__(self, **kwargs):
        self.migrate_policy = kwargs.get("migrate_policy", CONF.compute.policy)
        self.destination_host = kwargs.get("destination_host", None)


@gen.coroutine
@required("vm_id", "destination_host")
def live_migrate(vm_id, destination_host):
    """ live migrate instance
    :param vm_id: id of vm
    :param destination_host: migrate to destination host
    """
    server = yield get_server(vm_id=vm_id)
    if VM_STATUS_ACTIVE != server['state']:
        raise LiveMigrateVmStatusError()
    hosts = yield get_migrate_available_host(server)
    if destination_host not in [host['name'] for host in hosts]:
        raise MigrateBeyondDomain()
    try:
        yield live_migrate_request(vm_id, destination_host)
    except Exception, e:
        LOG.error("live migrate instance error: %s" % e)
        raise MigrateFailed


@gen.coroutine
@required("vm_id")
def cold_migrate(vm_id, destination_host):
    """ cold migrate instance
    :param vm_id: id of vm
    :param destination_host: migrate to destination host
    """
    try:
        server = yield get_server(vm_id=vm_id)
        if VM_STATUS_STOP != server['state']:
            raise ColdMigrateVmStatusError()
        hosts = yield get_migrate_available_host(server)
        if destination_host not in [host['name'] for host in hosts]:
            raise MigrateBeyondDomain()
        server_id = server['id']
        yield __update_server_host(server_id, destination_host)
        migrate_data = {NEED_REBOOT: 1}
        yield add_server_meta(server_id, **migrate_data)
    except Exception, e:
        LOG.error("cold migrate instance error: %s" % e)
        raise e


@gen.coroutine
@required("vm_id", "new_host")
def __update_server_host(vm_id, new_host):
    """ update tenant' quota settings
    :param vm_id: id of virtual machine
    :param new_host: migrate to host
    """
    try:
        db = dbpools.get_nova()
        yield dbpools.execute_commit(
                db,
                "update instances set `host`=%s, node=%s, launched_on=%s"
                " where uuid = %s",
                (new_host, new_host, new_host, vm_id)
        )
    except Exception, e:
        LOG.error("update instance migrate to host: %s, error: %s" % (new_host, e))
        raise MigrateFailed()


@gen.coroutine
def __update_server_state(vm_id):
    try:
        db = dbpools.get_nova()
        yield dbpools.execute_commit(
                db,
                "update instances set vm_state = 'stopped' ,power_state = 4 where uuid = %s",
                (vm_id)
        )
    except Exception, e:
        LOG.error("host down update vm state stopped  error: %s" % e)


@gen.coroutine
def check_network(vm):
    """
    该方法用来校验云主机的业务网，存储网是否可以访问
    :param vm:云主机详情包括云主机的网络信息
    :return: True/False
    """
    """遍历云主机网络"""
    """根据云主机网络ID找到网络的DHCP"""
    """根据DHCP,访问云主机的IP地址"""
    """如果有一个能访问就返回True,否则返回False"""

    result = False

    def device_id_to_qdhcp(device_id):
        return "qdhcp-" + device_id[-36:]

    @gen.coroutine
    def ip_net_exec(qdhcp, network_ip):
        report = ("No response", "Partial Response", "Alive")
        lifeline = re.compile(r"(\d) received")
        shell = "ip net exec %s ping  -q -c 2 -r  %s" % (qdhcp, network_ip)
        ping = yield call_subprocess(shell)
        igot = re.findall(lifeline, str(ping))
        if igot:
            raise gen.Return(report[int(igot[0])])
        raise gen.Return("No response")

    for each in vm["network_info"]:
        dhcp = device_id_to_qdhcp(each["id"])
        ip = each["ip"]
        try:
            res = yield ip_net_exec(dhcp, ip)
        except Exception, e:
            LOG.debug("check vm ip net error! do not ping %s", e)
            pass
        else:
            if res == 'Alive':
                result = True
    raise gen.Return(result)


@gen.coroutine
def computer_monitor():
    """monitor computer node status
    """
    try:
        LOG.debug("*************************************************")
        LOG.debug("***********   Compute   HA   Start   ************")
        LOG.debug("*************************************************")
        hosts = yield list_simple_hosts()
        for host in hosts:

            if host['state'] != "available":
                ping_host = ping(host['ip'])
                if ping_host != "Alive":
                    LOG.debug("hosts %s is shut down start live migrate ", host['name'])
                    vms = yield list_server(hosts=host['name'])
                    for vm in vms:
                        vm_id = vm['id']
                        checked = yield check_network(vm)
                        if vm.get('keepalive') and not checked:
                            LOG.debug("host %s is down migrate vm is %s" %
                                      (host['name'], vm_id))
                            try:
                                hosts = yield get_migrate_available_host(vm)
                                destination_host = yield get_host_by_stategy(hosts, CONF.compute.policy)
                                yield __update_server_host(vm_id, destination_host["name"])
                                yield server_action(vm_id, Control.REBOOT, info={"type": 'HARD'})
                            except HostUnAvailable:
                                LOG.error("ha not available host vm is %s" % vm['name'])
        LOG.debug("*************************************************")
        LOG.debug("***********   Compute   HA   End   ************")
        LOG.debug("*************************************************")
    except Exception, e:
        LOG.error("computer moniter ha  error %s" % e)


class LiveMigrationEndExecuter(MessageExecuter):
    def event(self):
        return "compute.instance.live_migration.pre.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        raise gen.Return(True)

    @gen.coroutine
    def execute(self):
        try:
            host_name = self._message.get("host")
            vm_id = self._message.get("instance_id")
            networks = yield get_vms_nics(vm_id)
            hosts = yield list_simple_hosts(name=host_name)
            host_id = hosts[0]["id"]
        except Exception, e:
            LOG.error("live_migration error %s" % e)


@gen.coroutine
def main():
    server_id = "524408a6-e48f-441c-876c-c57d637109b8"
    dest_host = "node2"
    # yield live_migrate(server_id, dest_host)
    # yield gen.sleep(1)
    # yield cold_migrate(server_id)
    # yield computer_monitor()


if __name__ == '__main__':
    from tornado import ioloop

    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
