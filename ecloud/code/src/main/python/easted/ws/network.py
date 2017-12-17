# -*- coding: utf-8 -*-

import sys
import logging

from tornado import gen

from easted.core.exception import InvalidateParam

reload(sys)
sys.setdefaultencoding('utf-8')

from easted.host import query_host, count_network_vm, list_simple_hosts
from easted import log as optLog
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get, post, put, delete
from easted.log import Type, Operator
from easted.network import *
from easted import config

LOG = logging.getLogger('system')
CONF = config.CONF


class Service(RestHandler):
    """ network management
    """

    @gen.coroutine
    @put(_path="/network", _required=['name', "phy_network"])
    def create_network(self, params):
        """
        Create network
        :param params: vlan params
        """
        LOG.debug("Enter create_network, params is %s" % params)
        network_obj = Network(params)
        yield create_network(network_obj)
        optLog.write(self.request, Type.NETWORK, network_obj.name, Operator.CREATE, '')
        self.response(Response())

    @gen.coroutine
    @get(_path="/phynetworks")
    def list_phy_network(self):
        phy_networks = list_phy_network()
        self.response(Response(result=phy_networks))

    @gen.coroutine
    @get(_path="/networks")
    def list_network(self, tenant=None, phy_network=None):
        out_networks = yield list_network(tenant_id=tenant, phy_network=phy_network)
        self.response(Response(result=out_networks, total=len(out_networks)))

    @gen.coroutine
    @get(_path="/network/{network}")
    def get_network(self, network_id):
        """
        Get network info by network id
        :param network_id:
        :return:
        """
        net = yield get_network(network_id)
        self.response(Response(result=net, total=1))

    @gen.coroutine
    @delete(_path="/network/{network_id}")
    def delete_network(self, network_id):
        """
        Delete network by id
        :param network_id: network's id
        """
        network = yield get_network(network_id)
        if not network:
            raise NetworkNotExist
        yield delete_network(network_id)
        optLog.write(self.request, Type.NETWORK, network['name'], Operator.DELETE, '')
        self.response(Response())

    @gen.coroutine
    @post(_path="/network/{network_id}")
    def update_network(self, network_id, params):
        """
        Update network
        :param network_id:
        :param params: json: dns, name, gateway
        :return:
        """
        network = yield get_network(network_id)
        if not network:
            raise NetworkNotExist
        change_info = {
            "name": ""
        }
        for key in change_info:
            change_info[key] = params[key] if key in params else ""
        change_info["id"] = network_id
        old_network = yield get_network(network_id)
        if not old_network:
            raise NetworkNotExist
        yield update_network(old_network, change_info)
        model_name = change_info["name"] if change_info["name"] else old_network["name"]
        optLog.write(self.request, Type.NETWORK, old_network["name"], Operator.UPDATE, model_name)
        LOG.debug("Leave update_network, old network_id is %s, new network params is %s" % (network_id, params))
        self.response(Response())

    @gen.coroutine
    @get(_path="/network/{network_id}/hosts")
    def get_network_hosts(self, network_id):
        """
        Get network' s hosts
        :param network_id: network id
        :param tenant_id: project id, default is None
        """
        network = yield get_network(network_id)
        if not network:
            raise NetworkNotExist
        hosts = yield get_network_hosts(network_id)
        new_hosts = []
        if hosts:
            hypervisors = yield query_host()
            host_name = [hypervisor["name"] for hypervisor in hypervisors if str(hypervisor["id"]) in hosts]
            vm_counts = yield count_network_vm(host_name, network_id)
            for hypervisor in hypervisors:
                hyper_id = str(hypervisor.get("id"))
                if hyper_id in hosts:
                    new_hosts.append({
                        "id": hyper_id,
                        "name": hypervisor.get("name"),
                        "ip": hypervisor.get("ip"),
                        "cpus": hypervisor.get('cpus'),
                        "memory_mb": hypervisor.get('memory_mb'),
                        "vlans": hypervisor.get("vlans"),
                        "status": hypervisor.get('status'),
                        "vm_counts": vm_counts[hypervisor["name"]]
                    })
        self.response(Response(result=new_hosts, total=len(new_hosts)))

    @gen.coroutine
    @delete(_path="/network/{network_id}/host/{host_id}")
    def del_vlan_hosts(self, network_id, host_id):
        """ set vlan hosts
        :param network_id: id of network
        :param host_id: can alter network' s hosts
        """
        network = yield get_network(network_id)
        if not network:
            raise NetworkNotExist
        old_network = yield get_network(network_id)
        yield delete_network_hosts(network_id, host_id)
        hosts_info = yield list_simple_hosts(host_id=host_id)
        hosts_name = []
        for host in hosts_info:
            hosts_name.append(host['name'])
        optLog.write(self.request, Type.NETWORK, old_network['name'],
                     Operator.DEL_HOST, ','.join(map(str, hosts_name)))
        self.response(Response())

    @gen.coroutine
    @post(_path="/network/{network_id}/hosts", _required=["hosts"])
    def set_vlan_hosts(self, network_id, body):
        """ set vlan hosts
        :param network_id: id of network
        :param body: can alter network' s hosts
        """
        network = yield get_network(network_id)
        if not network:
            raise NetworkNotExist
        hosts = body.get("hosts")

        hosts_info = yield list_simple_hosts(host_id=hosts)

        old_network = yield get_network(network_id)
        if old_network:
            name = old_network['name']
            yield add_network_hosts(network_id=network_id,
                                    network_name=name,
                                    hosts=hosts)
        else:
            raise InvalidateParam(args=['network_id'])
        for host in hosts_info:
            optLog.write(self.request, Type.NETWORK, old_network['name'],
                         Operator.ADD_HOST, host['name'])
        self.response(Response())
