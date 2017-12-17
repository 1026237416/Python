# -*- coding: utf-8 -*-
from common import *
from exception import *
from networkhost import *
from subnet import delete_subnet, list_subnets
import networkdao
from tornado import gen
from easted import config
import logging

LOG = logging.getLogger('system')
__author__ = 'litao@easted.com.cn'
config.register("network.bridge_port", default="ph-eth", setting_type=config.TYPE_LIST, secret=True)

CONF = config.CONF

__all__ = ["Network",
           "create_network",
           "list_network",
           "get_network",
           "delete_network",
           "update_network",
           "list_phy_network"]

NETWORK_TYPE_FLAT = "flat"
NETWORK_TYPE_VLAN = "vlan"


class Network():
    name = str
    phy_network = str
    vlan_id = int
    vlan_type = str
    hosts = []

    def __init__(self, kwargs):
        self.name = kwargs.get("name", None)
        self.phy_network = kwargs.get("phy_network", None)
        self.vlan_id = kwargs.get("vlan_id", 0)
        self.vlan_type = kwargs.get("vlan_type", NETWORK_TYPE_FLAT)
        self.hosts = kwargs.get("hosts", [])


def list_phy_network():
    result = []
    for phy in CONF.network.bridge_port:
        phys = phy.split(":")
        if len(phys) != 3:
            return result
        result.append({
            "name": phys[0],
            "brige": phys[1],
            "nic": phys[2]
        })
    return result


@gen.coroutine
def create_network(network):
    try:
        result_networks = yield networkdao.get_network_db(network_name=network.name)
        if result_networks:
            raise UniqueForbidden
        if int(network.vlan_id) not in range(0, 4095):
            raise VlanIdNotInRange
        yield networkdao.check_vlan_id(network.vlan_type, network.phy_network, network.vlan_id)
        token = yield openstack.get_session()
        vlan = {'network': {
            'router:external': False,
            'name': network.name,
            'provider:physical_network': network.phy_network,
            'admin_state_up': True,
            'tenant_id': token.tenant_id,
            'provider:network_type': network.vlan_type,
            'shared': True,
            'provider:segmentation_id': network.vlan_id
        }}
        created_network = yield request_create_network(vlan)
        network_id = created_network.get("network")['id']
    except Exception, e:
        LOG.error("create network error: %s" % e)
        raise e
    else:
        try:
            if network.hosts:
                yield add_network_hosts(network_id, network.name, network.hosts)
        except Exception, e:
            LOG.error("set vlan host error: %s" % e)
            raise e


@gen.coroutine
def list_network(tenant_id=None, phy_network=None):
    result = []
    vlan_ids = []
    if tenant_id:
        vlan_ids = yield networkdao.query_tenant_vlan(tenant_id)
        if not vlan_ids:
            raise gen.Return(result)
    try:
        count_subnet = yield networkdao.count_subnet()
        networks = yield networkdao.get_network_db(network_ids=vlan_ids)
        for network_item in networks:
            if phy_network and phy_network <> network_item['physical_network']:
                continue
            result.append({
                "id": network_item['network_id'],
                "vlan_id": network_item['vlan_id'],
                "name": network_item['network_name'],
                "phy_network": network_item['physical_network'],
                "status": network_item['status'],
                "vlan_type": network_item['vlan_type'],
                "subnet_count": count_subnet.get(network_item['network_id'], 0)
            })
    except Exception, e:
        LOG.error("list network error: %s" % e)
        raise e
    raise gen.Return(result)


@gen.coroutine
def get_network(network_id):
    result = {}
    network = yield networkdao.get_network_db(network_ids=network_id)
    if network:
        network_item = network[0]
        result = {
            "id": network_item['network_id'],
            "vlan_id": network_item['vlan_id'],
            "name": network_item['network_name'],
            "phy_network": network_item['physical_network'],
            "status": network_item['status'],
            "vlan_type": network_item['vlan_type'],
        }
    raise gen.Return(result)


@gen.coroutine
def delete_network(network_id):
    """
    Delete network
    :param network_id:
    :return:
    """
    try:
        subnets = yield list_subnets(network_id=network_id)
        for subnet in subnets:
            yield delete_subnet(subnet["id"])
    except Exception, e:
        LOG.error("delete subnet error: %s" % e)
        raise e
    else:
        try:
            yield request_delete_network(network_id=network_id)
        except Exception, e:
            LOG.error("delete network error: %s" % e)
            raise NetworkDeleteError
        else:
            try:
                yield networkdao.delete_network_from_ecloud(network_id)
            except Exception, e:
                LOG.error("delete network relation vlan to ip and vlan to host  error: %s" % e)
                raise e


@gen.coroutine
def update_network(old_network, network_info):
    try:
        if network_info["name"] and network_info["name"] != old_network["name"]:
            network_list = yield networkdao.get_network_db(network_name=network_info["name"])
            if network_list:
                raise UniqueForbidden
            vlan = {'network': {
                'name': network_info["name"]
            }}
            yield request_update_network(network_id=network_info["id"], body=vlan)
            yield networkdao.update_vlan_host(vlan_id=network_info["id"], vlan_name=network_info["name"])
    except Exception, e:
        LOG.error("update network name error: %s" % e)
        raise e
