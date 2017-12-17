# -*- coding: utf-8 -*-
from easted.core import dbpools

from tornado import gen
from exception import *
from easted import config
from easted.core.dbpools import get_conn
from easted.utils.tornado_subprocess import call_subprocess
from easted.host.host import query_host
import time
import logging

__author__ = 'litao@easted.com.cn'

LOG = logging.getLogger('system')
config.register("service.network", default="localhost", setting_type=config.TYPE_LIST, secret=True)
config.register("service.storage", default="localhost", secret=True)
config.register("meter.mongodb_server", default="localhost", secret=True)
config.register("database.db_redis", secret=True)
config.register('message.url', setting_type=config.TYPE_STR,
                default='amqp://guest:guest@10.10.199.11:5672/%2F', secret=True)


CONF = config.CONF
LOG = logging.getLogger('system')
__all__ = [
    "list_openstack_service"
]
__service = {
    "mongod": [
        CONF.meter.mongodb_server
    ]
}
__ps = {
    "rabbitmq-server": [
        CONF.message.url[CONF.message.url.index('@') + 1:CONF.message.url.index(':', CONF.message.url.index('@'), )]],
    "redis": [get_conn(CONF.database.db_redis)["host"]],
    "manor": CONF.service.network,
    "task": None,
    "message": None
}


@gen.coroutine
def get_ecloud_services(host, service):
    """ get ecloud service info
    :param services: the set of ecloud service
    :return:
    """
    curr_time = time.time()
    try:
        shell = "ssh " + host + " ps -aux|grep " + service + "|grep -v 'grep'|awk '{print $2}'"
        LOG.debug("get service status with ps host is %s shell is %s", host, shell)
        info = yield call_subprocess(shell)
        result = {
            "name": "ecloud-" + service,
            "host": host,
            "update_at": curr_time
        }
        if info[0]:
            result["status"] = "active"
        else:
            result["status"] = "failed"

    except Exception:
        raise gen.Return({
            "name": "ecloud-" + service,
            "host": host,
            "update_at": curr_time,
            "status": "failed"
        }
        )
    raise gen.Return(result)


@gen.coroutine
def get_host_name(host=None):
    try:
        if host:
            name = yield call_subprocess("ssh " + host + " hostname")
        else:
            name = yield call_subprocess("hostname")
        LOG.debug("host name: %s", name)

    except Exception as e:
        LOG.error("get hostname error %s" % e)
        raise gen.Return(None)
    raise gen.Return(name[0].replace("\n", ""))


@gen.coroutine
def get_ceph_status(host):
    curr_time = time.time()
    try:
        infos = yield call_subprocess("ssh " + host + " 'ceph  -s'")
        infos = infos[0].split("\n")
        info = infos[1].split()
        status = "active" if info[1] == "HEALTH_OK" else "failed"
    except Exception:
        raise gen.Return({
            "name": "evs",
            "host": host,
            "update_at": curr_time,
            "status": "failed"
        })
    raise gen.Return({
        "name": "evs",
        "host": host,
        "update_at": curr_time,
        "status": status
    })


@gen.coroutine
def get_status_with_service(host, service):
    curr_time = time.time()
    try:
        shell = "ssh " + host + " 'systemctl is-active " + service + "' "
        result = yield call_subprocess(shell)
        status = "failed"
        sts = result[0]
        if "active\n" == sts:
            status = "active"

    except Exception as e:
        raise gen.Return({
            "name": service[len("openstack-"):] if "openstack-" in service else service,
            "update_at": curr_time,
            "host": host,
            "status": "failed"
        })
    raise gen.Return({
        "name": service[len("openstack-"):] if "openstack-" in service else service,
        "update_at": curr_time,
        "host": host,
        "status": status
    })


@gen.coroutine
def list_openstack_service(flag):
    """list openstack service info
        :param flag: the flag of openstack service
        flag=0: nova service
        flag=1: cinder service
        flag=2: neutron service
        flag=4: ceilometer service

    """
    if flag == "3":
        services = []
        hostname = yield get_host_name()
        try:
            if hostname:
                if CONF.service.storage:
                    host = yield get_host_name(CONF.service.storage)
                    ceph = yield get_ceph_status(host)
                    if ceph:
                        services.append(ceph)
                for k, v in __service.items():
                    if not v:
                        s_r = yield get_status_with_service(hostname, k)
                        if s_r:
                            services.append(s_r)
                    else:
                        for i in v:
                            host = yield get_host_name(i)
                            s_r = yield get_status_with_service(host, k)
                            if s_r:
                                services.append(s_r)
                for k, v in __ps.items():
                    if not v:
                        s_r = yield get_ecloud_services(hostname, k)
                        if s_r:
                            services.append(s_r)
                    else:
                        for i in v:
                            if i:
                                host = yield get_host_name(i)
                                s_r = yield get_ecloud_services(host, k)
                                if s_r:
                                    services.append(s_r)
        except ECloudException as e:
            LOG.error("get ecloud services error %s" % e)
        raise gen.Return(services)

    if flag == '0':
        db = dbpools.get_pool(dbpools.NOVA_DB)
        sql_select = "SELECT s.binary as name, DATE_FORMAT(updated_at,'%Y-%m-%dT%H:%i:%sZ') as update_at, s.host, " \
                     "TIMESTAMPDIFF(SECOND,updated_at,UTC_TIMESTAMP()) as heatbeat " \
                     "from services as s where s.binary != 'nova-cert'"
    elif flag == '1':
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql_select = "SELECT s.binary as name, DATE_FORMAT(updated_at,'%Y-%m-%dT%H:%i:%sZ') as update_at, s.host, " \
                     "TIMESTAMPDIFF(SECOND,updated_at,UTC_TIMESTAMP()) as heatbeat " \
                     "from services as s where s.host like '%@%' or `binary` != 'cinder-volume'"
    elif flag == '2':
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        sql_select = "SELECT a.binary as name, DATE_FORMAT(a.heartbeat_timestamp,'%Y-%m-%dT%H:%i:%sZ') as update_at, a.host, " \
                     "TIMESTAMPDIFF(SECOND,a.heartbeat_timestamp,UTC_TIMESTAMP()) as heatbeat " \
                     "from agents as a"
    elif flag == '4':
        services = []
        out_hosts = yield query_host()
        for host in out_hosts:
            s_r = yield get_status_with_service(host["name"], "openstack-ceilometer-compute")
            if s_r:
                services.append(s_r)
        raise gen.Return(services)

    try:
        cur = yield db.execute(sql_select)
        services = cur.fetchall()
        res = []
        if services:
            for service in services:
                deltatimede = service.get('heatbeat')
                service['status'] = "active" if deltatimede <= 60 else "failed"
                del service["heatbeat"]
                res.append(service)
    except Exception as e:
        LOG.error("Get service info error: %s" % e)
        raise e
    raise gen.Return(services)
