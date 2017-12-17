# -*- coding: utf-8 -*-
__author__ = 'litao@easted.com.cn'

import logging

from tornado import gen
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get
from easted.core.rest import post
from easted.service import *

LOG = logging.getLogger('system')

class Service(RestHandler):

    @gen.coroutine
    @get(_path="/services")
    def list_service(self, flag=None):
        """list openstack service info
        :param flag: the flag of openstack service
        flag=0: nova service
        flag=1: cinder service
        flag=2: neutron service
        """
        result = yield list_openstack_service(flag)
        self.response(Response(result=result, total=len(result)))