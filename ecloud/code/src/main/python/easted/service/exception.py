# -*- coding: utf-8 -*-
from easted.core.exception import ECloudException

__author__ = 'luheng@easted.com.cn'


class RestartOpenstackServiceFailed(ECloudException):
    msg = "error.openstack_service.restart.failed"

class ServiceListFailed(ECloudException):
    msg = "error.service.list.failed"

