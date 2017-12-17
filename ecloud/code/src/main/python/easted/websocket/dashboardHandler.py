# -*- coding: utf-8 -*-
import logging

import time
from tornado import websocket, gen
from easted import config
from easted.alarm import summary as alarm_summary
from easted.dashboard import get_stat_data
from easted.log import query_operation_log, count_operation_log
from easted.meter.metering import SampleQuery
from easted.utils import datetimeUtils
from easted.utils import jsonutils as json
from easted.utils.cacheUtils import RedisCache
from common import start, write
import constance as _c

__author__ = 'litao@easted.com.cn'
LOG = logging.getLogger("system")
CONF = config.CONF

_DASHBOARD_STAT_CACHE = RedisCache("%s_dashboard_stat" % CONF.keystone.region_name)
_DASHBOARD_TOPN_CACHE = RedisCache("%s_dashboard_topn" % CONF.keystone.region_name)
_DASHBOARD_ALARM_CACHE = RedisCache("%s_dashboard_alarm" % CONF.keystone.region_name)

__all__ = [
    "DashBoardHandler"
]


class DashBoardHandler(websocket.WebSocketHandler):
    clients = set()
    running = None
    log_total = None

    @staticmethod
    @gen.coroutine
    def handle():
        DashBoardHandler.get_log()
        start(DashBoardHandler,  _DASHBOARD_STAT_CACHE, _c.DASHBOARD_STAT_INTERVAL_TIME,
              DashBoardHandler.get_stat)
        start(DashBoardHandler,  _DASHBOARD_ALARM_CACHE, _c.DASHBOARD_ALARM_INTERVAL_TIME,
              DashBoardHandler.get_alarm)
        start(DashBoardHandler,  _DASHBOARD_TOPN_CACHE, _c.DASHBOARD_TOP_INTERVAL_TIME,
              DashBoardHandler.get_top)

    @staticmethod
    @gen.coroutine
    def get_stat(body):
        try:
            records = body.get("records") if body.get("records") else {}
            result = yield get_stat_data()
            response = {}
            for k, v in result.items():
                response[k] = v
                if not records or (k in records.keys() and v == records.get(k)):
                    response.pop(k)
            body = {
                "total": 0,
                "records": result,
                "response": response,
                "type": "stat"
            }
        except Exception, e:
            LOG.error("dashboard stat handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def get_top(body):
        try:
            result = yield SampleQuery().meters_topn_of_util()
            body = {
                "total": 0,
                "records": {},
                "response": result,
                "type": "top"
            }
        except Exception, e:
            LOG.error("dashboard top handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def get_alarm(body):
        try:
            records = body.get("records") if body.get("records") else {}
            result = yield alarm_summary()
            response = {}
            for k, v in result.items():
                response[k] = v
                if not records or (k in records.keys() and v == records.get(k)):
                    response.pop(k)
            body = {
                "total": 0,
                "records": result,
                "response": response,
                "type": "alarm"
            }
        except Exception, e:
            LOG.error("dashboard alarm handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def get_log():
        while DashBoardHandler.clients:
            day = datetimeUtils.get_now_date(datetimeUtils.YEAR_MONTH_DAY)
            total = count_operation_log(region=CONF.keystone.region_name, start_time=day + " 00:00:00")
            LOG.debug("current  log total is %s  list total is %s ", DashBoardHandler.log_total,total)
            if DashBoardHandler.log_total != total:
                DashBoardHandler.log_total = total
                data = yield query_operation_log(region=CONF.keystone.region_name,
                                                 start_time=day + " 00:00:00",
                                                 limit=16)
                for c_item in DashBoardHandler.clients:
                    c_item.write_message(json.dumps({"response": data, "type": "log"}))
            yield gen.sleep(_c.DASHBOARD_LOG_INTERVAL_TIME)

    def data_received(self, chunk):
        pass

    @gen.coroutine
    def open(self):
        LOG.debug("the client %s connected with compute socket", self.request.remote_ip)
        if self not in DashBoardHandler.clients:
            DashBoardHandler.clients.add(self)
        self.stream.set_nodelay(True)
        try:
            alarm_data = yield DashBoardHandler.get_alarm({})
            write(self, alarm_data.get("records"), "alarm")

            stat_data = yield DashBoardHandler.get_stat({})
            write(self, stat_data.get("records"), "stat")

            top_data = yield DashBoardHandler.get_top({})
            write(self, top_data.get("response"), "top")

            day = datetimeUtils.get_now_date(datetimeUtils.YEAR_MONTH_DAY)
            log_data = yield query_operation_log(region=CONF.keystone.region_name,
                                                 start_time=day + " 00:00:00",
                                                 limit=15)
            write(self, log_data, "log")
        except Exception, e:
            LOG.error("open socket push message error %s", e)
        if not DashBoardHandler.running:
            DashBoardHandler.running = time.time()
            yield DashBoardHandler.handle()

    def on_message(self, message):
        pass

    def on_close(self):
        LOG.debug("the client %s connect with compute socket closed", self.request.remote_ip)
        DashBoardHandler.clients.remove(self)
        if not DashBoardHandler.clients:
            DashBoardHandler.running = None
