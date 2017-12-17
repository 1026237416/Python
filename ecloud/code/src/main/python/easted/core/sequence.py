# -*- coding: utf-8 -*-

import datetime
import logging

from tornado import gen

from easted.core import dbpools
from easted.core.exception import ECloudException
from easted.utils import trace

__author__ = 'gaoshan@easted.com.cn'

TYPE_NUMBER_SEQ = 0
TYPE_DATE_SEQ = 1

LOG = logging.getLogger('system')


@gen.coroutine
def number_seq(name, prefix):
    seq = yield __retrieve_seq(name, TYPE_NUMBER_SEQ)
    raise gen.Return(prefix + str(seq))


@gen.coroutine
def date_seq(name, prefix):
    db = dbpools.get_pool(dbpools.COMMON_DB)
    cur = yield db.execute("select * from sequence where name = %s", (name,))
    rs = cur.fetchone()
    if not rs:
        raise SequenceNotFound()
    dt = rs['dt_updated'].date()
    if datetime.datetime.utcnow().toordinal() > rs['dt_updated'].date().toordinal():
        tx = None
        try:
            tx = yield db.begin()
            yield tx.execute(
                "update sequence set sn=0, dt_updated=now() where name=%s",
                (name,)
            )
            yield tx.commit()
            dt = datetime.datetime.utcnow().date()
        except Exception, e:
            yield tx.rollback()
            raise e
    seq = yield __retrieve_seq(name, TYPE_DATE_SEQ)
    raise gen.Return(prefix + dt.strftime('%y%m%d') + str(seq).zfill(len(str(rs['max_sn']))))


@gen.coroutine
def register(name, seq_type=TYPE_NUMBER_SEQ, seq_max=18446744073709551615L, step=1):
    db = dbpools.get_pool(dbpools.COMMON_DB)

    cur = yield db.execute("select * from sequence where name = %s", (name,))
    if cur.fetchone():
        LOG.debug("sequence '%s' already exists." % name)
        raise gen.Return()
    tx = None
    try:
        tx = yield db.begin()
        yield tx.execute(
            "insert into sequence (name, type, max_sn, step, dt_updated) values (%s, %s, %s, %s, now())",
            (name, seq_type, seq_max, step)
        )
        yield tx.commit()
    except Exception:
        yield tx.rollback()


@gen.coroutine
def __retrieve_seq(name, seq_type):
    db = dbpools.get_pool(dbpools.COMMON_DB)
    tx = None
    try:
        tx = yield db.begin()
        yield tx.execute(
            "update sequence set sn=sn+step, dt_updated=now() where name=%s and sn <= max_sn and type=%s",
            (name, seq_type)
        )
        cur = yield tx.execute(
            "select * from sequence where name=%s and sn <= max_sn and type = %s",
            (name, seq_type)
        )
        rs = cur.fetchone()
        # cur.close()
        if not rs:
            raise SequenceNotFound()
        yield tx.commit()
    except Exception, e:
        yield tx.rollback()
        LOG.error(trace())
        raise e
    else:
        raise gen.Return(rs['sn'])


class SequenceNotFound(ECloudException):
    msg = 'generate sequence failed.'
