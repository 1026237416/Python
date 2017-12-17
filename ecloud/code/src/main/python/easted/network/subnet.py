# -*- coding: utf-8 -*-

import copy
from easted.identify import get_tenant_by_id
from easted.core.task import get_task_flow
from common import *
from subnetdao import *
from exception import *
from tornado import gen
import logging

import json

__all__ = [
    "SubNet",
    "create_subnet",
    "list_subnets",
    "get_subnet",
    "delete_subnet",
    "set_subnet_ips",
    "get_subnet_ips",
    "update_subnet",
    "get_tenant_ips",
    "gen_ips_list",
]

__author__ = 'litao@easted.com.cn'
LOG = logging.getLogger('system')


class SubNet():
    network_id = str
    name = str
    cidr = str
    gateway = str
    dns = []
    ips = []

    def __init__(self, kwargs):
        self.network_id = kwargs.get("network_id", None)
        self.name = kwargs.get("name", None)
        self.cidr = kwargs.get("cidr", None)
        self.gateway = kwargs.get("gateway", None)
        self.dns = kwargs.get("dns", [])
        self.ips = kwargs.get("ips", [])


@gen.coroutine
def create_subnet(subnet):
    if len(subnet.dns) > 5:
        raise DnsOutofRange
    try:
        admin_tenant_id = yield openstack.get_admin_tenant_id()
        body = {'subnet': {
            'name': str(subnet.name),
            'enable_dhcp': True,
            'network_id': subnet.network_id,
            'tenant_id': admin_tenant_id,
            'dns_nameservers': subnet.dns,
            'allocation_pools': subnet.ips,
            'gateway_ip': subnet.gateway if subnet.gateway else None,
            'ip_version': 4,
            'cidr': subnet.cidr
        }}
        yield request_create_subnet(body)
    except Exception, e:
        LOG.error("create subnet error: %s" % e)
        raise SubNetCreateError


@gen.coroutine
def list_subnets(network_id=None, tenant_id=None):
    result = []
    subnet_ids = []
    if tenant_id:
        subnet_ids = yield query_tenant_subnets(tenant_id)
        if not subnet_ids:
            raise gen.Return(result)
    try:
        subnets_tenants = yield query_subnet_tenants(subnet_ids)
        vt_map = struct_convert(subnets_tenants, "subnet_id", "tenant_id")
        subnets = yield get_subnet_db(network_id=network_id, subnet_ids=subnet_ids)
        subnet_ids = [t_item['id'] for t_item in subnets]
        ips_counts = yield count_ip_total(subnet_ids)
        ips_used_counts = yield count_vlan_ip_used(subnet_ids)
        dhcp_counts = yield count_vlan_ip_used(subnet_ids, dhcp=True)
        dns_infos = yield list_dns(subnet_ids)
        dns_map = struct_convert(dns_infos, "subnet_id", "dns")
        for subnet_item in subnets:
            tenants = []
            if vt_map and subnet_item['id'] in vt_map:
                tenant_ids = vt_map[subnet_item['id']]
                for id_item in tenant_ids:
                    tenant_detail = yield get_tenant_by_id(id_item)
                    if tenant_detail:
                        tenants.append({"id": id_item, "name": tenant_detail["name"]})
            result.append({
                "id": subnet_item['id'],
                "network_id": subnet_item['network_id'],
                "network_name": subnet_item['network_name'],
                "name": subnet_item['name'],
                "cidr": subnet_item['cidr'],
                "gateway": subnet_item['gateway'],
                "dns": dns_map[subnet_item["id"]]
                if dns_map and subnet_item["id"] in dns_map else [],
                "ip_use": ips_used_counts[subnet_item['id']]
                if subnet_item['id'] in ips_used_counts else 0,
                "vm_counts": ips_used_counts.get(subnet_item['id'])-1
                if dhcp_counts.get(subnet_item['id'], 0)else ips_used_counts.get(subnet_item['id'], 0),
                "ip_total": ips_counts[subnet_item['id']] if subnet_item['id'] in ips_counts else 0,
                "tenants": copy.deepcopy(tenants)
            })
    except Exception, e:
        LOG.error("list subnet error: %s" % e)
        raise e
    raise gen.Return(result)


