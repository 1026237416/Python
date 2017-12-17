# -*- coding: utf-8 -*-
import logging

import time

from tornado import websocket, gen
from easted import config
from easted.alarm import get_count_alarm
from easted.compute import list_server
from easted.host import list_simple_hosts
from easted.log import count_operation_log
from oslo_serialization import jsonutils
from easted.meter import SampleQuery, gen_host_chart_rst
from easted.utils import jsonutils as json
from easted.utils.cacheUtils import RedisCache
import constance as _c
from common import start, remove_me

__author__ = 'litao@easted.com.cn'
CONF = config.CONF

LOG = logging.getLogger("system")

_HOST_DETAIL_VMS = RedisCache("%s_host_detail_vms" % CONF.keystone.region_name)
_HOST_DETAIL_STATE = RedisCache("%s_host_detail_state" % CONF.keystone.region_name)
_HOST_DETAIL_ALARM = RedisCache("%s_host_detail_alarm" % CONF.keystone.region_name)
_HOST_DETAIL_LOG = RedisCache("%s_host_detail_log" % CONF.keystone.region_name)

VM_METER = (
    "cpu_util",
    'memory_util'
)

__all__ = [
    "HostDetailHandler"
]


class HostDetailHandler(websocket.WebSocketHandler):
    clients = list()
    redis_list = (_HOST_DETAIL_ALARM, _HOST_DETAIL_VMS, _HOST_DETAIL_STATE)
    running = None

    @staticmethod
    @gen.coroutine
    def handle():
        start(HostDetailHandler, _HOST_DETAIL_ALARM,
              _c.HOST_DETAIL_ALARM_INTERVAL_TIME, HostDetailHandler.get_alarm)
        start(HostDetailHandler, _HOST_DETAIL_VMS,
              _c.HOST_DETAIL_VMS_INTERVAL_TIME, HostDetailHandler.run_host_vms)
        start(HostDetailHandler, _HOST_DETAIL_STATE,
              _c.STATE_INTERVAL_TIME, HostDetailHandler.run_host_state)
        HostDetailHandler.run(HostDetailHandler)

    @staticmethod
    @gen.coroutine
    def get_alarm(body):
        try:
            records = body.get("records") if body.get("records") else {}
            result = {}
            response = {}
            for host_id in records.keys():
                host_name = yield list_simple_hosts(host_id=host_id)
                if host_name:
                    try:
                        host_alarm_count = yield get_count_alarm(target=host_name[0].get("name"))
                    except BaseException:
                        continue
                    result[host_id] = host_alarm_count.get("count")

                    response[host_id] = ""
                    if records.get(host_id) and records.get(host_id) != host_alarm_count.get("count"):
                        response[host_id] = "refresh"
                else:
                    response[host_id] = "quit"

            body = {
                "total": 0,
                "records": result,
                "response": response,
                "type": "host_alarm"
            }
        except Exception, e:
            LOG.error("detail alarm handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def get_host_log(body):
        try:
            records = body.get("records", {})
            response = {}
            for host_id in records.keys():
                host_name = yield list_simple_hosts(host_id)
                if host_name:
                    log_total = count_operation_log(region=CONF.keystone.region_name, obj=host_name.get("name"))
                    response[host_id] = ""
                    if records.get(host_id) and records.get(host_id) != log_total:
                        response[host_id] = "refresh"
                    records[host_id] = log_total
                else:
                    response[host_id] = "quit"

            body = {
                "total": {},
                "records": records,
                "response": response,
                "type": "host_log"
            }

        except Exception, e:
            LOG.error("compute detail log handler push message error is %s", e)
            raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def run(cls):
        run_time = cls.running
        while cls.clients and run_time == cls.running:
            try:
                catch = {}
                for cli in cls.clients:
                    chart = cli["chart"]
                    host_id = cli["id"]
                    target = cli.get("target")
                    meter = chart.get("counter_name")
                    limit = chart.get("limit")
                    key = str(host_id) + meter
                    if key in catch:
                        rst_data = catch.get(key)
                    else:
                        rst_data = yield HostDetailHandler._host_meter(meter, host_id, int(limit))
                        catch[key] = rst_data
                    if rst_data:
                        target.write_message(
                            jsonutils.dumps({"response": rst_data, "type": "chart"}))
            except Exception as e:
                LOG.error("hosts chart run error  %s", e)
            yield gen.sleep(_c.HOST_DETAIL_CHART_INTERVAL_TIME)

    @staticmethod
    @gen.coroutine
    def run_host_state(body):
        try:
            records = body.get("records", {})
            result = {}

            for host_id in records.keys():
                try:
                    host = yield list_simple_hosts(host_id)
                except BaseException:
                    continue
                state = host[0].get("state") if host else "quit"
                result[host_id] = state

            response = {}
            for k, v in result.items():
                response[k] = v
                if not records or (k in records and v == records.get(k)):
                    response.pop(k)

            body = {
                "total": 0,
                "records": result,
                "response": response,
                "type": "state"
            }
        except Exception, e:
            LOG.error("host detail state handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def run_host_vms(body):
        try:
            records = body.get("records", {})
            totals = body.get("total", {})
            result = {}
            for host_id in records.keys():
                try:
                    vms = yield HostDetailHandler._host_vms(host_id)
                except BaseException:
                    continue
                if totals and totals.get(host_id) != len(vms.keys()):
                    LOG.debug("current redis total is %s  list total is %s ", totals.get(host_id), len(vms.keys()))
                    result[host_id] = "refresh"
                else:
                    result[host_id] = vms
                totals[host_id] = len(vms.keys())

            body = {
                "total": totals,
                "records": result,
                "response": result,
                "type": "vms"
            }
        except Exception, e:
            LOG.error("host detail vms handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def _host_vms(host_id):
        host_info = yield list_simple_hosts(host_id=host_id)
        result = {}
        if host_info:
            host_name = host_info[0]["name"]
            vms_info = yield list_server(hosts=host_name, detailed=False, with_task=False)
            if vms_info:
                vms = [{"name": itm["name"], "id": itm["id"], "state": itm["state"]} for itm in vms_info]
                for vm_item in vms:
                    vm_id = vm_item["id"]
                    res = {
                        "state": vm_item["state"]
                    }
                    if "active" == vm_item["state"]:
                        for meter_name in VM_METER:
                            limit = 1
                            data = yield SampleQuery().meters_query(meter_name, **{'vm': vm_id, 'limit': limit})
                            res_data = gen_host_chart_rst(meter_name, data)
                            res[meter_name] = res_data[0] if res_data else {}
                    result[vm_item["name"]] = res
        raise gen.Return(result)

    @staticmethod
    @gen.coroutine
    def _host_meter(counter_name, host_id, limit):
        host_info = yield list_simple_hosts(host_id=host_id)
        if host_info:
            data = yield SampleQuery().meters_query(counter_name, **{'host': host_info[0]["ip"], "limit": limit})
            res = gen_host_chart_rst(counter_name, data)
            rst_data = {
                "type": counter_name,
                "records": res,
                "limit": limit
            }
            raise gen.Return(rst_data)

    def data_received(self, chunk):
        pass

    @gen.coroutine
    def open(self):
        self.stream.set_nodelay(True)

    @gen.coroutine
    def on_message(self, message):
        LOG.debug("the client %s connected with compute socket", self.request.remote_ip)
        message = json.loads(message)
        try:
            host_id = message["id"]
            chart = message.get("chart", None)
            client_info = {
                "target": self,
                "chart": chart,
                "id": str(host_id)
            }
            for ci in self.clients:
                if ci.get("target") is self:
                    ci["chart"] = chart
                    break
            else:
                self.clients.append(client_info)

            rst_data = yield self._host_meter(chart.get("counter_name"), host_id,
                                            chart.get("limit"))
            if rst_data:
                self.write_message(json.dumps({"response": rst_data, "type": "chart"}))
            if not self.running:
                HostDetailHandler.running = time.time()
                yield HostDetailHandler.handle()
        except Exception, e:
            LOG.error("host detail get message error is %s", e)

    def on_close(self):
        LOG.debug("the client %s connect with compute socket closed", self.request.remote_ip)
        remove_me(self)
        if not self.clients:
            HostDetailHandler.running = None


