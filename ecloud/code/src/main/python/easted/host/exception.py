# -*- coding: utf-8 -*-
from easted.core.exception import ECloudException


class HostNotExist(ECloudException):
    msg = "error.host.host.not.exist"

class IPMIInfoNotExist(ECloudException):
    msg = "error.host.impi.info.not.exist"

class HostListFailed(ECloudException):
    msg = "error.host.list.failed"

class UpdateHostIpmiFailed(ECloudException):
    msg = "error.host.update.failed"

class HostUnAvailable(ECloudException):
    msg = "error.host.host.unavailable"

class HostAvailableGetFailed(ECloudException):
    msg = "error.host.host.available.get.failed"





