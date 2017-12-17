# -*- coding: utf-8 -*-
import logging
import netaddr

from easted.core import dbpools
from tornado import gen
from uuid import uuid4

LOG = logging.getLogger('system')
__all__ = [
    "count_ip_total",
    "query_tenant_subnets",
    "query_subnet_tenants",
    "query_subnet_tenant_all",
    "count_vlan_ip_used",
    "get_subnet_db",
    "list_dns",
    "query_subnet_ips_neutron",
    "query_subnet_ips_used_neutron",
    "query_instance_nova",
    "get_used_subnet_ids",
    "delete_tenant_subnets",
    "insert_tenant_subnets",
]


@gen.coroutine
def count_ip_total(subnet_ids=None):
    """
    :param subnet_ids:
    :return: counts
    """
    params = []
    result = {}

    db = dbpools.get_pool(dbpools.NEUTRON_DB)
    try:
        sql = "select subnet_id, first_ip,last_ip from ipallocationpools where 1=1 "
        if subnet_ids:
            sql += " and subnet_id in %s "
            params.append(tuple(subnet_ids))
        cur = yield db.execute(sql, params)
        ippool_all = cur.fetchall()
        for item in ippool_all:
            ip_start = int(netaddr.IPAddress(item["first_ip"]))
            ip_end = int(netaddr.IPAddress(item["last_ip"]))
            ip_total = ip_end - ip_start + 1
            if item["subnet_id"] in result:
                result[item["subnet_id"]] += ip_total
            else:
                result[item["subnet_id"]] = ip_total
    except Exception, e:
        raise e
    raise gen.Return(result)


@gen.coroutine
def count_vlan_ip_used(subnet_ids=None, dhcp=False):
    """ Query used ips count of vlan
    :param subnet_ids: subnet_ids
    :return:
    """
    params = []
    result = {}
    db = dbpools.get_pool(dbpools.NEUTRON_DB)
    try:
        sql = "select ipl.subnet_id, count(*) as total from ipallocations ipl " \
              "left join ports p on p.id = ipl.port_id " \
              "where 1=1 "
        if subnet_ids:
            sql += "and subnet_id in %s "
            params.append(tuple(subnet_ids))
        if dhcp:
            sql += "and p.device_owner='network:dhcp' "
        sql += "group by subnet_id "
        cur = yield db.execute(sql, params)
        ips = cur.fetchall()
        for item in ips:
            result[item["subnet_id"]] = item["total"]
    except Exception, e:
        LOG.error("count vlan ips used error: %s" % e)
        raise e
    raise gen.Return(result)


@gen.coroutine
def query_tenant_subnets(tenant):
    """ query vlan of tenant
    :param tenant: id of tenant
    :return: all vlan of this tenant
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    try:
        try:
            cur = yield db.execute("select DISTINCT(subnet_id) from vlan_subnet_tenant where tenant_id = %s", (tenant))
            vlans = cur.fetchall()

        except Exception as e:
            LOG.error("insert vlan ips , db error: %s" % e)
            raise e

        if not vlans:
            vlan_tenants = ()
        else:
            vlan_tenants = [vlan["subnet_id"] for vlan in vlans]
    except Exception, e:
        LOG.error("query subnet of tenant error: %s" % e)
        raise e
    raise gen.Return(tuple(vlan_tenants))


@gen.coroutine
def query_subnet_tenants(subnet_ids):
    """
    Query tenants of subnet
    :param subnet_ids: str or list
    :return:
        [{
            "tenant_id":"xxx",
            "subnet_id":"xxx"
        },{
            "tenant_id":"xxx",
            "subnet_id":"xxx"
        },...]

    """
    subnets = []
    if isinstance(subnet_ids, str):
        subnets = [subnet_ids]
    try:
        db = dbpools.get_pool(dbpools.LOCAL_DB)
        params = []
        sql = "select tenant_id, subnet_id from vlan_subnet_tenant  where 1=1"

        if subnets:
            sql += " and subnet_id in %s"
            params.append(tuple(subnets))
        cur = yield db.execute(sql, params)
        tenants = cur.fetchall()
    except Exception, e:
        LOG.error("=====ERROR= query_subnet_tenants query error: %s" % e)
        raise e
    raise gen.Return(tenants)


@gen.coroutine
def query_subnet_tenant_all(subnet_id=None, tenant_id=None):
    """ query ips of vlan
    :param subnet_id: vlan id
    :param tenant_id: tenant id
    :return: vlan ips
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    try:
        if tenant_id and subnet_id:
            sql = "select * from vlan_subnet_tenant where subnet_id = '%s' and tenant_id = '%s'" % (
            subnet_id, tenant_id)
        elif not tenant_id and subnet_id:
            sql = "select * from vlan_subnet_tenant where subnet_id = '%s'" % subnet_id
        elif tenant_id and not subnet_id:
            sql = "select * from vlan_subnet_tenant where tenant_id = '%s'" % tenant_id
        else:
            sql = "select * from vlan_subnet_tenant"
        cur = yield db.execute(sql)
        ips = cur.fetchall()
        if not ips:
            ips = []
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(ips)


