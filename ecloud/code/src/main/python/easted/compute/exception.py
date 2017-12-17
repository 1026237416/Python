# -*- coding: utf-8 -*-
from easted.core.exception import ECloudException

__author__ = 'litao@easted.com.cn'


class VmNotExist(ECloudException):
    msg = "error.compute.vm.not.exist"


class MacHasExist(ECloudException):
    msg = "error.compute.vm.mac.exist"


class HypervisorListFailed(ECloudException):
    msg = "error.compute.hypervisor.list.failed"


class UpdateHyervisorIpmiFailed(ECloudException):
    msg = "error.compute.hypervisor.update.failed"


class InvalidVmActionError(ECloudException):
    msg = "error.compute.invalid.vm.action"


class InvalidVMStatusError(ECloudException):
    msg = "error.compute.invalid.vm.status"


class InvalidVm(ECloudException):
    msg = "error.compute.invalid.vm"


class VNCConsoleError(ECloudException):
    msg = "error.compute.vnc.console"


class SetServerMetaError(ECloudException):
    msg = "error.compute.vm.meta"


class ResizeVmStatusError(ECloudException):
    msg = "error.compute.vm.resize.status"


class DeleteVmStatusError(ECloudException):
    msg = "error.compute.vm.delete.status"


class RecycledVmStatusError(ECloudException):
    msg = "error.compute.vm.recycled.status"


class LiveMigrateVmStatusError(ECloudException):
    msg = "error.compute.vm.live_migrate.status"


class ColdMigrateVmStatusError(ECloudException):
    msg = "error.compute.vm.cold_migrate.status"


class MigrateFailed(ECloudException):
    msg = "error.compute.vm.migrate.failed"


class StrategyFailedError(ECloudException):
    msg = "error.compute.strategy.failed"


class FlavorCreateOrFindError(ECloudException):
    msg = "error.compute.flavor.error"


class SysVolumeCreateError(ECloudException):
    msg = "error.compute.sysvolume.create.error"


class OnlyOneIpTypeError(ECloudException):
    msg = "error.compute.ipv4.ipv6.error"


class ServerOperationFailed(ECloudException):
    msg = "error.compute.server.operate.failed"


class ServerListFailed(ECloudException):
    msg = "error.compute.server.list.failed"


class MigrateToSelf(ECloudException):
    msg = "error.compute.server.migrate.to_self"


class MigrateBeyondDomain(ECloudException):
    msg = "error.compute.server.migrate.beyond.domain"


class AttachBeyondDomainError(ECloudException):
    msg = "error.compute.server.attach.volume.beyond.domain"


class DeleteAndDetachError(ECloudException):
    msg = "error.compute.server.detach.delete.error"


class CrateVmInnerError(ECloudException):
    msg = "error.compute.server.create.inner.error"


class HostUnAvailable(ECloudException):
    msg = "error.compute.host.unavailable"


class MetaDataError(ECloudException):
    msg = "error.compute.server.metadata.error"


class PackageServerError(ECloudException):
    msg = "error.compute.server.package.error"


class ServerAttachVolumeError(ECloudException):
    msg = "error.compute.server.attach.volume.error"


class ServerDetachVolumeError(ECloudException):
    msg = "error.compute.server.detach.volume.error"


class VmTenantUserUnmatch(ECloudException):
    msg = "error.storage.vm.user.tenantuser.unmatch"


class VmTenantUnmatch(ECloudException):
    msg = "error.storage.vm.tenant.unmatch"


class ClearUserVmRelationError(ECloudException):
    msg = "error.storage.vm.clear.user.relation"


class VMNicOperationError(ECloudException):
    msg = "error.compute.nic.operation.error"


class WindowsDriveImageNotExist(ECloudException):
    msg = 'error.compute.server.drive.image.not.exist'


class DeletePortsFailed(ECloudException):
    msg = 'error.compute.network.delete.ports.failed'


class PortNotExist(ECloudException):
    msg = "error.compute.nic.port.not.exist"
