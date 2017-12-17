# -*- coding: utf-8 -*-
from tornado import gen
from easted.core import dbpools
from easted import volume
from easted import compute
from easted import snapshot
import logging

LOG = logging.getLogger("system")

__author__ = 'litao@easted.com.cn'


@gen.coroutine
def clean_rubbish():
    """clean task"""
    try:
        db = dbpools.get_local()
        sql = "update taskflow set status=4, updated_at=now() where status=3"
        yield dbpools.update(db, sql)
    except Exception, e:
        pass
    try:
        """clean volume"""
        need_del_volume = yield volume.list_volume(detailed=False, vd_type=5)
        for vol in need_del_volume:
            yield volume.delete_volume(vol.get("id"))
    except Exception, e:
        pass
    try:
        """clean sys volume"""
        need_del_sys_volume = yield volume.list_volume(detailed=False, vd_type=1, available=True)
        for vol in need_del_sys_volume:
             vm = yield compute.get_server(name=vol.get("name")[len('ecloud-sys-volume-'):])
             if not vm:
                yield snapshot.update_volume_db(volume_id=vol.get("id"),status="available",attach_status="detached")
                yield volume.delete_volume(vol.get("id"))
    except Exception, e:
        pass
    try:
        """deleting status clean nova"""
        db_nova = dbpools.get_nova()
        sql_nova = "update  instance_metadata  set value = '' where deleted = 0 and  `key` = 'status'"
        row_nova = yield dbpools.update(db_nova, sql_nova)
        LOG.debug("clean nova metadata status sql is %s affect row %s", sql_nova, row_nova)

        """deleting status clean cinder"""
        db_cinder = dbpools.get_cinder()
        sql_cinder = "update  volume_metadata  set value = '' where deleted = 0 and  `key` = 'status'"
        row_cinder = yield dbpools.update(db_cinder, sql_cinder)
        LOG.debug("clean cinder metadata status sql is %s affect row %s", sql_cinder, row_cinder)
    except Exception, e:
        pass
