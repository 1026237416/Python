# coding=utf-8
import copy
import json
import logging
import uuid

import MySQLdb as db
from manor.util import cfgutils
from tornado import gen
from tornado.concurrent import run_on_executor

from manor.util import generals


def get_connection():
    user=cfgutils.getval('db','user')
    password=cfgutils.getval('db','password')
    host=cfgutils.getval('db','host')
    con=db.connect(host,user,password,'manor')
    con.set_character_set('utf8')
    return con


def db_con(fn):
    def _d(sql,second_p=None):
        con=None
        try:
            con=get_connection()
            fn(sql,second_p,_con=con)
        except:
            logging.getLogger('manor').error(generals.trace())
        finally:
            if con:
                con.close()

    return _d


@db_con
def execute_query(sql,func=None,_con=None):
    con=_con
    with con:
        cur=con.cursor(db.cursors.DictCursor)
        cur.execute(sql)
        rows=cur.fetchall()
        if func:
            func(rows)
        else:
            for row in rows:
                print row


@db_con
def execute(sql,paras=None,_con=None):
    con=_con
    with con:
        cur=con.cursor()
        cur.execute(sql,paras)


class DBUtil(object):
    _thread_pool=None

    def __init__(self):
        self._thread_pool=generals.get_thread_pool()
        self.result={}
        self.log=logging.getLogger('manor')

    @gen.coroutine
    def query(self,sql):
        self.log.debug('waiting for query sql: '+sql)
        rs=yield self.__query(sql)
        self.log.debug('query result is :'+json.dumps(rs))
        raise gen.Return(rs)

    @run_on_executor(executor='_thread_pool')
    def __query(self,sql):
        callback_id=uuid.uuid1()

        def cb(rs):
            self.log.debug('query result callback_id %s result: %s'%
                           (callback_id,json.dumps(rs)))
            self.result[callback_id]=rs

        execute_query(sql,cb)

        while True:
            if callback_id in self.result:
                break
        result=copy.deepcopy(self.result[callback_id])
        del self.result[callback_id]
        return result
