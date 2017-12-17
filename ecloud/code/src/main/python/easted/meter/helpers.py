#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re

from tornado import gen
from motor.motor_tornado import MotorClient

from easted.core.openstack import *
from easted import config
import datetime

HOST_LINKS_CACHE = {}
CONF = config.CONF

config.register('meter.mongodb_server', setting_type=config.TYPE_STR, default="", secret=True)
config.register('meter.mongodb_port', setting_type=config.TYPE_INT, default=27017, secret=True)

_OS_BRIDGE = ["virbr0-nic"]


@gen.coroutine
def mongodb_conf():
    try:
        if CONF.meter.mongodb_server and CONF.meter.mongodb_port:
            controller_host, port = CONF.meter.mongodb_server, CONF.meter.mongodb_port
        else:
            session = yield get_session()
            port = 27017
            controller_host = session.urls[TYPE_METERING]['internalURL'].split(':')[1].strip('/')
    except Exception, e:
        LOG.error("Error occurred connecting mongodb: %s") % e
        raise OpenStackException(e)
    raise gen.Return((controller_host, port))


@gen.coroutine
def samples_query(query_body, limit):
    try:
        conf = yield mongodb_conf()
        client = MotorClient('mongodb://%s:%s/ceilometer' % conf)
        db = client.get_default_database()
        cursor = db.meter.find(query_body).hint([('timestamp', -1)]).limit(limit)
        samples = yield cursor.to_list(None)
    except Exception, e:
        LOG.error("ceilometer - query samples error: %s" % e)
        raise OpenStackException(e.message)
    raise gen.Return(samples)


@gen.coroutine
def resources_query(query_body):
    try:
        conf = yield mongodb_conf()
        client = MotorClient('mongodb://%s:%s/ceilometer' % conf)
        db = client.get_default_database()
        cursor = db.resource.find(query_body).hint([('_id', 1)])
        samples = yield cursor.to_list(None)
    except Exception, e:
        LOG.error("ceilometer - query resource error: %s" % e)
        raise OpenStackException(e.message)
    raise gen.Return(samples)


def uuid_gen(n):
    return (''.join(map(lambda xx: (hex(ord(xx))[2:]), os.urandom(n))))[0:16]


@gen.coroutine
def get_host_notwork_adapters(host_ip):
    links = HOST_LINKS_CACHE.get(host_ip)
    try:
        if not links:
            adapters = yield resources_query({'metadata.resource_url': 'snmp://' + host_ip})
            # TODO: to find physical links more accurately
            vlink = '%s\.[\w]{3}[\da-f]{8}-[\da-f]{2}' % host_ip
            links = [adapter['_id'] for adapter in adapters if adapter['metadata'].get('mac') and
                     not re.compile(vlink).match(adapter['_id']) and adapter['metadata'].get('speed', 0) > 0 and
                     adapter['metadata'].get('name') not in _OS_BRIDGE]
            HOST_LINKS_CACHE[host_ip] = links
    except StopIteration, e:
        LOG.error("ceilometer - iterate adapters error: %s" % e)
        raise OpenStackException(e)
    except Exception, e:
        LOG.error("ceilometer - query adapters error: %s" % e)
        raise OpenStackException(e)
    raise gen.Return(links)


@gen.coroutine
def main():
    start = time.time()
    time_limit = {
        "timestamp": {
            '$lt': datetime.datetime.utcnow(),
            '$gt': datetime.datetime.utcnow() - datetime.timedelta(minutes=30)
        }
    }
    # 'timestamp': {'$gt': datetime.datetime(2016, 7, 4, 6, 14, 39, 976961), '$lt': datetime.datetime(2016, 7, 4, 6, 44, 39, 976954)},
    q_body = {
        'counter_name': 'cpu_util',
        'resource_id': '44da2463-b021-4694-bf91-df251d816008',
        "timestamp": {
            '$lt': datetime.datetime.utcnow(),
            '$gt': datetime.datetime.utcnow() - datetime.timedelta(minutes=30)
        }
    }

    query_body = {"resource_id": {"$in": ["7e80b557-18fb-4f08-8261-6805497796a7"]},
                  "counter_name": {"$in": ['cpu_util', 'memory.resident', 'memory']}}
    query_body.update(time_limit)
    # rst = yield query_group(query_body, "counter_name")
    vm_monitor_infos = [
        'network.incoming.bytes.rate',
        'network.outgoing.bytes.rate',
        'cpu_util',
        'disk.read.bytes.rate',
        'disk.write.bytes.rate',
        'memory.resident',
        'memory'
    ]

    query_params = {
        "counter_name": {"$in": vm_monitor_infos}
    }

    query_params1 = {
        "counter_name": "cpu_util"
    }

    rst = yield samples_query(q_body, 10)
    print "rst====%s\n" % rst
    print "last time: %s " % (time.time() - start)


if __name__ == "__main__":
    from tornado import ioloop
    from easted.core import dbpools

    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
