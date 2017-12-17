# -*- coding: utf-8 -*-

from tornado import gen
from easted.log import log
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get, delete

import easted.alarm as ALARM

__author__ = "Jim Xu"


class Service(RestHandler):
    @gen.coroutine
    @get(_path="/alarms")
    def query_alarm(self, target=None, type=None, level=None, start=None, limit=None):
        start = int(start) if start else 0
        limit = int(limit) if limit else 25
        rs, total = yield ALARM.query(target, type, level, True, start, limit)
        self.response(Response(result=rs, total=total))

    @gen.coroutine
    @get(_path="/alarm/resource_detail")
    def alarm_for_resource_detail(self, target=None, start=None, limit=None):
        start = int(start) if start else 0
        limit = int(limit) if limit else 25
        rs, total = yield ALARM.query(target, None, None, False, start, limit)
        self.response(Response(result=rs, total=total))

    @gen.coroutine
    @delete(_path="/alarm/{id}")
    def clear_alarm(self, id):
        alarm_info = yield ALARM.clear(id)
        log.write(self.request, log.Type.ALARM, id, log.Operator.REMOVE,
                  alarm_info[0]["target"] + ' ' + alarm_info[0]["message"])
        self.response(Response())
