__author__ = 'tao'

"""
Ecloud base exception handling.
"""


class ECloudException(Exception):
    msg = "An unknown exception occurred."
    code = 500
    args = []

    def __init__(self, message=None, args=None):
        self.code = self.code
        self.args = args

        if not message:
            message = self.msg
        super(ECloudException, self).__init__(message)

    def format_message(self):
        return self.args[0]


class RequiredParamNotExist(ECloudException):
    """required params is not exist
    """
    msg = "error.ecloud.param.not.exist"


class ResourcesOccupiedByUser(ECloudException):
    """invalidate  param
    """
    msg = "error.ecloud.user.occupied.resources"


class InvalidateParam(ECloudException):
    """invalidate  param
    """
    msg = "error.ecloud.param.invalidate"


class DialogueTimeOut(ECloudException):
    """required time out
    """
    msg = "error.ecloud.dialogue.timeout"


class RequestTimeOut(ECloudException):
    """required time out
    """
    msg = "error.ecloud.request.timeout"


class GlobalSettingOperationFailed(ECloudException):
    msg = "error.ecloud.setting.operate.failed"


class DBPoolNotFind(ECloudException):
    """can not find db pool
    """
    msg = "error.ecloud.dbpool.not.find"


class AuthenticationFailed(ECloudException):
    """ auth failed
    """
    msg = "error.identify.auth.failed"


class ClassCastException(ECloudException):
    msg = "error.ecloud.class.cast.exception"


class IpsInUsedError(ECloudException):
    msg = "error.ecloud.ip.inused"


class SendMailFailed(ECloudException):
    msg = "error.ecloud.send.mail.failed"
