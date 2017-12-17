# -*- coding: utf-8 -*-
import logging
from tornado import gen
from easted.core import dbpools
from easted.utils.datetimeUtils import time2epoch

__author__ = 'Jim Xu'
__all__ = [
    'query',
    'summary',
    'clear',
    "get_count_alarm"
    ]

LOG = logging.getLogger('system')


def __build_sql(target, typ, level, fuzzy):
    sql = "select * from alarm "
    if all(map(lambda x: x is None, [target, typ, level])):
        return sql + " order by create_at desc"

    sql += "where "
    type_ = "type = '%s'" % str(typ) if typ else ""
    level_ = "level = '%s'" % str(level) if level else ""
    if fuzzy:
        target_ = "target like '%"
        target_ += "%s" % target if target else ""
        target_ += "%'"
    else:
        target_ = "target = '%s'" % target if target else ""
    sql += " and ".join(q for q in [type_, level_, target_] if q)
    return sql + " order by create_at desc"


def __datetime_to_epochtime(dt):
    return time2epoch(dt) if dt else None



@gen.coroutine
def get_count_alarm(target):
    try:
        db = dbpools.get_pool(dbpools.LOCAL_DB)
        sql = "select count(*) as count from alarm where 1 = 1 "
        if target:
            sql += " and target='%s'" % target
        cur = yield db.execute(sql)
        vm_alarm_count = cur.fetchone()
    except Exception, e:
        LOG.error("get alarm failed: %s" % e)
    raise gen.Return(vm_alarm_count)


@gen.coroutine
def query(target, typ, level, fuzzy, start, limit):
    """告警页面"""
    LOG.debug("alarmAPI.query")
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    sql = __build_sql(target, typ, level, fuzzy)
    cur = yield db.execute(sql)
    if cur.rowcount:
        try:
            cur.scroll(start, 'absolute')
            if limit is 0:
                rs = cur.fetchall()
            else:
                rs = cur.fetchmany(limit)
        except Exception, e:
            LOG.error("get alarm failed: %s" % e)
            rs = []
    else:
        rs = []
    total = cur.rowcount
    for r in rs:
        r['create_at'] = __datetime_to_epochtime(r['create_at'])
        r['update_at'] = __datetime_to_epochtime(r['update_at'])
    LOG.debug("alarmAPI.query end")
    raise gen.Return((list(rs), total))


@gen.coroutine
def summary():
    """首页显示故障 告警 注意"""
    rs = dict()
    level = ['notice', 'warning', 'fatal']
    db = dbpools.get_pool(dbpools.LOCAL_DB)    
    for l in level:
        sql = "select count(*) from alarm where level = %s"
        cur = yield db.execute(sql, (l,))
        trs = cur.fetchone()
        rs[l] = trs['count(*)']
    raise gen.Return(rs)


@gen.coroutine
def clear(id_):
    LOG.debug("alarmAPI.clear")
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    sql_delete = "delete from alarm where id = %s"
    sql_select = "select target,message from alarm where id =%s"
    try:
        tx = yield db.begin()
        cur = yield tx.execute(sql_select, (id_,))
        yield tx.execute(sql_delete, (id_,))
        yield tx.commit()
        alarm_info = cur.fetchall()
        LOG.debug("alarmAPI.clear success")
    except Exception, e:
        yield tx.rollback()
        LOG.error("clear alarm failed: %s" % e)
        raise e
    raise gen.Return(alarm_info)


@gen.coroutine
def insert(target, typ, level, msg, create_time):
    LOG.debug("alarmAPI.insert")
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    sql = "insert into alarm (target, type, times, message, level, create_at) values (%s, %s, 1, %s, %s, %s)"
    vals = (target, typ, msg, level, create_time)
    tx = yield db.begin()
    try:
        yield tx.execute(sql, vals)
        yield tx.commit()
        LOG.debug("alarmAPI.insert: success")
    except Exception, e:
        yield tx.rollback()
        LOG.error("insert alarm failed: %s" % e)        
        raise e


@gen.coroutine
def update(id_, utime):
    LOG.debug("alarmAPI.update")
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    sql = "update alarm set times = times + 1, update_at = %s where id = %s"
    try:
        tx = yield db.begin()
        yield tx.execute(sql, (utime, id_))
        yield tx.commit()
        LOG.debug("alarmAPI.update success")
    except Exception, e:
        yield tx.rollback()
        LOG.error("update alarm failed: %s" % e)
        raise e


@gen.coroutine
def insert_or_update(target, typ, level, msg, create_time):
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    try:
        cur = yield db.execute("select id, create_at, update_at from alarm where target = %s and message = %s", (target, msg))
        rs = cur.fetchone()
        tx = yield db.begin()
        if rs:
            sql = "update alarm set times = times + 1, update_at = %s where id = %s"
            vals = (create_time, rs['id'])
        else:
            sql = "insert into alarm (target, type, times, message, level, create_at) values (%s, %s, 1, %s, %s, %s)"
            vals = (target, typ, msg, level, create_time)
        yield tx.execute(sql, vals)
        yield tx.commit()
    except Exception, e:
        LOG.error("insert or update alarm table failed: %s" % e)
        yield tx.rollback()


@gen.coroutine
def get_keepalive(uuid):
    keepalive = 0
    try:
        db = dbpools.get_pool(dbpools.NOVA_DB)
        sql = "select value from instance_metadata where instance_metadata.instance_uuid\
         = %s and instance_metadata.key = %s"
        cur = yield db.execute(sql, (uuid, 'extend'))
        rs = cur.fetchone()
        if rs:
            extend = eval(rs['value'])
            if isinstance(extend, dict):
                if 'keepalive' in extend.keys():
                    keepalive = extend['keepalive']
    except Exception, e:
        LOG.error("get_keepalive failed: %s" % e)
    raise gen.Return(keepalive)


@gen.coroutine
def get_time(target, msg):
    db = dbpools.get_pool(dbpools.LOCAL_DB)
    cur = yield db.execute("select id, create_at, update_at from alarm where target = %s and message = %s", (target, msg))
    rs = cur.fetchone()
    raise gen.Return(rs)

