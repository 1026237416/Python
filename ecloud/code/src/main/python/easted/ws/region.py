from tornado import gen
from easted.core.rest import RestHandler
from easted.core.rest import Response
from easted.core.rest import get
from easted.core import region as rg

__author__ = 'litao@easted.com.cn'
class Service(RestHandler):
    @gen.coroutine
    @get(_path="/region")
    def list_region(self,name=None):
        regions = yield rg.list_region(name)
        self.response(Response(result=regions, total=len(regions)))