@gen.coroutine
def get_subnet(subnet_id=None):
    result = {}
    try:
        subnets = yield get_subnet_db(subnet_ids=subnet_id)
        dns_infos = yield list_dns(subnet_id)
        dns_map = struct_convert(dns_infos, "subnet_id", "dns")
        if subnets:
            subnet_item = subnets[0]
            result = {
                "id": subnet_item['id'],
                "network_id": subnet_item['network_id'],
                "name": subnet_item['name'],
                "cidr": subnet_item['cidr'],
                "gateway": subnet_item['gateway'],
                "dns": dns_map[subnet_item["id"]]
                if dns_map and subnet_item["id"] in dns_map else [],
            }
    except Exception, e:
        LOG.error("get subnet error: %s" % e)
        raise e
    raise gen.Return(result)


@gen.coroutine
def delete_subnet(subnet_id):
    """
    Delete subnet
    :param subnet_id:
    :return:
    """
    try:
        yield request_delete_subnet(subnet_id)
    except Exception, e:
        LOG.error("delete subnet error: %s" % e)
        raise SubnetDeleteError


@gen.coroutine
def update_subnet(old_subnet, subnet_info):
    try:
        subnet = {}
        if subnet_info["name"] and subnet_info["name"] != old_subnet["name"]:
            subnet_list = yield get_subnet_db(name=subnet_info["name"])
            if subnet_list:
                raise UniqueForbidden
            subnet["name"] = subnet_info["name"]
        if subnet_info["dns"] != "" and subnet_info["dns"] != old_subnet["dns"]:
            subnet["dns_nameservers"] = subnet_info["dns"]
        if subnet_info["gateway"] and subnet_info["gateway"] != old_subnet["gateway"]:
            subnet["gateway_ip"] = subnet_info["gateway"]
        if subnet:
            subnet_info = {
                "subnet": subnet
            }
            LOG.debug("update subnet id  is  %s subnet is %s " % (old_subnet["id"], subnet_info))
            yield request_update_subnet(old_subnet['id'], subnet_info)
    except Exception, e:
        LOG.error("update subnet info error: %s" % e)
        raise e


@gen.coroutine
def get_subnet_ips(subnet_id, tenant_id=None):
    """
    Get network ips
    :param subnet_id:
    :param tenant_id:
    :return:{
        "ippools":[{

        }],
        "ipused":[{
            "ip": "192.168.1.102",
            "used": true,
            "dhcp": true,
            "vm":  "vm_name",
            "port":"port_id"
        }]
        "tenants":[{
            "name":"tenant_name",
            "id":"tenant_id"
            "ippools":[{"start":"","end":""} ....]
            "ipavailable":[{  }]
        }]

    }

    """
    result = {}
    try:
        subnet_ippool_all = yield query_subnet_ips_neutron(subnet_id)
        subnet_ippools = []
        for item in subnet_ippool_all:
            subnet_ippools.append({"start": item["ip_f"], "end": item["ip_l"]})
        result["ippools"] = subnet_ippools
        result["ipused"] = yield _get_used_ip_info(subnet_id, tenant_id)
        result["tenants"] = yield get_tenant_ips(subnet_id, tenant_id)

    except Exception, e:
        LOG.error("get ips of subnet error: %s" % e)
        raise e
    raise gen.Return(result)


@gen.coroutine
def get_tenant_ips(subnet_id, tenant_id):
    """

    :param subnet_id:
    :param tenant_id:
    :return:
    {
     "name":"tenant_name",
     "id":"tenant_id"
    "ippools":[{"start":"","end":""} ....]
    "ipavailable":[{  }]
    "ipused":[{
            "ip": "192.168.1.102",
            "used": true,
            "dhcp": true,
            "vm":  "vm_name"
            "port": "port_id"
        }]
    }
    """
    try:
        tenant_info = yield query_subnet_tenant_all(subnet_id=subnet_id, tenant_id=tenant_id)
        tenants = []
        tenant_dict = {}
        for item in tenant_info:
            tenant_detail = yield get_tenant_by_id(item["tenant_id"])
            if tenant_detail:
                tenant_dict = {"id": tenant_detail["id"],
                               "name": tenant_detail["name"],
                               "ippools": json.loads(item["ippools"]) if item["ippools"] else []}

                network_used_ips = yield query_subnet_ips_used_neutron(subnet_id, tenant_id)
                ips = [item["ip"] for item in network_used_ips]
                tenant_dict["ipavailable"] = yield _split_ippools(tenant_dict["ippools"][:], ips)
            tenants.append(tenant_dict)
        if tenant_id and tenant_dict:
            tenant_dict["ipused"] = yield _get_used_ip_info(subnet_id, tenant_id)
            tenants = tenant_dict

    except Exception, e:
        LOG.error("get ips of tenant error: %s" % e)
        raise e
    raise gen.Return(tenants)



