# -*- coding: utf-8 -*-
import logging

from tornado import gen

from easted import config
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get
from easted.core.rest import post
from easted.log import log

__author__ = 'gaoshan@easted.com.cn'

LOG = logging.getLogger('system')


class Service(RestHandler):
    @gen.coroutine
    @get(_path="/settings")
    def list(self):
        rs = config.list_settings()
        self.response(Response(result=rs, total=len(rs)))

    @gen.coroutine
    @post(_path="/setting", _required=['name', 'value'])
    def edit(self, body):
        config.update(body['name'], body['value'])
        log.write(self.request, log.Type.GLOBAL_SETTINGS, body['name'], log.Operator.UPDATE, '')
        self.response(Response())
