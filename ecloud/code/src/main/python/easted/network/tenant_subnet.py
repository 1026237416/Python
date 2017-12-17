# -*- coding: utf-8 -*-
import logging
import netaddr
import json
from subnetdao import *
from tornado import gen
from exception import *
from easted.core import dbpools

LOG = logging.getLogger('system')
__all__ = [
    "set_tenant_subnet",
    "set_tenant_subnet_ips"
]

__author__ = 'litao@easted.com.cn'


@gen.coroutine
def set_tenant_subnet(tenant_id, subnet_ids):
    """ set vlans of tenant
    :param tenant_id: id of tenant
    :param subnet_ids: AttachTenantNetwork
    """
    new_subnet_ids = tuple(subnet_ids)
    old_subnet_ids = yield query_tenant_subnets(tenant_id)
    if old_subnet_ids == new_subnet_ids:
        raise gen.Return(True)
    try:
        used_subnet_ids = yield get_used_subnet_ids(tenant_id)
        if not new_subnet_ids:
            if used_subnet_ids:
                raise SubNetInUseError

            yield delete_tenant_subnets(tenant_id)
        else:
            remove_used_subnet_ids = [subnet_id for subnet_id in used_subnet_ids
                                      if subnet_id not in new_subnet_ids]
            if remove_used_subnet_ids:
                raise SubNetInUseError

            remove_tenant_subnets = [subnet_id for subnet_id in old_subnet_ids
                                     if subnet_id not in new_subnet_ids]
            if remove_tenant_subnets:
                yield delete_tenant_subnets(tenant_id, remove_tenant_subnets)

            add_tenant_subnets = [subnet_id for subnet_id in new_subnet_ids
                                     if subnet_id not in old_subnet_ids]
            if add_tenant_subnets:
                yield insert_tenant_subnets(tenant_id,
                                            add_tenant_subnets)
    except Exception, e:
        LOG.error("set subnets of tenant error: %s" % e)
        raise e
    raise gen.Return(True)

@gen.coroutine
def set_tenant_subnet_ips(subnet_id, tenant_id, new_ippools):
    try:
        if not new_ippools:
            new_ippools = []
        subnet_ippool = yield query_subnet_ips_neutron(subnet_id)
        subnet_used_ips = yield query_subnet_ips_used_neutron(subnet_id)
        subnet_used_ips_int = [int(netaddr.IPAddress(item["ip"])) for item in subnet_used_ips]
        tenant_subnet_info = yield query_subnet_tenant_all(subnet_id, tenant_id)
        old_ippools = tenant_subnet_info[0]["ippools"] and json.loads(tenant_subnet_info[0]["ippools"])

        if new_ippools:
            for new_ippool in new_ippools:
                for ippool in subnet_ippool:
                    if int(netaddr.IPAddress(ippool["ip_l"])) >= \
                            int(netaddr.IPAddress(new_ippool["end"])) >= \
                            int(netaddr.IPAddress(new_ippool["start"])) >= \
                            int(netaddr.IPAddress(ippool["ip_f"])):
                        break
                else:
                    raise SubnetIPNotExist

        old_ips = yield _transefer(old_ippools)
        new_ips = yield _transefer(new_ippools)
        for ip_int in new_ips:
            if ip_int in subnet_used_ips_int and ip_int not in old_ips:
                raise SubNetInUseError
        for ip_int in old_ips:
            if ip_int in subnet_used_ips_int and ip_int not in new_ips:
                raise SubNetInUseError

        yield _update_tenant_subnet_ips(subnet_id, tenant_id, new_ippools)

    except Exception, e:
        LOG.error("set subnet tenant ips  error: %s" % e)
        raise e

@gen.coroutine
def _transefer(ippools):
    """

    :param ippools:
    :return: ips (all ip): list
    """
    ips = []
    if ippools:
        for item in ippools:
            start = int(netaddr.IPAddress(item["start"]))
            end = int(netaddr.IPAddress(item["end"]))
            for ip_int in xrange(start, end + 1):
                ips.append(ip_int)
    raise gen.Return(ips)


@gen.coroutine
def _update_tenant_subnet_ips(subnet_id, tenant_id, new_ippools):
    try:
        db = dbpools.get_pool(dbpools.LOCAL_DB)
        sql = "UPDATE vlan_subnet_tenant SET ippools=%s " \
              "WHERE subnet_id=%s and tenant_id=%s " \

        yield dbpools.execute_commit(db, sql=sql, param=(json.dumps(new_ippools), subnet_id, tenant_id))

    except Exception, e:
        LOG.error("update_tenant subnet error: %s" % e)
        raise e


