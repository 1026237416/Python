# -*- coding: utf-8 -*-
import logging
from easted.utils import jsonutils

from easted.core.consumer import BaseAdapter
__author__ = 'litao@easted.com.cn'

_EVENT_TYPE = "event_type"
_TIMESTAMP = "timestamp"
_EVENT_BODY = "payload"
_MSG_BODY = "oslo.message"

LOG = logging.getLogger("system")

class Adapter(BaseAdapter):

    def execute(self):
        try:
            if isinstance(self._message, str):
                body = jsonutils.loads(self._message)
            oslo_msg = body[_MSG_BODY]
            oslo_msg = jsonutils.loads(oslo_msg)
            self._event = oslo_msg[_EVENT_TYPE]
            self._body = oslo_msg[_EVENT_BODY]
        except Exception,e:
            LOG.error(e)
            LOG.error("error messge is %s" % self._message)