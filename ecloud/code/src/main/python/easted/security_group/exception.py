# -*- coding: utf-8 -*-
from easted.core.exception import ECloudException

__author__ = 'yangkefeng@easted.com.cn'


class InvalidRuleProtocol(ECloudException):
    msg = "error.security_group.protocol.invalid"


class CreateSecGroupRuleFailed(ECloudException):
    msg = "error.security_group.create.failed"


class SecGroupOperationFailed(ECloudException):
    msg = "error.security_group.operation.failed"


class SecGroupRuleOperationFailed(ECloudException):
    msg = "error.security_group_rule.operation.failed"


class DefaultSecGroupRuleOperationFailed(ECloudException):
    msg = "error.security_group_rule.default.operation.failed"
