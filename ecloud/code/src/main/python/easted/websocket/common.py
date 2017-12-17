# -*- coding: utf-8 -*-
import logging
import time
import json

from tornado import gen

from easted.utils import jsonutils

LOG = logging.getLogger("system")
__author__ = 'litao@easted.com.cn'

"""
消息推送
缓存格式：
{
    "create_at":"timestamp",
    "body":{
        "total":num,
        "records":object,
        "response":object
    }
}

返回格式：
{
    "response":object,
    "type":basestring
}
"""


@gen.coroutine
def start(cls, cache, interval, fun, **kwargs):
    """
    :param cls :running:运行时毫秒数
                :clients:连接该进程的客户端
    :param cache: 缓存区
    :param interval:循环周期
    :param fun:执行函数
    :param kwargs:函数需要的参数
    :return:
    """
    run_time = cls.running
    clients = cls.clients
    while clients and run_time == cls.running:
        try:
            init_cache(cls)
            create_at = cache.get_by_id("create_at")
            body = cache.get_by_id("body") if cache.get_by_id("body") else {}
            if isinstance(body, basestring):
                body = jsonutils.loads(body)
            if (not create_at or not body) or (
                            int(time.time()) - create_at >= interval):
                cache.set("create_at", int(time.time()))
                body = yield fun(body, **kwargs)
                cache.set("create_at", int(time.time()))
                cache.set("body", jsonutils.dumps(body))
            for client in clients:
                response = body.get("response")
                _type = body.get("type")
                write(client, response, _type)
        except Exception as e:
            LOG.error("socket monitor or push error %s", e)
        yield gen.sleep(interval)


def write(client, response, _type):
    if response:
        target = client.get("target") if isinstance(client, dict) else client

        if _type and _type in ["states", "log", "stat", "alarm", "top"]:
            target.write_message(
                    jsonutils.dumps({"response": response, "type": _type}))
        else:
            oid = client.get("id")
            res = response.get(oid)
            if _type and _type == 'snapshots' and res !="refresh" and res != "quit":
                 res = unicode2str(res)
            if res:
                target.write_message(
                    jsonutils.dumps({"response": res, "type": _type}))


def init_cache(cls):
    if cls.clients and hasattr(cls, "redis_list"):
        for cli in cls.clients:
            for redis in cls.redis_list:
                set_cache(redis, cli)


def set_cache(redis, client_info):
    body = redis.get_by_id("body") or {}
    if isinstance(body, basestring):
        body = json.loads(body)
    records = body.get("records", {})
    if client_info.get("id") and client_info["id"] not in records.keys():
        records[client_info["id"]] = None
        body["records"] = records
        redis.set("body", json.dumps(body))


def remove_from_redis(redis, client):
    body = redis.get_by_id("body") or {}
    if isinstance(body, basestring):
        body = json.loads(body)
    records = body.get("records", {})
    if client["id"] in records.keys():
        records.pop(client["id"])
        body["records"] = records
        redis.set("body", json.dumps(body))


def remove_me(target):
    clients = target.clients
    target_id = None
    for cli in clients[:]:
        if target == cli["target"]:
            target_id = cli["id"]
            target.clients.remove(cli)
        elif cli["id"] == target_id:
            break
    else:
        for redis in target.redis_list:
            remove_from_redis(redis, cli)


def unicode2str(dic):
    """
    默认key 为字符串
    :param dic:
    :return:
    """
    if dic == "refresh" or dic == "quit":
        return dic
    result = {}
    if isinstance(dic, dict):
        for k, v in dic.items():
            if isinstance(v, dict):
                result[str2unicode(k)] = unicode2str(v)
            elif isinstance(v, (tuple, list)):
                result[str2unicode(k)] = [unicode2str(item) for item in v]
            elif isinstance(v, str):
                result[str2unicode(k)] = str2unicode(v)
            else:
                result[str2unicode(k)] = v
    return result


def str2unicode(string):
    if isinstance(string, str):
        return string.decode("unicode_escape")
    return string
