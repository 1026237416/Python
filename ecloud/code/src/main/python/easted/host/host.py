# -*- coding: utf-8 -*-
import logging
from math import ceil

from subprocess import check_output

import json
import netaddr
from tornado import gen
from easted import config
from easted import network
from easted.core import dbpools
from easted.core import openstack
from easted.network import list_subnets
from easted.network import get_tenant_hosts
from easted.utils import is_none_or_empty, required
from exception import HostAvailableGetFailed, IPMIInfoNotExist
from exception import HostListFailed, UpdateHostIpmiFailed
from manor.util.generals import trace

config.register("compute.cpu_weight", default=1000000, setting_type=config.TYPE_FLOAT, secret=True)
config.register("compute.memory_weight", default=0.0009765625, setting_type=config.TYPE_FLOAT, secret=True)
config.register("compute.cpu_allocation_ratio", default=16.0, setting_type=config.TYPE_FLOAT)
config.register("compute.memory_allocation_ratio", default=1.5, setting_type=config.TYPE_FLOAT)
config.register("compute.cpu_range", default="1/2/4/8/16")
config.register("compute.memory_range", default="1/2/4/8/16/32")

__all__ = [
    "Host",
    "query_host",
    "update_host",
    "get_host_by_ip",
    "get_host_by_id",
    "get_host_by_hostname",
    "stat_host",
    "list_simple_hosts",
    "get_avilable_host",
    "get_host_storage_capacity",
    "get_migrate_available_host",
    "count_host_state",
    "get_host_by_ipmi",
    "get_availability_zone",
    "count_tenant_vm",
    "count_network_vm",
    "count_tenant_vd"
]

CONF = config.CONF
LOG = logging.getLogger('system')

HOST_STATUS_ENABLED = "enabled"
HOST_STATE_UP = "up"


class Host(object):
    ipmi_user = str
    ipmi_pass = str
    ipmi_ip = str
    des = str

    def __init__(self, **kwargs):
        self.ipmi_user = kwargs.get("ipmi_user", None)
        self.ipmi_pass = kwargs.get("ipmi_pass", None)
        self.ipmi_ip = kwargs.get("ipmi_ip", None)
        self.des = kwargs.get("des", None)


@gen.coroutine
def query_host(id=None, name=None, ip=None, volume_type=None, tenant_id=None):
    hosts = yield list_simple_hosts(host_id=id, name=name, ip=ip)
    out_hosts = []
    try:
        host_vlans = yield network.query_host_vlan()
        tenant_hosts = yield get_tenant_hosts(tenant_id)
        ipmis = yield __get_host_ipmi()
        for host in hosts:
            if tenant_id and host.get("id") not in tenant_hosts:
                continue
            if volume_type and volume_type.lower() == "lvm":
                availability_zone = yield get_availability_zone(host.get('name'))
                if not availability_zone:
                    continue
            _ipmi = [ipmi for ipmi in ipmis if ipmi['host_id'] == str(host.get("id"))]
            if not _ipmi:
                ipmi_user = ipmi_pass = ipmi_ip = des = None
            else:
                ipmi_user = _ipmi[0]['ipmi_user']
                ipmi_pass = _ipmi[0]['ipmi_pass']
                ipmi_ip = _ipmi[0]['ipmi_ip']
                des = _ipmi[0]['des']
            out_hosts.append({
                "id": host.get('id'),
                "name": host.get('name'),
                "ip": host.get('ip'),
                "running_vms": host.get('running_vms'),
                "memory_mb": host['memory_mb'],
                "used_memory_mb": host['used_memory_mb'],
                "cpus": host['cpus'],
                "used_cpus": host['used_cpus'],
                "vlans": list(set([host_vlan['vlan_name'] for host_vlan in host_vlans if
                                   host_vlan['host_id'] == str(host.get("id"))])),
                "ipmi_user": ipmi_user,
                "ipmi_pass": ipmi_pass,
                "ipmi_ip": ipmi_ip,
                "status": host['state'],
                "des": des
            })
    except Exception, e:
        LOG.error("list hosts parse error: %s" % e)
        raise HostListFailed()
    raise gen.Return(out_hosts)


