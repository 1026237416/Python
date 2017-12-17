# -*- coding: utf-8 -*-
import logging
import json

from uuid import uuid4

from tornado import gen

from easted.core import dbpools
from exception import NetworkInUseError, HostNotExist

LOG = logging.getLogger('system')

__author__ = 'litao@easted.com.cn'

__all__ = [
    "add_network_hosts",
    "get_network_hosts",
    "delete_network_hosts",
    "query_host_vlan"
]


@gen.coroutine
def add_network_hosts(network_id, network_name, hosts):
    """ add hosts to vlan
   :param network_id：id of network
   :param network_name: Network={"id":"uuid","name":"vlan140","hosts":[host1,host2]}
   :param hosts: the hosts assign to network
   """
    vlan_hosts = {"vlan_id": network_id,
                  "vlan_name": network_name,
                  "hosts": hosts}
    try:
        if vlan_hosts and isinstance(vlan_hosts, dict):
            hosts = vlan_hosts["hosts"]
            new_hosts = [(str(uuid4()), vlan_hosts["vlan_id"], vlan_hosts["vlan_name"], host)
                         for host in hosts if host]
            for new_host in new_hosts:
                yield dbpools.execute_commit(dbpools.get_pool(dbpools.LOCAL_DB),
                                             sql="insert into vlan_hosts (id, vlan_id, vlan_name, host_id) VALUES (%s,%s,%s,%s)",
                                             param=new_host)
    except Exception, e:
        LOG.error("insert vlan hosts error: %s" % e)
        raise e


@gen.coroutine
def get_network_hosts(vlan_id):
    """ query hosts of vlan
    :param vlan_id: id of vlan
    :return: hosts of vlan, host only has id attr
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    try:
        cur = yield db.execute("select host_id from vlan_hosts where vlan_id = %s", [vlan_id])
        hosts = cur.fetchall()
        if not hosts:
            vlan_hosts = []
        else:
            vlan_hosts = [vlan_host["host_id"] for vlan_host in hosts]
    except Exception, e:
        LOG.error("query hosts of vlan error: %s" % e)
        raise e

    raise gen.Return(vlan_hosts)


@gen.coroutine
def delete_network_hosts(network_id, host_id):
    """ delete hosts from vlan
    :param network_id：id of network
    :param host_id: id of remove from network
    """
    try:
        used_host_ids = yield get_vlan_hosts_used(host_id, network_id)
        if int(host_id) in used_host_ids:
            raise NetworkInUseError
        yield delete_vlan_hosts(vlan_id=network_id, host=host_id)
    except Exception, e:
        LOG.error("remove the hosts from vlan error: %s" % e)
        raise e
    raise gen.Return(True)


@gen.coroutine
def get_vlan_hosts_used(host_id, network_id):
    db = dbpools.get_pool(dbpools.NOVA_DB)
    try:
        sql = "select a.host,info.network_info,a.hostname,b.id " \
              "from instances a "\
              "left join instance_info_caches info " \
              "on info.instance_uuid=a.uuid " \
              "left join compute_nodes b " \
              "on b.host=a.host " \
              "where b.id = %s and a.deleted=0 and a.node is not NULL "

        cur = yield db.execute(sql, [host_id])
        info = cur.fetchall()
        result = []
        for item in info:
            for r in json.loads(item["network_info"]):
                if r["network"]["id"] == network_id:
                    result.append(item["id"])

    except Exception, e:
        LOG.error("get tenant_hosts_used error :%s" % e)
        raise e
    raise gen.Return(result)

@gen.coroutine
def delete_vlan_hosts(vlan_id, host):
    """ delete host of vlan
    :param vlan_id: id of vlan
    :param host: ids of host
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    tx = yield db.begin()
    try:
        yield tx.execute("delete from vlan_hosts where vlan_id = %s and host_id = %s",
                         (vlan_id, host))

    except Exception, e:
        yield tx.rollback()
        LOG.error("Delete vlan host from ecloud error, rollback data ok. ERROR: %s" % e)
        raise e
    else:
        yield tx.commit()



@gen.coroutine
def query_host_vlan():
    """ query vlans of host
    :return: vlans of host, vlan only have vlan_name attr.
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    host_vlans = ()
    try:
        cur = yield db.execute("select vlan_name, host_id from vlan_hosts")
        vlans = cur.fetchall()
        if vlans:
            host_vlans = tuple(vlans)
    except Exception, e:
        LOG.error("query hosts of vlan error: %s" % e)
        raise e
    raise gen.Return(host_vlans)
