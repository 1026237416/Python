# coding:utf-8
import logging
from uuid import uuid4
from easted.core import dbpools
from tornado import gen

LOG = logging.getLogger('system')


@gen.coroutine
def get_snapshot_volume_summary(tenant_ids=None):
    try:
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql = "SELECT f.id, f.display_name name, vol_mate.value displayname, c.v_count count , c.v_size size " \
              "FROM (SELECT b.created_at, count(b.id) as v_count, sum(b.size) as v_size, b.project_id, SUBSTRING(b.display_name,17) s_name " \
              "FROM volumes b where b.deleted=0 and b.display_description=2 and display_name LIKE 'ecloud-snapshot-vd%%' group by b.display_name) c " \
              "LEFT JOIN (SELECT a.id, a.display_name, a.display_description, a.host " \
              "FROM volumes a WHERE a.display_description=0 and a.deleted=0) f on f.display_name=c.s_name " \
              "LEFT JOIN (select volume_metadata.volume_id, volume_metadata.key, volume_metadata.value " \
              "FROM volume_metadata where volume_metadata.deleted=0 and volume_metadata.key='displayname') vol_mate " \
              "on vol_mate.volume_id = f.id "
        params = []
        if tenant_ids and isinstance(tenant_ids, basestring):
            sql += "where c.project_id=%s"
            params.append(tenant_ids)
        elif tenant_ids and isinstance(tenant_ids, list):
            sql += "where c.project_id in %s"
            params.append(tuple(tenant_ids))
        sql += " order by c.created_at desc"
        cur = yield db.execute(sql, params)
        volume_summary = cur.fetchall()
    except Exception, e:
        LOG.error("Get Snapshot Volume Summary error: %s" % e)
        raise e
    raise gen.Return(volume_summary)


@gen.coroutine
def get_snapshot_vm_summary(tenant_ids=None):
    try:
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql = "SELECT vol_info.size, vol_info.count, vol_info.vm_name as vm_name, vol_mate.value as id " \
              "FROM (SELECT a.created_at, count(a.id) count, sum(a.size) size, a.id, a.display_name, a.project_id, SUBSTRING(a.display_name,17) vm_name " \
              "FROM volumes a WHERE a.deleted=0 and a.display_name LIKE 'ecloud-snapshot-vm%%' GROUP BY a.display_name) vol_info " \
              "LEFT JOIN (select volume_metadata.volume_id, volume_metadata.key, volume_metadata.value " \
              "FROM volume_metadata where volume_metadata.deleted=0 and volume_metadata.key='vm_id') vol_mate " \
              "on vol_mate.volume_id = vol_info.id "
        params = []
        if tenant_ids and isinstance(tenant_ids, basestring):
            sql += "where vol_info.project_id=%s"
            params.append(tenant_ids)
        elif tenant_ids and isinstance(tenant_ids, list):
            sql += "where vol_info.project_id in %s"
            params.append(tuple(tenant_ids))
        sql += " order by vol_info.created_at desc"
        cur = yield db.execute(sql, params)
        vm_summary = cur.fetchall()
    except Exception, e:
        LOG.error("Get Snapshot VM Summary error: %s" % e)
        raise e
    raise gen.Return(vm_summary)


@gen.coroutine
def snapshot_real_used(tenant_id):
    try:
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql = "SELECT COUNT(id) as count, SUM(size) as used_size " \
              "FROM volumes " \
              "WHERE display_description = 2 and project_id=%s and status != 'deleted'"
        cur = yield db.execute(sql, [tenant_id])
        volume_used = cur.fetchone()
    except Exception, e:
        LOG.error("snapshot real used error: %s" % e)
        raise e
    raise gen.Return(volume_used)



@gen.coroutine
def update_block_device_mapping(vm_id,volume_id):
    LOG.debug("the vm %s is recover ", vm_id)
    db = dbpools.get_nova()
    tx = yield db.begin()
    try:
        cur = yield tx.execute(
                "select connection_info  from block_device_mapping where instance_uuid = %s and volume_id = %s",
                (vm_id,volume_id))
        sys = cur.fetchone()
        # cur.close()

        sys_connection_info = sys.get("connection_info")

        yield tx.execute(
                "update  block_device_mapping  set deleted = 1 where instance_uuid = %s  and volume_id = %s",
                (vm_id,volume_id))

        yield tx.execute(
                "update  block_device_mapping  set   volume_id = %s , connection_info = %s  where instance_uuid = %s  and device_name = '/dev/vda'",
                (volume_id, sys_connection_info, vm_id))

    except Exception as e:
        LOG.error("detach iso volume : %s" % e)
        yield tx.rollback()
        raise e
    else:
        yield tx.commit()
        db = dbpools.get_cinder()
        tx1 = yield db.begin()
        try:
            yield tx1.execute("update volume_attachment set  mountpoint = '/dev/vda'  where volume_id = %s and instance_uuid = %s",
                              (volume_id, vm_id))
        except Exception as e:
            LOG.error("update  volume_attachment mountpoint: %s" % e)
            yield tx1.rollback()
            raise e
        else:
            yield tx1.commit()


@gen.coroutine
def update_volume_db(volume_id, status, attach_status):
    try:
        db = dbpools.get_cinder()
        update_sql = "update volumes set status ='%s', attach_status = '%s' where id = '%s'" % (
            status, attach_status, volume_id)
        yield dbpools.execute_commit(db, update_sql, param=None)
    except Exception, e:
        LOG.error("update volumes db error: %s" % e)
        raise e


@gen.coroutine
def update_volume_attachment_db(vm_id, volume_id):
    """
    已废弃
    :param vm_id:
    :param volume_id:
    :return:
    """
    try:
        db = dbpools.get_cinder()
        update_sql = "update volume_attachment set volume_id = '%s' " \
                     "where instance_uuid = '%s' and mountpoint ='/dev/vda' " % (volume_id, vm_id)
        yield dbpools.execute_commit(db, update_sql, param=None)
    except Exception, e:
        LOG.error("update volume_attachments db error: %s" % e)
        raise e


@gen.coroutine
def main():
    yield update_volume_db(volume_id="d8d08f40-fb28-4ffb-ab2a-71e7d560f65c", status="in-use", attach_status="attached")


if __name__ == '__main__':
    from tornado import ioloop
    from easted.core import dbpools

    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
