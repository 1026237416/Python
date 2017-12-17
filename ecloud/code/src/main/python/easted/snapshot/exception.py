#coding:utf-8
from easted.core.exception import ECloudException

class VolumeStatusNotAvailable(ECloudException):
    """
        卷状态不为available
    """
    msg = "error.volume.not.available"

class SnapshotTypeNotStandard(ECloudException):
    """
        备份类型不合法
    """
    msg = "error.snapshot.create.type.not.standard"

class BackupNameIsNone(ECloudException):
    """
        备份名称为空
    """
    msg = "error.backup.create.name.is.none"

class SnapshotCreateError(ECloudException):
    msg = "error.snapshot.create.error"

class SnapshotRecoverCreateError(ECloudException):
    msg = "error.snapshot.recover.create.error"

class BackupVersionTreeError(ECloudException):
    msg = "error.backup.version.tree.error"

class BackupListStaticError(ECloudException):
    msg = "error.backup.list.static.error"

class SnapshotDeleteError(ECloudException):
    msg = "error.snapshot.not.exsit"

class BackupVolumeRestoreError(ECloudException):
    msg = "error.backup.volume.restore.error"

class BackupVmRestoreError(ECloudException):
    msg = "error.backup.vm.restore.error"

class VmRestoring(ECloudException):
    msg = "error.backup.vm.restoring"

class VolumeRestoring(ECloudException):
    msg = "error.backup.volume.restoring"

class SnapshotOperationFailed(ECloudException):
    msg = "error.snapshot.operation.failed"

class VmMustActiveOrStop(ECloudException):
    msg = "error.snapshot.vm.must.activeorstop"

# class VmMustActive(ECloudException):
#     msg = "error.backup.vm.must.active"
#
# class VmMustStopped(ECloudException):
#     msg = "error.backup.vm.must.stopped"

class SnapShotNotExist(ECloudException):
    msg = "error.snapshot.not.exist"
