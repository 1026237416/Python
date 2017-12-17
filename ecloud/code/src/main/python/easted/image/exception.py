from easted.core.exception import ECloudException


class ImageOperateFailed(ECloudException):
    msg = "error.image.operation.failed"


class ImageFileNotFound(ECloudException):
    msg = "error.image.file.not.found"


class ImageNotExsit(ECloudException):
    msg = "error.image.not.exsit"