@gen.coroutine
def get_subnet_db(network_id=None, subnet_ids=None, name=None, cidr=None):
    """
     Get network info with sub_net info from neutron-network
    :param subnet_ids:
    :param network_id: network id list
    :param name: network name
    """
    try:
        if subnet_ids and isinstance(subnet_ids, basestring):
            subnet_ids = [subnet_ids]
        params = []
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        sql = "select a.id, a.network_id, a.`name`, a.cidr, a.gateway_ip as gateway ,b.`name` as network_name  from subnets  as a left join networks as b on  a.network_id = b.id where 1=1"
        if subnet_ids:
            sql += " and a.id in %s"
            params.append(tuple(subnet_ids))
        if cidr:
            sql += " and a.cidr like %s "
            cidr = cidr[:cidr.index("/")] + "%"
            params.append(cidr)
        if name:
            sql += " and a.name = %s"
            params.append(name)
        if network_id:
            sql += " and a.network_id = %s"
            params.append(network_id)
        cur = yield db.execute(sql, params)
        networks = cur.fetchall()
    except Exception, e:
        LOG.error("Get network info with sub_net info error: %s" % e)
        raise e
    raise gen.Return(networks)


@gen.coroutine
def list_dns(subnet_ids=None):
    """
    list dns
    :param subnet_ids:
    :return:
    """
    try:
        if subnet_ids and isinstance(subnet_ids, basestring):
            subnet_ids = [subnet_ids]
        params = []
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        sql = "SELECT dnsser.address as dns, dnsser.subnet_id FROM dnsnameservers dnsser WHERE 1=1"
        if subnet_ids:
            sql += " and subnet_id in %s"
            params.append(tuple(subnet_ids))
        cur = yield db.execute(sql, params)
        network_dns = cur.fetchall()
    except Exception, e:
        LOG.error("Get network dns info error: %s" % e)
        raise e
    raise gen.Return(network_dns)


@gen.coroutine
def query_subnet_ips_neutron(subnet_id):
    """
    :param network_id:
    :return:[{
        "subnet_id":"xxx",
        "ip_f":"xxx",fisrt_ip
        "ip_l":"xxx",last_ip
    }, ...]
    """
    try:
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        params = []
        sql = "SELECT subnet_id , first_ip as ip_f, last_ip as ip_l " \
              "FROM ipallocationpools " \
              "WHERE subnet_id = %s "
        params.append(subnet_id)
        cur = yield db.execute(sql, tuple(params))
        subnet_ips = cur.fetchall()

    except Exception, e:
        LOG.error("Query ip of subnet from neutron error: %s" % e)
        raise e
    raise gen.Return(subnet_ips)


