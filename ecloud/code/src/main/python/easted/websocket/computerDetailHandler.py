# -*- coding: utf-8 -*-
import logging

import time

from oslo_serialization import jsonutils
from tornado import websocket, gen
import constance as _c
from easted import config
from easted.alarm.alarm import get_count_alarm
from easted.log import count_operation_log

from easted.compute import server_list
from easted.meter import SampleQuery, gen_host_chart_rst
from easted.utils import jsonutils as json
from easted.utils.cacheUtils import RedisCache
from easted.compute import get_server
from common import start, remove_me

__author__ = 'litao@easted.com.cn'
CONF = config.CONF
LOG = logging.getLogger("system")

_VM_DETAIL_PIE = RedisCache("%s_vm_detail_pie" % CONF.keystone.region_name)
_VM_DETAIL_CHART = RedisCache("%s_vm_detail_chart" % CONF.keystone.region_name)
_VM_DETAIL_STATE = RedisCache("%s_vm_detail_state" % CONF.keystone.region_name)
_VM_DETAIL_ALARM = RedisCache("%s_vm_detail_alarm" % CONF.keystone.region_name)
_VM_DETAIL_LOG = RedisCache("%s_vm_detail_log" % CONF.keystone.region_name)

_VM_METER = (
    "cpu_util",
    'memory_util'
)

__all__ = [
    "ComputeDetailsHandler"
]