@gen.coroutine
def _get_used_ip_info(subnet_id, tenant_id):
    try:
        network_used_ips = yield query_subnet_ips_used_neutron(subnet_id, tenant_id)
        ipused_info = []
        device_ids = []
        port_vm = {}
        info = yield get_task_flow()
        for item in info:
            all_net_data = item.get("body", {}).get('server', {}).get('networks', {})
            for data in all_net_data:
                port_vm[data.get("port")] = item.get("resource")
        for tmp in network_used_ips:
            if tmp["device_id"]:
                device_ids.append(tmp["device_id"])
        vm = yield query_instance_nova(tuple(device_ids))
        for tmp in network_used_ips:
            vm_name = ""
            for item in vm:
                if tmp["device_id"] == item["uuid"]:
                    vm_name = item["vm"]
                elif tmp["id"] in port_vm:
                    vm_name = port_vm[tmp['id']]
                    break
            ipused_info.append({
                    "used": True,
                    "dhcp": True if tmp["ipdes"] == "network:dhcp" else False,
                    "ip": tmp["ip"],
                    "vm": vm_name,
                    "port":tmp["id"]
                })
    except Exception, e:
        LOG.error("get ips of used error: %s" % e)
        raise e
    raise gen.Return(ipused_info)


@gen.coroutine
def _split_ippools(ippools, ips):
    """
    :param ippools: [{"start":"","end":""}]
    :param ip: ["",""]
    :return: [{"start":"","end":""}]
    """
    try:
        int_ip = lambda x: int(netaddr.IPAddress(x))
        str_ip = netaddr.IPAddress
        for ip in ips:
            for ippool in ippools[:]:
                if int_ip(ippool["start"]) <= int_ip(ip) <= int_ip(ippool["end"]):
                    if ippool in ippools:
                        ippools.remove(ippool)
                    if ip != ippool["start"]:
                        ippools.append({"start": ippool["start"], "end": str_ip(int_ip(ip)-1).format()})
                    if ip != ippool["end"]:
                        ippools.append({"start": str_ip(int_ip(ip)+1).format(), "end": ippool["end"]})
    except Exception as e:
        LOG.exception("_split_ippools error: %s" % e)
        raise e
    raise gen.Return(ippools)


@gen.coroutine
def gen_ips_list(start, end):
    """
    :param start: str
    :param end: str
    :return: list
    """
    try:
        int_ip = lambda x: int(netaddr.IPAddress(x))
        str_ip = netaddr.IPAddress
        ips_list = [str_ip(num).format() for num in range(int_ip(start), int_ip(end) + 1)]
    except Exception as e:
        LOG.exception("gen_ips_list error: %s" % e)
        raise e
    raise gen.Return(ips_list)


@gen.coroutine
def set_subnet_ips(subnet_id, ips):
    """
    Set the ips of subnet
    :param ips:["xxx", ... ]
    :return:
    """
    try:
        yield set_subnet_ips_openstack(subnet_id, ips=ips)
    except Exception, e:
        LOG.exception("set subnet ips error: %s" % e)
        raise e
    raise gen.Return(True)


@gen.coroutine
def set_subnet_ips_openstack(subnet_id, ips):
    try:
        if subnet_id:
            allocation_pools = ips
            update_ips = {
                'subnet': {
                    'allocation_pools': allocation_pools
                }
            }
            LOG.debug("update subnet ips subnet id  is  %s subnet is %s " % (subnet_id, update_ips))
            yield request_update_subnet(subnet_id, update_ips)
    except Exception, e:
        LOG.error("update subnet ips  error: %s" % e)
        raise e
