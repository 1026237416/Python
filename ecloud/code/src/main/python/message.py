# -*- coding: utf-8 -*-
import logging
import os
import sys
from easted import config
import easted.log as log
from easted.log.conf import ECLOUD_MESSAGE_LOG_CONF
from easted.utils import loadmodules
from easted.core import dbpools
from easted.core import consumer

config.register('message.url', setting_type=config.TYPE_STR,
                default='amqp://guest:guest@10.10.130.56:5672/%2F', secret=True)

CONF = config.CONF
os.chdir(sys.path[0])
LOG = logging.getLogger("system")
__author__ = 'litao@easted.com.cn'

try:
    log.init(ECLOUD_MESSAGE_LOG_CONF)
    print "Start the eworker service..."
    channels = [{
        "exchange_declare": None,
        "queue_declare": {
            "name": "ecloud-openstack",
            "bind":
                {
                    "nova": "notifications.info",
                    "cinder": "notifications.info",
                    # "keystone": "notifications.info",
                    # "neutron": "notifications.info",
                }
        },
        "adapter_declare": "easted.queue.osadapter"
    }, {
        "exchange_declare": [('ecloud', 'topic')],
        "queue_declare": {
            "name": "ecloud-task",
            "bind":
                {
                    "ecloud": "ecloud-ruote"
                }
        },
        "adapter_declare": "easted.queue.ecloudadapter"
    }, {
        "exchange_declare": [('hosts.notifications', 'topic')],
        "queue_declare": {
            "name": "ecloud-alarm",
            "bind":
                {
                    "hosts.notifications": "snmptrap",
                    #"nova": "compute.ecloud"
                }
        },
        "adapter_declare": "easted.queue.alarmadapter"
    }]

    listeners = loadmodules.scandir("easted")
    LOG.debug("init listeners %s",listeners)
    for channel in channels:
        channel["queue_declare"]["listeners"] = listeners.get(channel["queue_declare"]["name"])
    dbpools.init()
    connect = consumer.Connection(CONF.message.url, channels)
    connect.run()
except KeyboardInterrupt:
    print "Stop the eworker service..."
    connect.stop()
    sys.exit(-1)
