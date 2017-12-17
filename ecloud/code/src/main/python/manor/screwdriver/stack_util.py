# coding=utf-8
import logging

from manor.util.db_utils import execute
from manor.util import generals
from tornado import gen

from vendor_ecloud import create_stack
# 有特殊的含义,请勿删除
from vendor_ecloud import delete_stack
from vendor_ecloud import list_stack_resources,get_stack


def log_manor():
    return logging.getLogger('manor')


@gen.coroutine
def create_action(tmp,serial):
    try:
        log_manor().debug(tmp)
        group_name=tmp['group_name']
        stack_id=yield create_stack(tmp['resources'][group_name],serial,group_name)
        execute(("INSERT INTO manor.manor_stacks (stack_id,app_serial,group_name)"
                 " VALUES (%s,%s,%s)"),(stack_id,serial,group_name))
    except Exception as e:
        log_manor().error(generals.trace())
        raise e

    raise gen.Return(stack_id)