@gen.coroutine
def get_ipmi_info(ipmi_ip):
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    params = [ipmi_ip]
    sql_select = "SELECT * FROM host_ipmi WHERE ipmi_ip = %s "
    try:
        cur = yield db.execute(sql_select, params)
        ipmi_info = cur.fetchone()
    except Exception as e:
        LOG.error("Get hosts info error: %s" % e)
        raise e
    raise gen.Return(ipmi_info)


@gen.coroutine
def get_host_by_ipmi(ipmi_ip):
    ipmi_info = yield get_ipmi_info(ipmi_ip)
    if not ipmi_info:
        raise IPMIInfoNotExist
    host_id = ipmi_info["host_id"]
    hosts = yield list_simple_hosts(host_id=host_id)
    raise gen.Return(hosts)


@gen.coroutine
def count_host_state():
    db = dbpools.get_pool(dbpools.NOVA_DB)
    sql_select = "SELECT elt(INTERVAL(TIMESTAMPDIFF(SECOND,updated_at,UTC_TIMESTAMP()),0,60), 'available', 'unavailable') state, count(id) as count " \
                 " FROM compute_nodes WHERE deleted=0 GROUP BY elt(INTERVAL(TIMESTAMPDIFF(SECOND,updated_at,UTC_TIMESTAMP()),0,60), 'available', 'unavailable')"
    try:
        cur = yield db.execute(sql_select)
        hosts_state = cur.fetchall()
    except Exception as e:
        LOG.error("Count host state error: %s" % e)
        raise e
    raise gen.Return(hosts_state)


@gen.coroutine
@required("host_id")
def update_host(host_id, ipmis):
    """ alter specific host ipmi info
      :param host_id:
      :param ipmis: the ipmi of host, {"ipmi_user":"admin","ipmi_pass":"password",
                                           "ipmi_ip":"10.10.1.101"}
      :return:
      """
    try:
        yield __update_host_ipmi(host_id, ipmis)
    except Exception, e:
        LOG.error('update host error: %s' % e)
        raise UpdateHostIpmiFailed


def get_host_by_ip(ip, hosts):
    """ get a specific host from hosts list by host ip.

    :param ip: ip address of a host
    :param hosts: the list of host machines.
    :return:
        a dict that describes a specific nova host.
    """
    try:
        return next((host for host in hosts if host['ip'] == ip), {})
    except Exception, e:
        LOG.error('get_host_by_ip: iterating error: %s', e)
        return {}


def get_host_by_id(host_id, hosts):
    """ get a specific host from hosts list by host id.

    :param host_id: id of a host
    :param hosts: the list of host machines.
    :return:
        a dict that describes a specific nova host.
    """
    try:
        return next((host for host in hosts if host['id'] == host_id), {})
    except Exception, e:
        LOG.error('get_host_by_id: iterating error %s', e)
        return {}


def get_host_by_hostname(hostname, hosts):
    """ get a specific host from hosts list by hostname.

    :param hostname: hostname of a specific host
    :param hosts: the list of host machines.
    :return:
        a dict that describes a specific nova host.
    """
    try:
        return next((host for host in hosts if host['name'] == hostname), {})
    except Exception, e:
        LOG.error('get_host_by_hostname: iterating error: %s', e)
        return {}


@gen.coroutine
def stat_host():
    """ statistic host to show dashboard
    :return: host statistic info={"host_available": 1, "host_unavailable": 1}
    """
    stat_data = {
        "host_available": 0,
        "host_unavailable": 0
    }
    try:
        hosts = yield __host_list()
        if hosts:
            host_available = len([host for host in hosts
                                  if host['status'] == HOST_STATUS_ENABLED and
                                  host['state'] == HOST_STATE_UP])
            host_unavailable = len(hosts) - host_available
            stat_data["host_available"] = host_available
            stat_data["host_unavailable"] = host_unavailable
    except Exception, e:
        LOG.error("statistic host error: %s" % e)
    raise gen.Return(stat_data)