class ComputeDetailsHandler(websocket.WebSocketHandler):
    clients = list()
    redis_list = (_VM_DETAIL_PIE, _VM_DETAIL_STATE, _VM_DETAIL_ALARM, _VM_DETAIL_LOG)
    running = None

    @staticmethod
    @gen.coroutine
    def handle():
        start(ComputeDetailsHandler, _VM_DETAIL_LOG, _c.VM_DETAIL_LOG_INTERVAL_TIME,
              ComputeDetailsHandler.get_computer_detail_log)

        start(ComputeDetailsHandler, _VM_DETAIL_ALARM, _c.VM_DETAIL_ALARM_INTERVAL_TIME,
              ComputeDetailsHandler.get_alarm)

        start(ComputeDetailsHandler, _VM_DETAIL_STATE, _c.STATE_INTERVAL_TIME,
              ComputeDetailsHandler.run_vm_state)

        start(ComputeDetailsHandler, _VM_DETAIL_PIE, _c.VM_DETAIL_PIE_INTERVAL_TIME,
              ComputeDetailsHandler.run_vm_pie)

        ComputeDetailsHandler.run(ComputeDetailsHandler)

    @staticmethod
    @gen.coroutine
    def get_computer_detail_log(body):
        try:
            total = body.get("records", {})
            total_now = {}
            response = {}
            for vm_id in total.keys():
                vm = yield server_list(server_ids=vm_id)
                if vm:
                    try:
                        log_total = count_operation_log(region=CONF.keystone.region_name, obj=vm[0].get("name"))
                    except BaseException as e:
                        LOG.error("compute detail log error in iterable need ignore%s", e)
                        continue
                    total_now[vm_id] = log_total
                    response[vm_id] = ""
                    if total.get(vm_id) and total.get(vm_id) != log_total:
                        response[vm_id] = "refresh"
                else:
                    response[vm_id] = "quit"

            body = {
                "total": {},
                "records": total_now,
                "response": response,
                "type": "vm_log"
            }
        except Exception, e:
            LOG.error("compute detail log handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def get_alarm(body):
        try:
            records = body.get("records", {})
            result = {}
            response = {}
            for vm_id in records.keys():
                vm = yield server_list(server_ids=vm_id)
                if vm:
                    try:
                        vm_alarm_count = yield get_count_alarm(target=vm[0].get("name"))
                    except BaseException as e:
                        LOG.error("compute alarm  error  in iterable need ignore %s", e)
                        continue
                    result[vm_id] = vm_alarm_count.get("count")
                    response[vm_id] = ""
                    if records.get(vm_id) and records.get(vm_id) != vm_alarm_count.get("count"):
                        response[vm_id] = "refresh"
                else:
                    response[vm_id] = "quit"

            body = {
                "total": 0,
                "records": result,
                "response": response,
                "type": "vm_alarm"
            }
        except Exception, e:
            LOG.error("detail alarm handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def run_vm_state(body):
        try:
            records = body.get("records", {})
            result = {}

            for vm_id in records.keys():
                try:
                    compute = yield get_server(vm_id=vm_id)
                except Exception as e:
                    LOG.error("compute run_vm_state get_server %s error is %s",
                              vm_id, e)
                    compute = {}
                state = compute.get("state") if compute else "quit"
                result[vm_id] = state

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
            LOG.error("vm detail state handler push message error is %s", e)
        raise gen.Return(body)

    @staticmethod
    @gen.coroutine
    def _vm_meter(meter_name, vm_id, limit):
        compute = yield get_server(vm_id=vm_id)
        rst_data = {}
        if compute and compute.get("state") == "active":
            data = yield SampleQuery().meters_query(meter_name, **{'vm': vm_id, 'limit': limit})
            res = gen_host_chart_rst(meter_name, data)
            rst_data = {
                "type": meter_name,
                "records": res[0] if limit == 1 and res else res,
                "limit": str(limit)
            }
        raise gen.Return(rst_data)

    @staticmethod
    @gen.coroutine
    def run(cls):
        run_time = cls.running
        while ComputeDetailsHandler.clients and run_time == cls.running:
            try:
                catch = {}
                for cli in ComputeDetailsHandler.clients:
                    chart = cli["chart"]
                    vm_id = cli["id"]
                    target = cli.get("target")
                    meter = chart.get("counter_name")
                    limit = chart.get("limit")
                    key = vm_id + meter
                    if key in catch:
                        rst_data = catch.get(key)
                    else:
                        rst_data = yield ComputeDetailsHandler._vm_meter(meter, vm_id, limit)
                        catch[key] = rst_data
                    target.write_message(
                                jsonutils.dumps({"response": rst_data, "type": "chart"}))
            except Exception as e:
                LOG.error("computer chart run error  %s", e)
            yield gen.sleep(_c.VM_DETAIL_CHART_INTERVAL_TIME)

    @staticmethod
    @gen.coroutine
    def run_vm_pie(body):
        try:
            records = body.get("records") if body.get("records") else {}
            result = {}

            for key in records.keys():
                res = []
                for meter_name in _VM_METER:
                    limit = 1
                    rst_data = yield ComputeDetailsHandler._vm_meter(meter_name, key, limit)
                    if not rst_data:
                        break
                    res.append(rst_data)
                if res:
                    result[key] = res

            body = {
                "total": 0,
                "records": result,
                "response": result,
                "type": "pie"
            }
        except Exception as e:
            LOG.error("vm detail pie handler push message error is %s", e)
        raise gen.Return(body)

    def data_received(self, chunk):
        pass

    @gen.coroutine
    def open(self):
        self.stream.set_nodelay(True)

    @gen.coroutine
    def on_message(self, message):
        """
        :param message:
        :return:
        """
        try:
            LOG.debug("the client %s connected with compute socket", self.request.remote_ip)
            message = json.loads(message)
            vm_id = message["id"]
            chart = message.get("chart", None)
            client_info = {
                "target": self,
                "chart": chart,
                "id": vm_id
            }
            for ci in self.clients:
                if ci["target"] is self:
                    ci["chart"] = chart
                    break
            else:
                self.clients.append(client_info)

            rst_data = yield self._vm_meter(chart.get("counter_name"), vm_id,
                                            chart.get("limit"))
            if rst_data:
                self.write_message(json.dumps({"response": rst_data, "type": "chart"}))

            if not ComputeDetailsHandler.running:
                ComputeDetailsHandler.running = time.time()
                yield ComputeDetailsHandler.handle()
        except BaseException, e:
            LOG.error("compute detail on message %s", e)

    def on_close(self):
        LOG.debug("the client %s connect with compute socket closed", self.request.remote_ip)
        remove_me(self)
        if not self.clients:
            ComputeDetailsHandler.running = None
