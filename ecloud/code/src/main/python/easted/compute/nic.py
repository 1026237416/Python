# -*- coding: utf-8 -*-
import logging

from tornado import gen
from easted.compute import VMNicOperationError, check_network
from easted.core import openstack as os
from easted.core import dbpools
from easted.network.common import request_delete_ports
from easted.network import list_network, get_subnet_db

__author__ = 'litao@easted.com.cn'

__all__ = [
    "get_port",
    "list_vm_nics",
    "del_vm_nic",
    "add_vm_nic"
]

LOG = logging.getLogger('system')


@gen.coroutine
def list_vm_nics(vm):
    url = "/servers/%s/os-interface" % vm.get("id")
    result = []
    try:
        session = yield os.get_session(tenant=vm.get("tenant_id"))
        nics = yield os.connect_request(session=session, type=os.TYPE_COMPUTE,
                                        method=os.METHOD_GET, url=url, response_key="interfaceAttachments")
    except Exception, e:
        LOG.error("list vm nics error: %s" % e)
        raise VMNicOperationError()
    else:
        if nics:
            networks = yield list_network()
            subnets = yield get_subnet_db()
            for nic in nics:
                net_id = nic.get("net_id")
                for network in networks:
                    if net_id == network.get("id"):
                        nic["phy_network"] = network.get("phy_network")
                        nic["name"] = network.get("name")
                for fix_ip in nic.get("fixed_ips"):
                    for subnet in subnets:
                        if fix_ip["subnet_id"] == subnet["id"]:
                            fix_ip["subnet_name"] = subnet["name"]
                result.append(nic)
    raise gen.Return(result)


@gen.coroutine
def del_vm_nic(vm, port_id):
    url = "/servers/%s/os-interface/%s" % (vm.get("id"), port_id)
    try:
        session = yield os.get_session(tenant=vm.get("tenant_id"))
        yield os.connect_request(session=session, type=os.TYPE_COMPUTE,
                                 method=os.METHOD_DELETE, url=url)
    except Exception, e:
        LOG.error("del vm nics error: %s" % e)
        raise VMNicOperationError()
    else:
        yield request_delete_ports(vm.get("tenant_id"), port_id)


@gen.coroutine
def add_vm_nic(vm, vlan_id, subnet_id, ip, mac=None):
    url = "/servers/%s/os-interface" % vm.get("id")
    try:
        network = [{
            "vlan": vlan_id,
            "subnet": subnet_id,
            "mac": mac,
            "ip": ip
        }]
        fixed_ip = ip
        nic = yield check_network(vm.get("name"), network, vm.get("tenant_id"), vm.get("user_id"), vm.get("host_id"))
        if nic:
            try:
                fixed_ip = nic[0].get('v4-fixed-ip')
                body = {"interfaceAttachment": {"port_id": nic[0].get("port-id")}}
                session = yield os.get_session(tenant=vm.get("tenant_id"))
                yield os.connect_request(session=session, type=os.TYPE_COMPUTE,
                                         method=os.METHOD_POST, url=url, body=body)
            except Exception, e:
                LOG.error("add vm nics error: %s" % e)
                raise VMNicOperationError()

    except Exception, e:
        LOG.error("add vm nics error: %s" % e)
        raise e
    raise gen.Return(fixed_ip)


@gen.coroutine
def get_port(port_id):
    try:
        db = dbpools.get_neutron()
        sql = ("select a.port_id,a.ip_address as ip ,b.`name` ,b.id as vlan_id, "
               "b.tenant_id as tenant_id from ipallocations as a LEFT JOIN "
               "networks as b on a.network_id = b.id  where a.port_id = %s")
        cur = yield db.execute(sql, [port_id])
        result = cur.fetchone()
    except Exception as e:
        LOG.error("get port  from db error: %s" % e)
        raise e
    raise gen.Return(result)
