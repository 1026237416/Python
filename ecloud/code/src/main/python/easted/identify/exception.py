# -*- coding: utf-8 -*-
from easted.core.exception import ECloudException

__author__ = 'gaoshan@easted.com.cn'

__all__ = [
    "TenantQuotaOutOfRange"
]


class Forbidden(ECloudException):
    msg = "error.identify.user.forbidden"


class QueryUserTenantRoleFailed(ECloudException):
    msg = "error.identify.user.tenant.role"


class ActivateUserFailed(ECloudException):
    msg = "error.identify.user.activate"


class TenantExists(ECloudException):
    msg = "error.identify.tenant.exists"


class TenantOperationFailed(ECloudException):
    msg = "error.identify.tenant.operate"


class TenantDeleteFailed(ECloudException):
    msg = "error.identify.tenant.delete"


class TenantUserOperationFailed(ECloudException):
    msg = "error.identify.tenant.user.operate"


class TenantQuotaOperationFailed(ECloudException):
    msg = "error.identify.tenant.quota.operate"


class TenantQuotaOutOfRange(ECloudException):
    msg = "error.identify.tenant.quota.range.out"


class UnknownQuotaName(ECloudException):
    msg = "error.identify.tenant.quota.unknown"


class UserNotExist(ECloudException):
    msg = "error.identify.user.not.exists"


class UserOperationFailed(ECloudException):
    msg = "error.identify.user.operate"


class UserExists(ECloudException):
    msg = "error.identify.user.exist"


class UnknownRoleName(ECloudException):
    msg = "error.identify.role.name.unknown"


class UserNotInTenant(ECloudException):
    msg = "error.identify.user.notin.any.tenant"


class ConnectLdapFailed(ECloudException):
    msg = "error.identify.user.connect.ldap.failed"
