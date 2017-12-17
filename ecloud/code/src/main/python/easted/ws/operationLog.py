# -*- coding: utf-8 -*-
__author__ = 'Jim Xu'

import datetime

from tornado import gen

import easted.log as opLog
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get
from easted.utils.datetimeUtils import date2str


class Service(RestHandler):
    """
    query operation log
    """

    @gen.coroutine
    @get(_path="/log")
    def query_operation_log(self,
                            start_time=None,
                            end_time=None,
                            user=None,
                            role=None,
                            type=None,
                            operation=None,
                            object=None,
                            region=None,
                            fuzzy=True,
                            start=None,
                            limit=None):
        """
        query operation log by time, user, role, type and opration
        """
        if fuzzy and (fuzzy == str(True) or fuzzy == "true"):
            fuzzy = True
        else:
            fuzzy = False
        if start_time:
            dt = datetime.datetime.fromtimestamp(int(start_time))
            start_time = date2str(dt)

        if end_time:
            dt = datetime.datetime.fromtimestamp(int(end_time))
            end_time = date2str(dt)

        start = int(start) if start else 0
        limit = int(limit) if limit else 25
        if limit < 0:
            self.response(Response(result=[], total=0))

        result = yield opLog.query_operation_log(
                start_time=start_time, end_time=end_time,
                user=user, role=role, typ=type,
                operation=operation, obj=object, region=region, fuzzy=fuzzy, start=start, limit=limit)

        self.response(Response(result=result.get("records"), total=result.get("total")))