@gen.coroutine
def __host_list(detailed=True):
    """
    :param search:
    :param detailed:
    :return:
    """
    try:
        detail = ""
        if detailed:
            detail = "/detail"
        url = '/os-hypervisors%s' % detail
        session = yield openstack.get_session()
        hosts = yield openstack.connect_request(session=session, type=openstack.TYPE_COMPUTE, url=url,
                                                method=openstack.METHOD_GET, response_key="hypervisors")
    except Exception, e:
        LOG.error("list hosts  error: %s" % e)
        raise HostListFailed()
    raise gen.Return(hosts)


@gen.coroutine
def list_simple_hosts(host_id=None, name=None, ip=None):
    """
    :param host_id:  int or list, host id
    :param name: string, host name
    :param ip: string, host ip
    :return:
    """
    db = dbpools.get_pool(dbpools.NOVA_DB)
    params = []
    sql_select = "SELECT a.id, a.updated_at, a.created_at, a.host as name, a.host_ip as ip, " \
                 "a.vcpus as cpus, a.vcpus_used as used_cpus, a.memory_mb, a.memory_mb_used as used_memory_mb, a.free_ram_mb as free_memory, " \
                 "a.running_vms, b.disabled, TIMESTAMPDIFF(SECOND,a.updated_at,UTC_TIMESTAMP()) as heatbeat " \
                 "from compute_nodes as a, services as b " \
                 "where a.service_id = b.id "

    if host_id and (isinstance(host_id, list) or isinstance(host_id, tuple)):
        sql_select += " and a.id in %s"
        params.append(tuple(host_id))
    elif host_id:
        sql_select += " and a.id=%s"
        params.append(host_id)
    if name:
        sql_select += " and a.host=%s"
        params.append(name)
    if ip:
        sql_select += " and a.host_ip=%s"
        params.append(ip)
    try:
        cur = yield db.execute(sql_select, params)
        hosts = cur.fetchall()
        if hosts:
            for host in hosts:
                deltatimede = host.get('heatbeat')
                host['state'] = "available" if deltatimede <= 65 else "unavailable"
                host.pop("disabled")
                del host["updated_at"]
                del host["created_at"]
    except Exception as e:
        LOG.error("Get hosts info error: %s" % e)
        raise e
    raise gen.Return(hosts)


