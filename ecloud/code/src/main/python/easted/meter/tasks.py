#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pymongo
import logging
from easted.core.rest import Response
from easted.meter.helpers import *
from easted.core.openstack import get_session

LOG = logging.getLogger('system')
__all__ = ["db_clean"]
__author__ = 'fish'


@gen.coroutine
def db_clean(interval=3600):
    """clean all meters records that generated {interval} seconds ago.

    :param interval: time in seconds.
    :return: None
    """
    # TODO: assuming that mongodb server running on ceilometer central host
    client = None
    try:
        LOG.debug("*************************************************")
        LOG.debug("***********  Clean   MongoDB  Start  ************")
        LOG.debug("*************************************************")
        session = yield get_session()
        controller_host = session.urls[TYPE_METERING]['internalURL'].split(':')[1].strip('/')
        client = pymongo.MongoClient(host=controller_host, port=27017)
        db = client.ceilometer
        db.meter.remove({'timestamp': {'$lt': datetime.datetime.utcnow() - datetime.timedelta(seconds=interval)}})
        LOG.debug("*************************************************")
        LOG.debug("***********  Clean   MongoDB  End  ************")
        LOG.debug("*************************************************")
    except Exception, e:
        LOG.error("Error happened while cleaning mongodb: %s" % e)
    finally:
        client.close()
        raise gen.Return(Response())
