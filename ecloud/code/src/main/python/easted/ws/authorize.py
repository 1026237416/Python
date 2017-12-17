# -*- coding: utf-8 -*-
from easted.core import authen

import logging
from tornado import gen
from easted.core.rest import RestHandler
from easted.core.rest import Response
from easted.core.rest import delete
from easted.core.rest import post
from easted.identify import authorize

__author__ = 'litao@easted.com.cn'

LOG = logging.getLogger('system')


class Service(RestHandler):
    @gen.coroutine
    @post(_path="/login", _required=['name', 'password'])
    def login(self, body):
        token = yield authorize.login(body['name'], body['password'])
        self.response(Response(result=token))

    @gen.coroutine
    @delete(_path="/logout")
    def logout(self):
        try:
            token = authen.get_token(self.request)
            yield authorize.logout(token)
            self.response(Response(success=True, msg='logout success.'))
        except Exception, e:
            LOG.error(e.message)
            self.response(Response(success=False, msg='logout failed.'))
