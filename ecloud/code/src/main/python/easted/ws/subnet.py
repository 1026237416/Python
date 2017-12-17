# -*- coding: utf-8 -*-

import sys
import logging
from tornado import gen
from easted.core.exception import InvalidateParam
from easted.host import query_host, count_tenant_vm, count_tenant_vd
from easted.identify import get_tenant_by_id
import netaddr
from easted import log as optLog
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get, post, put, delete
from easted.log import Type, Operator
from easted.network import *
from easted import config
from easted.host import list_simple_hosts

LOG = logging.getLogger('system')
CONF = config.CONF
reload(sys)
sys.setdefaultencoding('utf-8')


class Service(RestHandler):
    """ network management
    """

    @gen.coroutine
    @put(_path="/network/subnet", _required=['cidr', 'name'])
    def create_network_subnet(self, params):
        """
        Create network
        :param params: vlan params
        """
        LOG.debug("Enter create_network_subnet, params is %s" % params)
        subnet = SubNet(params)
        network = yield get_network(subnet.network_id)
        if not network:
            raise NetworkNotExist
        cidr_ip_range = tuple(netaddr.IPNetwork(subnet.cidr))
        cidr_start = int(cidr_ip_range[0])
        cidr_end = int(cidr_ip_range[-1])
        for ip in subnet.ips:
            start = int(netaddr.IPAddress(ip.get("start")))
            end = int(netaddr.IPAddress(ip.get("end")))
            if start < cidr_start or end > cidr_end:
                raise IpNotInCidr
        subnet_select = yield get_subnet_db(network_id=subnet.network_id, name=subnet.name)
        if subnet_select:
            raise SubNetNameExist
        subnet_select = yield get_subnet_db()
        subnet_cidr_ips = set([int(ip) for ip in netaddr.IPNetwork(subnet.cidr)])
        cidrs_ips = (set((int(ip) for ip in netaddr.IPNetwork(item["cidr"])))for item in subnet_select)
        for item in cidrs_ips:
            if item.intersection(subnet_cidr_ips):
                raise SubNetCidrExist
        yield create_subnet(subnet)
        optLog.write(self.request, Type.NETWORK, network.get("name"), Operator.CRATE_SUBNET, subnet.name)
        self.response(Response())

    @gen.coroutine
    @get(_path="/subnets")
    def list_network_subnets(self, network_id=None, tenant=None):
        out_networks = yield list_subnets(network_id=network_id, tenant_id=tenant)
        self.response(Response(result=out_networks, total=len(out_networks)))

    @gen.coroutine
    @get(_path="/subnet/{subnet_id}")
    def get_network_subnets(self, subnet_id):
        """
        Get network info by network id
        :param subnet_id:
        :return:
        """
        result = yield get_subnet(subnet_id)
        self.response(Response(result=result, total=1))

    @gen.coroutine
    @delete(_path="/subnet/{subnet_id}")
    def delete_network_subnet(self, subnet_id):
        """
        Delete network by id
        :param subnet_id: subnet's id
        """
        LOG.debug("Enter delete_network_subnet, subnet_id is %s" % subnet_id)
        subnet = yield get_subnet(subnet_id)
        if not subnet:
            raise SubNetNotExist
        network = yield get_network(subnet.get("network_id"))
        if not network:
            raise NetworkNotExist
        yield delete_subnet(subnet_id)
        optLog.write(self.request, Type.NETWORK, network['name'], Operator.DELETE_SUBNET, subnet['name'])
        self.response(Response())

    @gen.coroutine
    @post(_path="/subnet/{subnet_id}")
    def update_network_subnet(self, subnet_id, params):
        """
        Update network
        :param subnet_id:
        :param params: json: dns, name, gateway
        :return:
        """
        LOG.debug("Enter update_network_subnet, old network_id is %s, new network params is %s" % (subnet_id, params))
        change_info = {
            "name": "",
            "dns": "",
            "gateway": ""
        }
        for key in change_info:
            change_info[key] = params[key] if key in params else ""
        change_info["id"] = subnet_id
        subnet = yield get_subnet(subnet_id)
        if not subnet:
            raise SubNetNotExist
        network = yield get_network(subnet.get("network_id"))
        if not network:
            raise NetworkNotExist
        yield update_subnet(subnet, change_info)
        model_name = change_info["name"] if change_info["name"] else subnet["name"]
        optLog.write(self.request, Type.NETWORK, network["name"], Operator.EDIT_SUBNET, model_name)
        self.response(Response())

    @gen.coroutine
    @get(_path="/subnet/{subnet_id}/ips")
    def get_subnet_ips(self, subnet_id, tenant=None):
        """
        :param subnet_id:
        :param tenant:
        :return:
        """
        if tenant:
            ips = yield get_tenant_ips(subnet_id=subnet_id, tenant_id=tenant)
        else:
            ips = yield get_subnet_ips(subnet_id=subnet_id, tenant_id=tenant)
        self.response(Response(result=ips, total=len(ips)))

    @gen.coroutine
    @post(_path="/subnet/{subnet_id}/ips", _required=['ips'])
    def update_subnet_ips(self, subnet_id, body):
        """
        Update network's ips
        :param subnet_id:
        :param body: {"ips":["114.114.114.114", ...]}
        :return:
        """
        ips = body['ips']
        subnet = yield get_subnet(subnet_id)
        if not subnet:
            raise SubNetNotExist
        network = yield get_network(subnet.get("network_id"))
        if not network:
            raise NetworkNotExist
        yield set_subnet_ips(subnet_id, ips=ips)
        optLog.write(self.request, Type.NETWORK, network['name'], Operator.CONFIG_IP, subnet['name'])
        self.response(Response())

    @gen.coroutine
    @post(_path="/subnet/tenant/{tenant_id}", _required=["subnet_ids"])
    def set_tenant_subnet(self, tenant_id, body):
        subnet_ids = body['subnet_ids']
        yield set_tenant_subnet(tenant_id, subnet_ids)
        tenant = yield get_tenant_by_id(tenant_id)
        for subnet_id in subnet_ids:
            subnet = yield get_subnet(subnet_id)
            optLog.write(self.request, Type.TENANT, tenant['name'], Operator.CONFIG_NETWORK,
                         subnet['name'])
        self.response(Response())

    @gen.coroutine
    @get(_path="/tenant/{tenant_id}/hosts")
    def get_tenant_hosts(self, tenant_id):
        tenant_hosts = yield get_tenant_hosts(tenant_id)
        new_hosts = []
        if tenant_hosts:
            hypervisors = yield query_host()
            vm_counts = yield count_tenant_vm(tenant_id)
            vd_counts = yield count_tenant_vd(tenant_id)
            for hypervisor in hypervisors:
                hyper_id = hypervisor.get("id")
                if hyper_id in tenant_hosts:
                    new_hosts.append({
                        "id": hyper_id,
                        "name": hypervisor.get("name"),
                        "ip": hypervisor.get("ip"),
                        "cpus": hypervisor.get('cpus'),
                        "memory_mb": hypervisor.get('memory_mb'),
                        "status": hypervisor.get('status'),
                        "vm_counts": vm_counts.get(hypervisor.get('name'), 0),
                        "vd_counts": vd_counts.get(hypervisor.get('name'), 0)
                    })
        self.response(Response(result=new_hosts, total=len(new_hosts)))

    @gen.coroutine
    @post(_path="/tenant/{tenant_id}/hosts", _required=["host_ids"])
    def set_tenant_hosts(self, tenant_id, body):
        hosts = body.get("host_ids")
        if not tenant_id:
            raise InvalidateParam
        hosts_info = yield list_simple_hosts(host_id=hosts)
        tenant = yield get_tenant_by_id(tenant_id)
        yield set_tenant_hosts(tenant_id, hosts)
        for host in hosts_info:
            optLog.write(self.request, Type.TENANT, tenant['name'], Operator.CONFIG_TENANT_ADD_HOST,
                         host['name'])
        self.response(Response())

    @gen.coroutine
    @delete(_path="/tenant/{tenant_id}/host/{host_id}")
    def delete_tenant_host(self, tenant_id, host_id):
        yield delete_tenant_host(tenant_id, int(host_id))
        host_info = yield list_simple_hosts(host_id=host_id)
        for host in host_info:
            pass
        tenant = yield get_tenant_by_id(tenant_id)
        optLog.write(self.request, Type.TENANT, tenant['name'], Operator.CONFIG_TENANT_DELETE_HOST,
                     host['name'])
        self.response(Response())

    @gen.coroutine
    @post(_path="/subnet/{subnet_id}/tenant/{tenant_id}/ips", _required=["ips"])
    def set_tenant_subnet_ips(self, subnet_id, tenant_id, body):
        ips = body.get("ips")
        if not tenant_id:
            raise InvalidateParam
        subnet = yield get_subnet(subnet_id)
        if not subnet:
            raise SubNetNotExist
        tenant = yield get_tenant_by_id(tenant_id)
        yield set_tenant_subnet_ips(subnet_id, tenant_id, ips)
        optLog.write(self.request, Type.TENANT, tenant['name'], Operator.CONFIG_TENANT_IP, subnet['name'])
        self.response(Response())