@gen.coroutine
def query_subnet_ips_used_neutron(subnet_id,tenant_id=None):
    try:
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        params = []
        sql = "SELECT p.device_id, p.id, ipl.ip_address as ip, p.device_owner as ipdes, p.tenant_id " \
              "from ipallocations ipl " \
              "left join ports p on p.id=ipl.port_id " \
              "WHERE ipl.subnet_id = %s "
        params.append(subnet_id)
        if tenant_id:
            sql += "and p.tenant_id=%s"
            params.append(tenant_id)
        cur = yield db.execute(sql, tuple(params))
        subnet_ips = cur.fetchall()
        if not subnet_ips:
            subnet_ips = []
    except Exception, e:
        LOG.error("Query used ip of subnet from neutron error: %s" % e)
        raise e
    raise gen.Return(subnet_ips)


@gen.coroutine
def query_instance_nova(device_ids):
    try:
        subnet_vm = []
        if device_ids:
            db = dbpools.get_pool(dbpools.NOVA_DB)
            sql = "SELECT uuid,display_name as vm " \
                  "from instances WHERE uuid in %s "
            cur = yield db.execute(sql, (device_ids,))
            subnet_vm = cur.fetchall()
    except Exception, e:
        LOG.error("Query used vm of subnet from nava error: %s" % e)
        raise e
    raise gen.Return(subnet_vm)


@gen.coroutine
def get_used_subnet_ids(tenant_id):
    """ query used vlan ids from the table of vlan_ips
    :param tenant_id: tenant id
    :return: vlan_ids
    """
    db = dbpools.get_pool(dbpools.NEUTRON_DB)
    try:
        used_subnet_ids = ()
        if not tenant_id:
            raise gen.Return(used_subnet_ids)

        cur = yield db.execute("select DISTINCT(subnet_id) from ipallocations ipl "
                               "left join ports on ports.id=ipl.port_id "
                               "where ports.tenant_id = %s ", [tenant_id])

        subnet_ids = cur.fetchall()
        if subnet_ids:
            used_subnet_ids = [subnet['subnet_id'] for subnet in subnet_ids]
    except Exception, e:
        LOG.error("get_used_subnet_ids error: %s" % e)
        raise e
    raise gen.Return(used_subnet_ids)


@gen.coroutine
def delete_tenant_subnets(tenant_id, subnet_ids=None):
    """ delete tenant of vlan record
    :param subnet_ids: ids of vlan, default None
    :param tenant_id: id of tenant
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    try:
        if subnet_ids:
            str_subnet_ids = ','.join(["'%s'" % subnet for subnet in subnet_ids])
            yield dbpools.execute_commit(db,
                                         sql="delete from vlan_subnet_tenant where subnet_id in (%s) "
                                             "and tenant_id = %%s" % str_subnet_ids,
                                         param=[tenant_id])
        else:
            yield dbpools.execute_commit(db,
                                         sql="delete from vlan_subnet_tenant where tenant_id = %s",
                                         param=[tenant_id])
    except Exception, e:
        LOG.error("delete subnet tenant error: %s" % e)
        raise e


@gen.coroutine
def insert_tenant_subnets(tenant_id=None, subnet_ids=None):
    """ insert vlans of tenant
    :param tenant_id: id of tenant
    :param subnet_ids: ids of networks
    """
    try:
        new_tenants = []
        if tenant_id and subnet_ids and \
                isinstance(subnet_ids, (list, tuple)):
            subnet_info_all = yield get_subnet_db(subnet_ids=subnet_ids)
            subnet_dict={}
            for subnet_info in subnet_info_all:
                subnet_dict[subnet_info["id"]] = subnet_info["network_id"]
            for subnet_id in subnet_ids:
                vlan_id= subnet_dict[subnet_id]
                new_tenants.append((str(uuid4()), vlan_id, subnet_id, tenant_id, subnet_id, tenant_id))
            if new_tenants:
                for new_tenant in new_tenants:
                    yield dbpools.execute_commit(dbpools.get_local(),
                                                 sql="insert into vlan_subnet_tenant (id,vlan_id, subnet_id, tenant_id) "
                                                     "select %s, %s, %s, %s from dual where not exists "
                                                     "(select * from vlan_subnet_tenant where subnet_id = %s "
                                                     "and tenant_id = %s)",
                                                 param=new_tenant)
    except Exception, e:
        print e
        LOG.error("insert subnet tenants error: %s" % e)
        raise e
