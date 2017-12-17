# -*- coding: utf-8 -*-
import json
import logging

from tornado import gen

from easted import log
from easted.core import dbpools
from easted.identify.exception import UnknownQuotaName, TenantQuotaOperationFailed, TenantQuotaOutOfRange
from easted.utils import required

__author__ = "gaoshan@easted.com.cn"

__all__ = [
    "QUOTA_NAMES",
    "get_quota_names",
    "get_quota",
    "delete_quotas",
    "check_quota",
    "update_quota_limit",
    "update_quota_used"
]

LOG = logging.getLogger('system')


class QUOTA_NAMES:
    cores = 'cores'
    memory = 'memory'
    disks = 'disks'
    disk_capacity = 'disk_capacity'
    snapshots = 'snapshots'
    snapshot_capacity = 'snapshot_capacity'
    backups = 'backups'
    backup_capacity = 'backup_capacity'


def get_quota_names():
    ret = QUOTA_NAMES.__dict__.keys()
    return filter(lambda x: x.find('__') != 0, ret)


@gen.coroutine
@required('tenant_id', 'name')
def get_quota(tenant_id, name):
    __check_quota_name(name)
    try:
        quota = yield __get_from_db(tenant_id, name)
        if not quota:
            yield update_quota_limit(tenant_id, name)
            quota = yield __get_from_db(tenant_id, name)
    except Exception, e:
        LOG.error(e.message)
        raise TenantQuotaOperationFailed()
    raise gen.Return(quota)


@gen.coroutine
def check_quota(tenant_id, name, used):
    quota = yield get_quota(tenant_id, name)
    if -1 != quota['quota_limit'] and used > quota['quota_limit']:
        raise TenantQuotaOutOfRange()


@gen.coroutine
@required('tenant_id', 'name')
def update_quota_limit(tenant_id, name, limit=-1):
    __check_quota_name(name)
    quota = yield __get_from_db(tenant_id, name)
    try:
        db = dbpools.get_local()
        if quota:
            yield dbpools.execute_commit(
                db,
                'update tenant_quotas set dt_updated=utc_timestamp(), quota_limit=%s '
                'where tenant_id = %s and quota_name = %s',
                (limit, tenant_id, name)
            )
        else:
            yield dbpools.execute_commit(
                db,
                'insert into tenant_quotas (tenant_id, quota_name, quota_limit, dt_created) '
                'values (%s, %s, %s,  utc_timestamp())',
                (tenant_id, name, limit)
            )
    except Exception, e:
        LOG.error(e.message)
        raise TenantQuotaOperationFailed()


@gen.coroutine
@required('tenant_id', 'name')
def update_quota_used(tenant_id, name, used):
    __check_quota_name(name)
    quota = yield __get_from_db(tenant_id, name)
    if not quota:
        yield update_quota_limit(tenant_id, name)
    try:
        yield dbpools.execute_commit(
            dbpools.get_local(),
            'update tenant_quotas set dt_updated=utc_timestamp(), quota_used=%s '
            'where tenant_id = %s and quota_name = %s',
            (used, tenant_id, name)
        )
    except Exception, e:
        LOG.error(e.message)
        raise TenantQuotaOperationFailed()


@gen.coroutine
def delete_quotas(tenant_id):
    try:
        yield dbpools.execute_commit(
            dbpools.get_local(),
            'delete from tenant_quotas where tenant_id = %s',
            (tenant_id, )
        )
    except Exception, e:
        LOG.error(e.message)
        raise TenantQuotaOperationFailed()


def __check_quota_name(name):
    if name not in QUOTA_NAMES.__dict__:
        raise UnknownQuotaName(args=[name])


@gen.coroutine
def __get_from_db(tenant_id, name):
    db = dbpools.get_local()
    cur = yield db.execute(
        "select tenant_id, quota_name, quota_limit, quota_used, "
        "unix_timestamp(dt_created) as dt_created, unix_timestamp(dt_updated) as dt_updated "
        "from tenant_quotas where tenant_id = %s and quota_name = %s",
        (tenant_id, name)
    )
    raise gen.Return(cur.fetchone())


@gen.coroutine
def main():
    print get_quota_names()
    yield update_quota_limit('sdfsdfsddd', QUOTA_NAMES.cores, 50)
    yield update_quota_used('sdfsdfsddd', QUOTA_NAMES.cores, 5)
    quota = yield get_quota('sdfsdfsddd', QUOTA_NAMES.cores)
    yield delete_quotas('sdfsdfsddd')
    print json.dumps(quota)

if __name__ == '__main__':
    from tornado import ioloop
    log.init()
    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)