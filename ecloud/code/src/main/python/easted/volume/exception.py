# -*- coding: utf-8 -*-

from easted.core.exception import ECloudException


class VolumeNotExist(ECloudException):
    msg = "error.storage.volume.not.exist"


class VolumeOperationFailed(ECloudException):
    msg = "error.storage.volume.operation.failed"


class VolumeTypeOperationFailed(ECloudException):
    msg = "error.storage.volume.type.operation.failed"


class VolumeTenantUserUnmatch(ECloudException):
    msg = "error.storage.volume.user.tenantuser.unmatch"

class VolumeTenantUnmatch(ECloudException):
    msg = "error.storage.volume.tenant.unmatch"

class ClearUserVolumeRelationError(ECloudException):
    msg = "error.storage.volume.clear.user.relation"
