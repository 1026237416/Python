# -*- coding: utf-8 -*-
from easted.utils import jsonutils

from easted.core.consumer import BaseAdapter
__author__ = 'litao@easted.com.cn'

class Adapter(BaseAdapter):
    
    def execute(self):
        message = jsonutils.loads(self._message)
        self._event = message.get("event")
        self._body = message.get("body")