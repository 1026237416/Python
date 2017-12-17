from tornado import gen
from easted.core.rest import RestHandler
from easted.core.rest import Response
from easted.core.rest import get
from easted.core.rest import post
from easted import host as host_package
from easted.host import get_avilable_host, get_migrate_available_host, get_host_storage_capacity
from easted.log import Type, Operator
from easted.core.exception import InvalidateParam
from easted.compute import get_server
import logging
from easted import config
import easted.log as optLog

CONF = config.CONF

LOG = logging.getLogger('system')


class Service(RestHandler):
    @gen.coroutine
    @get(_path="/hosts")
    def list_host(self, volume_type=None,tenant_id=None):
        out_hosts = yield host_package.query_host(volume_type=volume_type,tenant_id=tenant_id)
        self.response(Response(result=out_hosts, total=len(out_hosts)))

    @gen.coroutine
    @get(_path="/host/{host_id}")
    def get_host(self, host_id):
        hosts = yield host_package.query_host(id=int(host_id))
        self.response(Response(result=hosts))

    @gen.coroutine
    @post(_path="/host/{host_id}")
    def update_host(self, hyper_id, ipmi):
        new_ipmi = host_package.Host(**ipmi)
        yield host_package.update_host(hyper_id, new_ipmi.__dict__)
        host = yield host_package.query_host(id=int(hyper_id))
        optLog.write(self.request, Type.HOST, host[0]['name'], Operator.UPDATE, '')
        self.response(Response())

    @gen.coroutine
    @get(_path="/hosts/available")
    def get_available_host(self, num, tenant_id, cores, memory, subnets, volume_type=None):
        subnet_ids = subnets.split(',') if subnets else None
        if not (num.isdigit() and cores.isdigit() and memory.isdigit()) \
                and not tenant_id and not subnet_ids:
            raise InvalidateParam()
        hosts = yield get_avilable_host(tenant_id, subnet_ids, eval(num + "*" + cores), eval(num + "*" + memory),
                                        volume_type=volume_type)
        self.response(Response(result=hosts))

    @gen.coroutine
    @get(_path="/hosts/{vm_id}/available")
    def get_migrate_available_host(self, vm_id):
        vm = yield get_server(vm_id)
        if not vm:
            raise InvalidateParam()
        hosts = yield get_migrate_available_host(vm)
        self.response(Response(result=hosts))

    @gen.coroutine
    @get(_path="/host/{host_name}/storages")
    def get_host_storage_capacity(self, host_name):
        host = yield host_package.list_simple_hosts(name=host_name)
        if not host:
            raise InvalidateParam()
        disks = get_host_storage_capacity(host_name)
        self.response(Response(result=disks))
