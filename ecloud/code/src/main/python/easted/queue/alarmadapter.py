# -*- coding: utf-8 -*-

from tornado import gen
from easted.utils import jsonutils
from easted.core.consumer import BaseAdapter
from easted.alarm import snmp_message

__author__ = 'litao@easted.com.cn'


class Adapter(BaseAdapter):
    @gen.coroutine
    def execute(self):
        body = jsonutils.loads(self._message)
        if "oslo.message" in body:
            message = jsonutils.loads(body.get("oslo.message"))
            self._event = message.get("method")
            self._body = message['args']['instance']['nova_object.data']
        if "specific_trap" in body and "var_binds" in body:
            yield snmp_message(body)
