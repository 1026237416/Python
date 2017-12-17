# -*- coding: utf-8 -*-
import json
import logging

import time
from tornado import gen
from tornado.websocket import WebSocketHandler

from easted.compute import get_server
from easted.snapshot.snapshot import list_snapshot
from common import start, remove_me, unicode2str

import constance as _c
from easted import config
from easted.utils import RedisCache
from easted.volume import get_volume
from easted.log import count_operation_log

__author__ = 'baichenxu@easted.com.cn'

__all__ = [
    "SnapshotHandler"
]

CONF = config.CONF
_SNAPSHOT_CACHE = RedisCache("%s_snapshot_details" % CONF.keystone.region_name)
_SNAPSHOT_LOG = RedisCache("%s_snapshot_log" % CONF.keystone.region_name)
LOG = logging.getLogger("system")


class SnapshotHandler(WebSocketHandler):
    clients = list()
    running = None
    redis_list = (_SNAPSHOT_CACHE, _SNAPSHOT_LOG)

    @staticmethod
    @gen.coroutine
    def run_snapshots(body):
        try:
            records = body.get("records", {})
            total = body.get("total", {})
            result = {}
            totals = {}

            for resource_id in records.keys():
                snapshots = yield SnapshotHandler._resource_snapshots(resource_id)
                result[resource_id] = snapshots
                totals[resource_id] = len(snapshots.get("snapshots"))

            response = {}
            for k, v in result.items():
                response[k] = "quit" if v.get("status") == "quit" else v
                if unicode2str(v) == unicode2str(records.get(k)):
                    response.pop(k)

            for k, v in totals.items():
                if v != total.get(k) and response.get(k) != "quit":
                    response[k] = "refresh"

            body = {
                "total": totals,
                "records": result,
                "response": response,
                "type": "snapshots"
            }
        except Exception, e:
            LOG.error("host detail vms handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def _resource_snapshots(name):
        if name.startswith("vm-"):
            vm = yield get_server(name=name)
            status = vm.get("state", "quit")
            r_status = vm.get("recover-status")
            id = vm.get('id')

        elif name.startswith("vd-"):
            source = yield get_volume(name=name)
            status = source.get("status", "quit")
            r_status = source.get("recover-status")
            id = source.get('id')
        out_snapshots = yield list_snapshot(name)
        result = {
            "snapshots": out_snapshots,
            "status": status,
            "id": id,
            "recover-status": SnapshotHandler.enum_recover_status(status, r_status)
        }
        raise gen.Return(result)

    @staticmethod
    def enum_recover_status(status, r_status):
        if r_status:
            return "error"

        if status == "snapshoting":

            return "snapshoting"

        elif status == "recovering":
            return "recovering"

        elif status == "deleting":
            return "deleting"
        else:
            return "available"

    @staticmethod
    @gen.coroutine
    def run_snapshot_log(body):
        try:
            total = body.get("records", {})
            total_now = {}
            response = {}
            for name in total.keys():
                log_total = count_operation_log(region=CONF.keystone.region_name, obj=name)
                total_now[name] = log_total
                response[name] = ""
                if total.get(name) and total.get(name) != log_total:
                    response[name] = "refresh"

            body = {
                "total": {},
                "records": total_now,
                "response": response,
                "type": "snapshot_log"
            }
        except Exception, e:
            LOG.error("snapshot log handler push message error is %s", e)
        raise gen.Return(body)

    def data_received(self, chunk):
        pass

    @gen.coroutine
    def open(self):
        self.stream.set_nodelay(True)

    @gen.coroutine
    def on_message(self, message):
        message = json.loads(message)
        client_info = {
            "target": self,
            "id": message["id"]
        }
        self.clients.append(client_info)

        if not self.running:
            SnapshotHandler.running = time.time()
            start(SnapshotHandler, _SNAPSHOT_CACHE, _c.STATE_INTERVAL_TIME,
                  SnapshotHandler.run_snapshots)
            start(SnapshotHandler, _SNAPSHOT_LOG, _c.SNAPSHOT_LOG_INTERVAL_TIME,
                  SnapshotHandler.run_snapshot_log)

    def on_close(self):
        remove_me(self)
        if not self.clients:
            SnapshotHandler.running = None
