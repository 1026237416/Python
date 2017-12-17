# coding:utf-8
from easted.core.exception import ECloudException


class LicenseNotExists(ECloudException):
    """
        license不存在
    """
    msg = "error.license.not.exists"


class PrivateKeyNotExists(ECloudException):
    """
        私钥不存在
    """
    msg = "error.license.private.key.not.exists"


class LicenseAnalysisError(ECloudException):
    """
        license解析出错
    """
    msg = "error.license.analysis.error"


class LicenseNotStandard(ECloudException):
    """
        license不合法
    """
    msg = "error.license.not.standard"


class HostidNotMatch(ECloudException):
    """
        主机标识不匹配
    """
    msg = "error.license.hostid.not.match"


class LicenseOverdue(ECloudException):
    """
        license已过期
    """
    msg = "error.license.overdue"


class GetHostIdError(ECloudException):
    """
        获取主机标识出错
    """
    msg = "error.license.get.hostid.error"


class LicenseUpLoadFailed(ECloudException):
    """
        license上传失败
    """
    msg = "error.license.upload.failed"