@gen.coroutine
def __get_host_ipmi(hyper_id=None):
    """ update or insert ipmi info to specific host
    :param hyper_id: the id of specific host, default None
    :return ipmi info: {"host_id":"1", "ipmi_user":"admin",
                        "ipmi_pass":"password", "ipmi_ip":"10.10.3.122"}
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    try:
        if hyper_id:
            cur = yield db.execute("SELECT * FROM host_ipmi WHERE host_id = %s", (hyper_id,))
            ipmis = cur.fetchone()
        else:
            cur = yield db.execute("SELECT * FROM host_ipmi")
            ipmis = cur.fetchall()
        if not ipmis:
            ipmis = ()
    except Exception, e:
        LOG.error("update host:%s 's ipmi info, error: %s" % (hyper_id, e))
        raise e
    raise gen.Return(ipmis)


@gen.coroutine
def __update_host_ipmi(hyper_id, ipmi):
    """ update or insert ipmi info to specific host
    :param hyper_id: the id of specific host
    :param ipmi: the ipmi info of specific host
    """
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    try:
        host = yield __get_host_ipmi(hyper_id)
        if not host:
            ipmi_user = ipmi['ipmi_user'] if ipmi['ipmi_user'] else None
            ipmi_pass = ipmi['ipmi_pass'] if ipmi['ipmi_pass'] else None
            ipmi_ip = ipmi['ipmi_ip'] if ipmi['ipmi_ip'] else None
            des = ipmi['des'] if ipmi['des'] else None
            yield dbpools.execute_commit(db, sql="INSERT INTO host_ipmi (host_id, ipmi_user, ipmi_pass, ipmi_ip, des)"
                                                 " VALUES(%s, %s, %s, %s, %s)",
                                         param=(
                                             hyper_id, ipmi_user, ipmi_pass, ipmi_ip, des))
        else:
            set_params = ', '.join(["%s = %%s" % k for k in ipmi.keys()])
            if is_none_or_empty(set_params):
                return
            v = ipmi.values()
            v.extend([hyper_id])
            yield dbpools.execute_commit(db, sql="update host_ipmi set %s %s" % (set_params, " where host_id = %s"),
                                         param=v)
    except Exception, e:
        LOG.error("update host:%s 's ipmi info, error: %s" % (hyper_id, e))
        raise e


@gen.coroutine
def get_availability_zone(host):
    try:
        db = dbpools.get_cinder()
        sql = "select DISTINCT(availability_zone) as zone from services where  `binary` =  'cinder-volume' and host like '" + host + "@lvm%'"
        cur = yield db.execute(sql)
        result = cur.fetchone()
    except Exception as e:
        LOG.error("get availablility zone  from db error: %s" % e)
        raise e
    raise gen.Return(None if not result else result.get("zone"))


@gen.coroutine
def get_avilable_host(tenant_id, subnet_ids, vm_cores,
                      vm_memory, volume_type=None, vm_host_used=None, is_migrate=False):
    """
    :param volume_type:
    :param vm_host_used:
    :param tenant_id:
    :param subnet_ids:
    :param vm_cores:
    :param vm_memory:
    :param is_migrate:
    :return:
    """
    network_hosts = yield get_vm_avilable_hosts(subnet_ids, tenant_id)

    LOG.debug("get avilable host tenant is %s subnet_ids is %s  cores is %s memory is %s  selected hosts is %s ",
              tenant_id, subnet_ids, vm_cores, vm_memory, network_hosts)
    if not network_hosts:
        raise gen.Return([])
    hosts = yield list_simple_hosts(network_hosts)
    try:
        select_host = []
        for host_item in hosts:
            if volume_type and volume_type.lower() == "lvm":
                availability_zone = yield get_availability_zone(host_item['name'])
                if not availability_zone:
                    continue
            if host_item["state"] != 'available':
                LOG.debug("host %s state unavailable", host_item['name'])
                continue
            used_cpus = host_item['used_cpus']
            used_memory = host_item['used_memory_mb']
            free_memory = host_item['free_memory']
            if vm_host_used and host_item['name'] in vm_host_used:
                used_cpus += vm_host_used[host_item['name']]["used_cores"]
                used_memory += vm_host_used[host_item['name']]["used_memorys"]

            is_pass_cores, cores_weight = _check_host_core(host_item['name'],
                                                           host_item['cpus'],
                                                           used_cpus,
                                                           vm_cores)
            if not is_migrate:
                is_pass_memory, memory_weight = _check_host_memory(host_item['name'],
                                                                   host_item['memory_mb'],
                                                                   used_memory,
                                                                   vm_memory)
            else:
                is_pass_memory, memory_weight = _check_host_memory_for_migrate(host_item['name'],
                                                                               host_item['memory_mb'],
                                                                               free_memory,
                                                                               vm_memory)
            if is_pass_cores and is_pass_memory:
                host_wight = cores_weight + memory_weight
                select_host.append({
                    "weight": host_wight,
                    "host": host_item
                })
        sorted_hosts = sorted(select_host, key=lambda asd: asd["weight"], reverse=False)
        available_hosts = [host["host"] for host in sorted_hosts]
        LOG.debug("get avilable hosts is %s", available_hosts)
    except Exception, e:
        LOG.error("get available hosts error: %s" % e)
        raise HostAvailableGetFailed()
    raise gen.Return(available_hosts)


@gen.coroutine
def get_migrate_available_host(vm):
    tenant_id = vm["tenant"]["id"]
    host_id = vm["host"]["id"]
    cores = vm["cores"]
    memory = vm["memory_mb"]
    vm_network_info = vm["network_info"]
    subnet_ids = []
    subnets = yield list_subnets()
    for network_info in vm_network_info:
        for subnet in subnets:
            ips_pool = set(list(netaddr.IPNetwork(subnet["cidr"])))
            if network_info["id"] == subnet["network_id"] and netaddr.IPAddress(network_info["ip"]) in ips_pool:
                subnet_ids.append(subnet["id"])
    hosts = yield get_avilable_host(tenant_id, subnet_ids, cores, memory, is_migrate=True)
    for host_item in hosts:
        if host_item["id"] == host_id:
            del hosts[hosts.index(host_item)]
    raise gen.Return(hosts)


def _check_host_core(host_name, host_cpus,
                     host_vcpus_used, instance_cores):
    """ Return True if host has sufficient CPU cores.
    :param host_name: the name of host
    :param host_cpus: the cpus of host
    :param host_vcpus_used: the used cpus of host
    :param instance_cores: the cores of vm
    """
    is_pass = True
    cpu_ratio = CONF.compute.cpu_allocation_ratio
    cpu_weight = CONF.compute.cpu_weight
    if not host_cpus:
        is_pass = True
    vcpus_total = host_cpus * cpu_ratio
    if vcpus_total > 0:
        if instance_cores > vcpus_total:
            is_pass = False
    free_vcpus = vcpus_total - host_vcpus_used
    if free_vcpus < instance_cores:
        is_pass = False
    if not is_pass:
        LOG.debug("check host cpu hostname:%s host free cpu: %s need cpu: %s", host_name, free_vcpus, instance_cores)
    return is_pass, int(ceil(free_vcpus * cpu_weight))


def _check_host_memory(host_name, host_memory,
                       host_memory_used, instance_memory):
    """ Return True if host has sufficient memory.
    :param host_name: the name of host
    :param host_memory: the memory of host
    :param host_memory_used: the used memory of host
    :param instance_memory: the memory of vm
    """
    is_pass = True
    memory_ratio = CONF.compute.memory_allocation_ratio
    memory_weight = CONF.compute.memory_weight
    if not host_memory >= instance_memory:
        is_pass = False
    memory_mb_limit = host_memory * memory_ratio
    usable_memory = memory_mb_limit - host_memory_used
    if not usable_memory >= instance_memory:
        is_pass = False
    if not is_pass:
        LOG.debug("check host memory hostname:%s host free memory: %s need cpu: %s", host_name, usable_memory,
                  instance_memory)
    return is_pass, int(ceil(usable_memory * memory_weight))


def _check_host_memory_for_migrate(host_name, host_memory,
                                   free_host_memory, instance_memory):
    """ Return True if host has sufficient memory.
    :param host_name: the name of host
    :param host_memory: the memory of host
    :param instance_memory: the memory of vm
    """
    is_pass = True
    memory_weight = CONF.compute.memory_weight
    if not host_memory >= instance_memory:
        is_pass = False
    if not free_host_memory >= instance_memory:
        is_pass = False
    if not is_pass:
        LOG.debug("check host memory hostname:%s host free memory: %s need cpu: %s", host_name, free_host_memory,
                  instance_memory)
    return is_pass, int(ceil(free_host_memory * memory_weight))


def get_host_storage_capacity(host_name):
    try:
        result = []
        shell = "ssh " + host_name + " vgdisplay"
        info = check_output(shell, shell=True)
        lines = info.split("\n")
        for l in lines:
            line = l[:24].strip()
            if line and "VG Name" in line:
                disk = {
                    "name": l[24:].strip()
                }
                result.append(disk)
            if line and "VG Size" in line:
                total_size = l[24:].strip().split(" ")
                disk["total_size"] = total_size[0].strip()
                disk["total_size_unit"] = total_size[1].strip()
            if line and "Free  PE" in line:
                free_size = l[24:].split("/")[1].strip().split(" ")
                if len(free_size) == 1:
                    disk["free_size"] = free_size[0].strip()
                    disk["free_size_unit"] = "MiB"
                else:
                    disk["free_size"] = free_size[0].strip()
                    disk["free_size_unit"] = free_size[1].strip()
    except Exception:
        pass
    return filter(lambda x: "ecloud" in x["name"], result)


@gen.coroutine
def get_subnet_tenant_hosts(subnet_ids, tenant_id):
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    vlan_hosts = []
    try:
        for subnet_id in subnet_ids:
            sql = "select vh.host_id " \
                  "from vlan_subnet_tenant st " \
                  "left join vlan_hosts vh on st.vlan_id=vh.vlan_id " \
                  "where subnet_id = %s and vh.host_id is not null"
            cur = yield db.execute(sql, [subnet_id])
            host = cur.fetchall()
            host_ids = [int(item["host_id"]) for item in host]
            vlan_hosts.append(host_ids)

        cur = yield db.execute("select hosts from tenant_hosts where tenant_id=%s", [tenant_id])
        hosts = cur.fetchone()
        tenant_hosts = hosts and hosts["hosts"] and json.loads(hosts["hosts"])
        result = {"tenant_hosts": tenant_hosts, "vlan_hosts": vlan_hosts}

    except Exception, e:
        LOG.error("query subnet tenant  hosts of vlan error: %s" % e)
        raise e
    raise gen.Return(result)


@gen.coroutine
def get_vm_avilable_hosts(subnet_ids, tenant_id):
    try:
        result = yield get_subnet_tenant_hosts(subnet_ids, tenant_id)
        vlan_hosts = result["vlan_hosts"]
        tenant_hosts = result["tenant_hosts"]
        if not vlan_hosts or not tenant_hosts:
            raise gen.Return([])

        result = vlan_hosts.pop()
        for hosts in vlan_hosts:
            result = set(result) & set(hosts)
        result = list(set(result) & set(tenant_hosts))
    except Exception, e:
        LOG.error("get_vm_avilable_hosts error: %s" % e)
        raise e
    raise gen.Return(result)


@gen.coroutine
def count_tenant_vm(tenant_id):
    try:
        db = dbpools.get_pool(dbpools.NOVA_DB)
        sql = "select host,hostname from instances " \
              "where project_id=%s and deleted=0"
        cur = yield db.execute(sql, (tenant_id))
        host_info = cur.fetchall()
        result = {}
        for item in host_info:
            if item["host"] in result:
                result[item["host"]] += 1
            else:
                result[item["host"]] = 1
    except Exception as e:
        raise e
    raise gen.Return(result)


@gen.coroutine
def count_tenant_vd(tenant_id):
    try:
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql = "select id,availability_zone from volumes " \
              "where project_id=%s and host LIKE '%%lvm' and deleted=0 "
        cur = yield db.execute(sql, (tenant_id))
        host_info = cur.fetchall()
        result = {}
        for item in host_info:
            if item["availability_zone"] in result:
                result[item["availability_zone"]] += 1
            else:
                result[item["availability_zone"]] = 1
    except BaseException as e:
        LOG.error("count tenant volumes error %s", e)
        LOG.error(trace())
    raise gen.Return(result)


@gen.coroutine
def count_network_vm(hosts, network_id):
    try:
        db = dbpools.get_pool(dbpools.NOVA_DB)
        sql = "select instances.host,info.network_info " \
              "from instances " \
              "left join instance_info_caches info " \
              "on info.instance_uuid=instances.uuid " \
              "where instances.host in %s and instances.deleted=0 "
        cur = yield db.execute(sql, [hosts])
        info = cur.fetchall()
        result = dict.fromkeys(hosts, 0)
        for item in info:
            for r in json.loads(item["network_info"]):
                if r["network"]["id"] == network_id:
                    result[item["host"]] += 1
    except Exception as e:
        raise e
    raise gen.Return(result)


@gen.coroutine
def main():
    host_ipmi = {
        "ipmi_user": "user21",
        "ipmi_pass": "password21",
        "ipmi_ip": "10.10.98.21",
        "des": "desc"
    }
    yield update_host(1, host_ipmi)
    hosts = yield query_host(id=1)
    print hosts


if __name__ == '__main__':
    from tornado import ioloop

    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
