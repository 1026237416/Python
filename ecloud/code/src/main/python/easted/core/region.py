# -*- coding: utf-8 -*-
import logging
from tornado import gen
from easted import config
from easted.core import dbpools
from easted.core.exception import ECloudException

CONF = config.CONF
LOG = logging.getLogger('system')
__author__ = 'litao@easted.com.cn'


class RegionQueryException(ECloudException):
    msg = "error.region.query.exception"


class RegionException(ECloudException):
    msg = "error.region.exception"


@gen.coroutine
def list_region(name=None):
    result = []
    try:
        regions = yield __query_region(name)
        for region in regions:
            region["is_current_region"] = \
                region.get("region") == CONF.keystone.region_name
            result.append(region)
    except Exception:
        raise RegionQueryException()
    raise gen.Return(result)


@gen.coroutine
def get_current_region():
    region = {}
    try:
        regions = yield __query_region(name=CONF.keystone.region_name)
        if regions:
            region = regions[0]
    except Exception:
        raise RegionQueryException()
    raise gen.Return(region)


@gen.coroutine
def __query_region(name=None):
    db = dbpools.get_common()
    regions = []
    try:
        if name:
            cur = yield db.execute("select * from regions where  region = %s", (name,))
        else:
            cur = yield db.execute("select * from regions")
        if cur:
            regions = cur.fetchall()
    except Exception, e:
        LOG.error("get regions error: %s" % e)
        raise e
    raise gen.Return(regions)
