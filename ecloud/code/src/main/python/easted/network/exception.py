# coding:utf-8

from easted.core.exception import ECloudException


class NetworkHasNotHostsError(ECloudException):
    msg = "error.network.null_hosts"


class NetworkHasNotIpsError(ECloudException):
    msg = "error.network.null_ips"


class NetworkInUseError(ECloudException):
    """ vlan be used by vm, cannot to be delete
    """
    msg = "error.network.used"


class SubNetInUseError(ECloudException):
    """ vlan be used by vm, cannot to be delete
    """
    msg = "error.network.subnet.used"


class TenantHasNotNetworkError(ECloudException):
    msg = "error.network.tenant.null_network"


class UniqueForbidden(ECloudException):
    msg = "error.network.exist"


class NetworkNotExist(ECloudException):
    msg = "error.network.not.exist"


class SubNetNotExist(ECloudException):
    msg = "error.subnet.not.exist"


class NetworkDeleteError(ECloudException):
    msg = "error.network.delete.error"


class SubnetDeleteError(ECloudException):
    msg = "error.subnet.delete.error"


class IpsInUsedError(ECloudException):
    msg = "error.network.IP.used"


class VlanIdUsedError(ECloudException):
    msg = "error.network.vlan.id.used"


class VlanIdNotInRange(ECloudException):
    msg = "error.network.vlan.id.not.in.range"


class DnsOutofRange(ECloudException):
    msg = "error.network.vlan.dns.out.of.range"


class IpNotInCidr(ECloudException):
    msg = 'error.network.ip.not.in.cidr'


class DhcpNotInIps(ECloudException):
    msg = 'error.network.dhcp.not.in.ips'


class IpNotStandardError(ECloudException):
    msg = "error.network.ip.unstandard"


class SubNetCreateError(ECloudException):
    msg = "error.network.subnet.create.error"


class SubNetNameExist(ECloudException):
    msg = "error.subnet.name.exist"


class SubNetCidrExist(ECloudException):
    msg = "error.subnet.cidr.exist"


class VlanUsedError(ECloudException):
    msg = "error.network.vlan.used.error"


class SubnetIPNotExist(ECloudException):
    msg = "error.tenant.subnet.ip.out_of_range.error"


class TenantHostUseError(ECloudException):
    msg = "error.tenant.host.used.error"


class HostNotExist(ECloudException):
    msg = "error.host.exist.error"


class TenantNotExist(ECloudException):
    msg = "error.tenant.not.exist"
