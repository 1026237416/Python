# -*- coding: utf-8 -*-
import netaddr

from easted.network import VlanUsedError, TenantNotExist

__author__ = 'musir'

import logging
from easted.core import dbpools
from tornado import gen

LOG = logging.getLogger('system')
__all__ = [
    "get_network_db",
    "delete_network_from_ecloud",
    "delete_tnr_from_ecloud",
    "list_simple_network",
    "check_ip_port_used",
    "count_ips",
    "query_tenant_vlan",
    "check_vlan_id",
    "update_vlan_host",
    "count_subnet"
]


@gen.coroutine
def get_network_db(network_ids=None, network_name=None):
    """
    Get networks info from neutron-network
    :param network_ids: network id list
    :param network_name: network name
    :return:
    [{
        "network_id":"xxx",
        "network_name":"xxx",
        "vlan_id":"xxx",
    },...]
    """
    try:
        if network_ids and isinstance(network_ids, basestring):
            network_ids = [network_ids]
        params = []
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        sql = "SELECT n.id as network_id, n.name as network_name, n.`status`, " \
              "ml.segmentation_id as vlan_id,ml.network_type as vlan_type, ml.physical_network  as physical_network " \
              "FROM networks n left join ml2_network_segments ml on n.id = ml.network_id "
        sql += " where 1=1 "
        if network_ids:
            sql += " and n.id in %s"
            params.append(tuple(network_ids))
        if network_name:
            sql += " and n.name = %s"
            params.append(network_name)
        cur = yield db.execute(sql, params)
        networks = cur.fetchall()
    except Exception, e:
        LOG.error("Get network info error: %s" % e)
        raise e
    raise gen.Return(networks)


@gen.coroutine
def delete_network_from_ecloud(network_id):
    """
    Delete network from ecloud
    :param network_id:
    :return:
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    tx = yield db.begin()
    try:
        yield tx.execute("delete from vlan_hosts where vlan_id = %s", (network_id,))
    except Exception, e:
        yield tx.rollback()
        LOG.error("Delete network from ecloud error, rollback data ok. ERROR: %s" % e)
        raise e
    else:
        yield tx.commit()


@gen.coroutine
def list_simple_network():
    try:
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        sql = "select  a.id , a.`name`, a.`status` ,b.physical_network ,b.segmentation_id as vlan_id  from networks as a LEFT JOIN ml2_network_segments as b on a.id = b.network_id"
        cur = yield db.execute(sql)
        rst = cur.fetchall()
    except Exception, e:
        LOG.error("list simple network from db  error: %s" % e)
        raise e
    raise gen.Return(rst)

@gen.coroutine
def delete_tnr_from_ecloud(tenant_id):
    """
    Delete tenant network relation from ecloud
    Delete tenant hosts relation from ecloud
    :param tenant_id:
    :return:
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    tx = yield db.begin()
    try:
        yield tx.execute("delete from vlan_subnet_tenant where tenant_id = %s ", (tenant_id,))
        yield tx.execute("delete from tenant_hosts where tenant_id = %s ", (tenant_id,))
        LOG.info("delete the tnr of tenant which id is %s success", tenant_id)
    except Exception, e:
        yield tx.rollback()
        LOG.error("Delete tenant network relation from ecloud error, rollback data ok. ERROR: %s" % e)
        raise TenantNotExist
    else:
        yield tx.commit()


@gen.coroutine
def check_ip_port_used(network_id, ip):
    db = dbpools.get_neutron()
    try:
        sql = "select  count(*) as  num  from  ipallocations where 1= 1 and network_id = %s and ip_address = %s"
        cur = yield db.execute(sql, (network_id, ip))
        ips = cur.fetchone()
    except Exception, e:
        raise e
    raise gen.Return(ips.get("num"))


@gen.coroutine
def check_vlan_id(vlan_type, phy_network, vlan_id):
    db = dbpools.get_neutron()
    try:
        if "vlan" == vlan_type:
            cur = yield db.execute(
                    "select *  from ml2_vlan_allocations where allocated != 0 and physical_network = %s  and vlan_id = %s",
                    (phy_network, vlan_id))
        elif "flat" == vlan_type:
            cur = yield db.execute("select *  from ml2_flat_allocations where  physical_network = %s ", (phy_network))
        vlans = cur.fetchall()
    except Exception as e:
        LOG.error("check vlan id used , db error: %s" % e)
        raise e
    if vlans:
        raise VlanUsedError


@gen.coroutine
def query_tenant_vlan(tenant):
    """ query vlan of tenant
    :param tenant: id of tenant
    :return: all vlan of this tenant
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    try:
        try:
            cur = yield db.execute("select DISTINCT(vlan_id) from vlan_subnet_tenant where tenant_id = %s", (tenant))
            vlans = cur.fetchall()

        except Exception as e:
            LOG.error("insert vlan ips , db error: %s" % e)
            raise e

        if not vlans:
            vlan_tenants = ()
        else:
            vlan_tenants = [vlan["vlan_id"] for vlan in vlans]
    except Exception, e:
        LOG.error("query hosts of vlan error: %s" % e)
        raise e
    raise gen.Return(tuple(vlan_tenants))


@gen.coroutine
def update_vlan_host(vlan_id=None, **vlan_host):
    """ update host of vlan record
    :param vlan_id: id of vlan
    :param vlan_host: {"vlan_name":"vlan130", "des":"desc"}
    """
    try:
        if vlan_id:
            update_params = ', '.join(['%s=%%s' % k for k in vlan_host.keys()])
            update_values = vlan_host.values()
            update_values.extend([vlan_id])
            if update_params:
                yield dbpools.execute_commit(dbpools.get_pool(dbpools.LOCAL_DB),
                                             sql="update vlan_hosts set %s %s" % (
                                                 update_params, "where vlan_id = %s"),
                                             param=update_values)
    except Exception, e:
        LOG.error("update vlan host error: %s" % e)
        raise e


@gen.coroutine
def count_subnet():
    db = dbpools.get_neutron()
    network_count = {}
    try:
        cur = yield db.execute("select network_id, count(*) as count  from subnets GROUP BY network_id")
        netwrok_subnet = cur.fetchall()
        for subnet in netwrok_subnet:
            network_count[subnet["network_id"]] = subnet["count"]
    except Exception, e:
        LOG.error("subnet  count error: %s" % e)
        raise e
    raise gen.Return(network_count)


@gen.coroutine
def count_ips():
    try:
        db = dbpools.get_pool(dbpools.NEUTRON_DB)

        sql = "SELECT count(ip_address) ip_used FROM ipallocations "
        cur = yield db.execute(sql)
        result = cur.fetchone()

        sql = "SELECT first_ip ,last_ip FROM ipallocationpools"
        cur = yield db.execute(sql)
        all = cur.fetchall()
        total = 0
        for item in all:
            start = int(netaddr.IPAddress(item["first_ip"]))
            end = int(netaddr.IPAddress(item["last_ip"]))
            total += end-start+1
        result["ip_all"] = total

    except Exception, e:
        LOG.error("Count ips info error: %s" % e)
        raise e
    raise gen.Return(result)
