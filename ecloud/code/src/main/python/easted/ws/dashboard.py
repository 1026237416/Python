# -*- coding: utf-8 -*-
import logging
from tornado import gen
from easted.core.rest import RestHandler, get, Response


from easted.dashboard import get_stat_data
# __author__ = 'yangkefeng@easted.com.cn'
LOG = logging.getLogger('system')


# "get:statistic": "rule:all_roles",
class Service(RestHandler):

    @gen.coroutine
    @get(_path="/statistic")
    def get_stat_data(self):
        """ get statistic system data
        """
        out_stats = yield get_stat_data()
        self.response(Response(result=out_stats))
