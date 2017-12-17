# -*- coding: utf-8 -*-
import logging
import uuid

from easted.utils import jsonutils as simplejson, trace
from tornado import gen
from easted.core import dbpools
from easted import config

VM_CREATE_TYPE = 0
TASK__SUCCESS = 1
TASK__FAIL = 2

LOG = logging.getLogger("system")

config.register("compute.boot_interval", default="120", setting_type=config.TYPE_INT)
CONF = config.CONF


def gen_task_id():
    return str(uuid.uuid1())


@gen.coroutine
def get_task_flow_count(name, resource):
    db = dbpools.get_local()
    sql = "select count(*) as count from taskflow  where 1=1"
    if name:
        sql = sql + " and  name = '" + name + "'"
    if resource:
        sql = sql + " and  resource = '" + resource + "'"
    cur = yield db.execute(sql)
    task_count = cur.fetchone()
    result = task_count.get("count")
    raise gen.Return(result)


@gen.coroutine
def insert_task_flow(task_id, name, resource, message='', **params):
    task_count = yield get_task_flow_count(name, resource)
    if not task_count:
        db = dbpools.get_local()
        sql = "insert into taskflow (task_id, `name`,resource, updated_at, message, param) " \
              "values (%s, %s, %s, now(), %s, %s)"
        yield dbpools.execute_commit(db, sql, [task_id, name, resource, simplejson.dumps(message), simplejson.dumps(params)])


@gen.coroutine
def get_task_flow(task_id=None, name=None, resource=None, **params):
    result = []
    db = dbpools.get_local()
    sql = "select * from taskflow  where 1=1"
    if task_id:
        sql = sql + " and  task_id = '" + task_id + "'"
    if name:
        sql = sql + " and  name = '" + name + "'"
    if resource:
        sql = sql + " and  resource = '" + resource + "'"
    cur = yield db.execute(sql)
    tasks = cur.fetchall()
    if tasks:
        for task in tasks:
            resp = {
                "id": task.get("id"),
                "task_id": task.get("task_id"),
                "status": task.get("status"),
                "name": task.get("name"),
                "resource": task.get("resource"),
                "updated_at": task.get("updated_at")
            }
            pro = simplejson.loads(task.get("param"))
            mes = simplejson.loads(task.get("message"))
            res = resp.copy()
            res.update(pro)
            res.update(mes)
            flag = True
            for k, v in params.items():
                if k not in res or v != res.get(k):
                    flag = False
            if flag:
                result.append(res)
    raise gen.Return(result)


@gen.coroutine
def update_task_flow(id, **update_params):
    db = dbpools.get_local()
    sql = "update taskflow set %s where id = %%s" % \
          ', '.join(["%s = '%s'" % (k, v) for k, v in update_params.items()])
    yield dbpools.execute_commit(db, sql, [id])


@gen.coroutine
def update_task_flow_status(id, status):
    db = dbpools.get_local()
    sql = "update taskflow set status = %s, updated_at= now() where status != %s  and id = %s"
    row = yield dbpools.update(db, sql, [status, status, id])
    raise gen.Return(row)



@gen.coroutine
def delete_task_flow(id):
    db = dbpools.get_local()
    sql = "delete from taskflow where id = %s"
    yield dbpools.execute_commit(db, sql, [id])


@gen.coroutine
def delete_task_flow_by_resource(resource):
    db = dbpools.get_local()
    sql = "delete from taskflow where resource = %s"
    yield dbpools.execute_commit(db, sql, [resource])



@gen.coroutine
def get_expire_task(interval):
    db = dbpools.get_local()
    sql = "select * from taskflow where  status = 0  and  TIMESTAMPDIFF(SECOND,updated_at,NOW()) > %s"
    try:
        cur = yield db.execute(sql, (interval,))
        result = cur.fetchall()
    except Exception,e:
        print e
    raise gen.Return(result)


@gen.coroutine
def main():
    # t = yield insert_task_flow("1", "clone volume", resource="vm001")
    # t = yield get_task_flow(type=0,user,tenant,host)
    t = yield update_task_flow_status(id="2", status=1)
    print t


if __name__ == '__main__':
    from tornado import ioloop

    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
