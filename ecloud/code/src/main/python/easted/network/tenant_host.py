# -*- coding: utf-8 -*-
from easted.core import dbpools
from tornado import gen
from exception import *
from uuid import uuid4
import logging
import json


__all__ = [
    "get_tenant_hosts",
    "set_tenant_hosts",
    "delete_tenant_host"
]

LOG = logging.getLogger('system')

__author__ = 'litao@easted.com.cn'


@gen.coroutine
def get_tenant_hosts(tenant_id):
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    try:
        cur = yield db.execute("select hosts from tenant_hosts where tenant_id=%s", [tenant_id])
        hosts = cur.fetchone()
        hosts = hosts and hosts["hosts"] and json.loads(hosts["hosts"])
        if not hosts:
            hosts=[]
    except Exception,e:
        LOG.error("query hosts of tenant error: %s" % e)
        raise e
    raise gen.Return(hosts)


@gen.coroutine
def delete_tenant_host(tenant_id, host_id):
    try:
        old_tenant_hosts = yield get_tenant_hosts(tenant_id)
        if host_id not in old_tenant_hosts:
            raise HostNotExist
        used_tenant_host = yield get_tenant_hosts_used(tenant_id)
        if host_id in used_tenant_host:
            raise TenantHostUseError
        old_tenant_hosts.remove(host_id)
        host_ids = old_tenant_hosts
        yield update_tenant_hosts(tenant_id, host_ids)
    except Exception as e:
        LOG.error("delete the tenant host error :%s" % e)
        raise e


@gen.coroutine
def set_tenant_hosts(tenant_id, tenant_hosts):
    """
    :param tenant_id:
    :param tenant_hosts: []
    :return:
    """
    if not tenant_hosts:
        tenant_hosts = []
    try:
        from easted.host.host import list_simple_hosts
        all_hosts = yield list_simple_hosts()
        all_hosts = [host["id"] for host in all_hosts]
        for host in tenant_hosts:
            if host not in all_hosts:
                raise HostNotExist

        old_tenant_hosts = yield get_tenant_hosts(tenant_id)
        if old_tenant_hosts:
            tenant_hosts = list(set(tenant_hosts + old_tenant_hosts))
            yield update_tenant_hosts(tenant_id, tenant_hosts)
        else:
            yield insert_tenant_hosts(tenant_id, tenant_hosts)
            yield update_tenant_hosts(tenant_id, tenant_hosts)


    except Exception, e:
        LOG.error("set the tenant_hosts error :%s" % e)
        raise e


@gen.coroutine
def insert_tenant_hosts(tenant_id, tenant_hosts):
    tenant_hosts = json.dumps(tenant_hosts)
    try:
        yield dbpools.execute_commit(dbpools.get_local(),
                                     sql="insert into tenant_hosts (id,tenant_id,hosts) "
                                         "select %s, %s,%s from dual where not EXISTS "
                                         "(SELECT * from tenant_hosts where tenant_id =%s)",
                                     param=(str(uuid4()), tenant_id, tenant_id, tenant_hosts))
    except Exception, e:
        LOG.error("insert the tenant_hosts error :%s" % e)
        raise e


@gen.coroutine
def update_tenant_hosts(tenant_id, tenant_hosts):
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    tenant_hosts = json.dumps(tenant_hosts)
    try:
        sql = "UPDATE tenant_hosts SET hosts=%s " \
              "WHERE tenant_id=%s"

        yield db.execute(sql, (tenant_hosts, tenant_id))
    except Exception, e:
        LOG.error("update the tenant_hosts error :%s" % e)
        raise e


@gen.coroutine
def get_tenant_hosts_used(tenant_id):
    db = dbpools.get_pool(dbpools.NOVA_DB)
    try:
        sql = "SELECT DISTINCT(b.id) " \
              "FROM instances a LEFT JOIN compute_nodes b " \
              "ON a.host=b.host " \
              "WHERE a.project_id=%s and a.deleted=0 and a.node is not NULL"

        cur = yield db.execute(sql, [tenant_id])
        result = cur.fetchall()
        result = [item["id"] for item in result]
    except Exception, e:
        LOG.error("get tenant_hosts_used error :%s" % e)
        raise e
    raise gen.Return(result)
