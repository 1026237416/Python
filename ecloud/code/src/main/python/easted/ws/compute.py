# -*- coding: utf-8 -*-
from easted.utils import trace
import logging
from tornado import gen
from easted.core.rest import RestHandler
from easted.core.rest import Response
from easted.core.rest import delete
from easted.core.rest import get
from easted.core.rest import post
from easted.core.rest import put
from easted.core.exception import InvalidateParam
from easted.core.task import get_task_flow
from easted import config
from easted import compute
from easted.core.authen import get_user
from easted import snapshot
from easted.log import Type, Operator
import easted.log as optLog
from easted.volume import get_volume, set_volume_user
from easted.network import get_network, request_delete_ports
from easted.volume import list_volume
from easted.compute import AttachBeyondDomainError, VM_STATUS_STOP, InvalidVMStatusError
from easted.compute import del_server
from easted.compute import VmNotExist, VmTenantUserUnmatch, PortNotExist
from easted.identify.tenant_users import list_tenant_users
from easted.identify.exception import UserNotInTenant
from easted.log import log
from easted.identify import get_user_by_id


__author__ = 'litao@easted.com.cn'
CONF = config.CONF
LOG = logging.getLogger('system')


def gen_network_comment(network):
    result = ""
    try:
        rs = [net[0] for net in network]
        result += ' '.join(rs)
    except BaseException as e:
        LOG.error("network add failed:%s", e)
        LOG.error(trace())
    return result


class Service(RestHandler):
    @gen.coroutine
    @get(_path="/vms")
    def list_server(self, tenant_id=None, host=None, vlan_id=None, subnet_id=None, user_id=None, batch=None):
        """
        :param vlan_id:
        :param tenant_id:
        :param host:
        :param user_id:
        :param batch:
        :param detailed:
        :return:
        """
        curr_user = get_user(self.request)
        tenant_ids = curr_user.get("tenant_role")
        if tenant_ids:
            if tenant_id and tenant_id not in tenant_ids:
                raise InvalidateParam(args=["tenant_id"])
            elif not tenant_id and tenant_ids:
                tenant_id = tenant_ids
            elif not tenant_id and not tenant_ids:
                raise UserNotInTenant()

        out_servers = yield compute.list_server(tenant_ids=tenant_id, vlan_id=vlan_id, hosts=host, subnet_id=subnet_id,
                                                user_ids=user_id, batch=batch)
        self.response(Response(result=out_servers, total=len(out_servers)))

    @gen.coroutine
    @get(_path="/vm/{vm_id}")
    def get_server(self, vm_id=None, name=None):
        """
        :param vm_id:
        :param name:
        :return:
        """
        out_server = yield compute.get_server(vm_id=vm_id, name=name)
        self.response(Response(result=out_server))

    @gen.coroutine
    @put(_path="/vm")
    def create_server(self, body):
        """"""
        body['metadata'] = compute.Metadata(**body['metadata'])
        vm = compute.Server(**body)
        if not vm.cores:
            raise InvalidateParam(args=['cores'])
        if not vm.memory:
            raise InvalidateParam(args=['memory'])
        if not vm.image:
            raise InvalidateParam(args=['image'])
        if not vm.metadata.extend.get("displayname"):
            raise InvalidateParam(args=['metadata.extend.displayname'])
        if vm.metadata.extend.get("keepalive") not in (0, 1):
            raise InvalidateParam(args=['metadata.extend.keepalive'])
        if not vm.tenant:
            raise InvalidateParam(args=['tenant'])
        if not vm.network:
            for network in vm.network:
                if not network.vlan:
                    raise InvalidateParam(args=['network.vlan'])
        server = yield compute.create_server(vm)
        for s in server['name_ips']:
            optLog.write(self.request, Type.VM, s['name'], Operator.CREATE,
                         vm.metadata.extend.get("displayname") + " " + ",".join(s['ips']))
        self.response(Response(result={"batch": server['name']}))

    @gen.coroutine
    @delete(_path="/vms/{batch}")
    def delete_server_by_batch(self, batch):
        vm_info = yield compute.list_server(batch=batch, detailed=True, with_task=False)
        if not vm_info:
            raise VmNotExist(args=['batch', batch])
        for info in vm_info:
            yield del_server(info["id"], delete_volume_ids=list())
            optLog.write(self.request, Type.VM, str(info["name"]), Operator.DELETE,
                         str(info["displayname"]) + " " + gen_network_comment(info['network'].values()))
        self.response(Response())

    @gen.coroutine
    @delete(_path="/vm/{vm_id}")
    def delete_server(self, vm_id, delete_volume_ids=None):
        """ delete vm and delete vm attach volumes
        :param vm_id: the id of to delete vm
        :param delete_volume_ids: the ids of to delete attach volume
        """
        try:
            vm_info = {}
            if vm_id.startswith("vm-"):
                server_task = yield get_task_flow(name=vm_id)
                if server_task:
                    server_task = server_task[0]
                    params = server_task.get("param")
                    server_info = params["body"]["server"]
                    vm_info["network"] = server_info["networks"]
                    vm_info["name"] = server_info["name"]
                    vm_info["displayname"] = server_info["displayname"]
            else:
                vm_infos = yield compute.list_server(vm_ids=vm_id, with_task=False)
                if not vm_infos:
                    raise VmNotExist(args=['vm_id', vm_id])
                vm_info = vm_infos[0]
            info = vm_info
            if delete_volume_ids:
                delete_volume_ids = delete_volume_ids.split(",")
            else:
                delete_volume_ids = []
            if not vm_id.startswith("vm-"):
                yield snapshot.clean_vm_or_volume_snapshot(info["name"])
            if delete_volume_ids:
                del_volumes = yield list_volume(detailed=False, volume_id=delete_volume_ids)
                for del_volume_item in del_volumes:
                    yield snapshot.clean_vm_or_volume_snapshot(del_volume_item["name"])
                    optLog.write(self.request, Type.VDISK, str(del_volume_item["name"]), Operator.DELETE,
                                 str(del_volume_item["name"]))
            yield del_server(vm_id, delete_volume_ids=delete_volume_ids)
            optLog.write(self.request, Type.VM, str(info["name"]), Operator.DELETE,
                         str(info["displayname"]) + " " + gen_network_comment(info['network'].values()))
            self.response(Response())
        except Exception as e:
            LOG.error("delete_server error: %s" % e)
            raise e

    @gen.coroutine
    @post(_path="/vm/{vm_id}/info")
    def update_server(self, vm_id, vm_metadata):
        """ update vm metadata's extend info
        :param vm_id: id of vm
        :param vm_metadata: the metadata extend info of vm,
                            {"vm_id":"uuid",
                             "extend": {"displayname": "sec", "des": "desc", "keepalive": 0}}
        """
        vm_metadata = compute.Metadata(**vm_metadata)
        if vm_id and vm_metadata.extend:
            vm = yield compute.get_server(vm_id=vm_id)
            if not vm:
                raise VmNotExist
            yield compute.update_server(vm_id, vm_metadata)
            optLog.write(self.request, Type.VM, vm['name'], Operator.UPDATE,
                         str(vm_metadata.extend.get("displayname")) + " " + gen_network_comment(vm['network'].values()))
        else:
            raise InvalidateParam("Miss Required Params: vm_id and extend")
        self.response(Response())

    @gen.coroutine
    @post(_path="/vm/{vm_id}/setting", _required=['cores', 'memory'])
    def resize_server(self, vm_id, body):
        """ extend vm setting: cores and memory
        :param vm_id: id of vm
        :param body: extend setting：
        {
               "cores": 1,
               "memory": 1,
        }
        """

        vm = yield compute.get_server(vm_id=vm_id)
        if not vm:
            raise VmNotExist
        cores = body['cores']
        memory = body['memory']
        if vm_id and memory and cores:
            yield compute.resize(vm, cores, memory)
        else:
            raise InvalidateParam(args=['cores', 'memory'])

        optLog.write(self.request, Type.VM, vm['name'], Operator.MODIFY_SETTING,
                     vm['displayname'] + " " + gen_network_comment(vm['network'].values()))

        self.response(Response())

    @gen.coroutine
    @post(_path="/vm/control", _required=['ids', 'action'])
    def control_server(self, body):
        """ to start\stop\reboot instance
        :param body:
        """
        ids = body['ids']
        action = body['action']
        LOG.debug("vm control action is %s  starting", action)
        vmnames = yield compute.control(action, ids)
        LOG.debug("vm control action is %s  end", action)
        for vm in vmnames:
            optLog.write(self.request, Type.VM, vm['name'], action,
                         vm['displayname'] + " " + gen_network_comment(vm['network'].values()))
        self.response(Response())

    @gen.coroutine
    @get(_path="/vm/{vm_id}/vnc")
    def get_instance_vnc(self, vm_id):
        """ list instances of tenant
        :param vm_id: id of vm
        :return: vm 's vnc url
        """
        vm = yield compute.get_server(vm_id=vm_id)
        if not vm:
            raise VmNotExist
        result = {}
        console = yield compute.vnc(vm_id)
        result["url"] = console
        self.response(Response(result=result))

    @gen.coroutine
    @post(_path="/vm/{vm_id}/migrate")
    def migrate_server(self, vm_id, body):
        """ migrate instance required instance status if shutoff.
        :param vm_id: id of vm
        :param body: params of migrate instance
        """
        body = compute.VMMigrate(**body)
        destination_host = body.destination_host
        old_vm = yield compute.get_server(vm_id=vm_id)
        if not old_vm:
            raise VmNotExist
        vm_status = old_vm['state']
        if vm_status == compute.VM_STATUS_STOP:
            yield compute.cold_migrate(vm_id, destination_host)
        elif vm_status == compute.VM_STATUS_ACTIVE:
            yield compute.live_migrate(vm_id, destination_host)
        optLog.write(self.request, Type.VM, old_vm['name'], Operator.MIGRATE,
                     old_vm['displayname'] + " " + gen_network_comment(old_vm['network'].values()))
        self.response(Response())

    @gen.coroutine
    @post(_path="/vm/{vm_id}/upload/image", _required=['name'])
    def upload_image_template(self, vm_id, vm_template):
        """ generate vm template from exist vm
        :param vm_id: the id of vm
        :param vm_template: the params of create vm template
        :return:
        """
        vm_template = compute.VMTemplate(**vm_template)
        vm = yield compute.get_server(vm_id=vm_id)
        if VM_STATUS_STOP != vm['state']:
            raise InvalidVMStatusError
        vm_temp = yield compute.template(vm_id, vm_template)
        optLog.write(self.request, Type.VM, vm['name'], Operator.CREATE_TEMPLATE,
                     vm['displayname'] + " " + gen_network_comment(vm['network'].values()) + " " + vm_template.name)
        self.response(Response(result={"id": vm_temp}))

    @gen.coroutine
    @get(_path="/vm/{vm_id}/attach/volumes")
    def list_attach_volume(self, vm_id):
        vm = yield compute.get_server(vm_id=vm_id)
        if not vm:
            raise VmNotExist
        attach_volumes = yield compute.list_server_attach_volume(vm_id, vd_type=0)
        self.response(Response(result=attach_volumes, total=len(attach_volumes)))

    @gen.coroutine
    @post(_path="/vm/volume/attach",
          _required=["vm_id", "volume_id"])
    def attach_volume(self, attachment):
        volume_id = attachment['volume_id']
        server_id = attachment['vm_id']
        volume = yield get_volume(volume_id, detailed=True)
        server = yield compute.get_server(vm_id=server_id)
        if not volume or not server:
            raise InvalidateParam(args=['vm_id', 'volume_id'])
        volume_project = unicode(volume['tenant'].get("id", None))
        server_project = unicode(server['tenant'].get("id", None))
        if volume_project and server_project and server_project != volume_project:
            raise AttachBeyondDomainError

        volume_user = unicode(volume['user'].get("id", None))
        server_user = unicode(server['user'].get("id", None))
        if volume_user and server_user and volume_user != server_user:
            raise AttachBeyondDomainError

        yield compute.attach_server_volume(volume_id=volume_id,
                                           server_id=server_id)
        optLog.write(self.request, optLog.Type.VDISK,
                     volume['name'], optLog.Operator.ATTACH,
                     volume['metadata']['displayname'] + ">>" +
                     server['name'] + " " + gen_network_comment(server['network'].values()))
        self.response(Response())

    @gen.coroutine
    @post(_path="/vm/volume/detach",
          _required=["vm_id", "volume_id"])
    def detach_volume(self, attachment):
        volume_id = attachment['volume_id']
        server_id = attachment['vm_id']
        volume = yield get_volume(volume_id, detailed=True)
        server = yield compute.get_server(vm_id=server_id, detailed=True)
        if not volume or not server:
            raise InvalidateParam(args=['vm_id', 'volume_id'])
        yield compute.detach_server_volume(server_id=server_id,
                                           volume_id=volume_id)
        optLog.write(self.request, optLog.Type.VDISK,
                     volume['name'], optLog.Operator.DETACH,
                     volume['metadata']['displayname'] + ">>" +
                     server['name'] + " " + gen_network_comment(server['network'].values()))
        self.response(Response())

    @gen.coroutine
    @post(_path="/vm/user")
    def vm_user(self, body):
        """
        :param body:
        {
            "vm-user": [{
                "user_id": "83d546cc-3975-4890-8c31-e8c859203d9b",
                "vm_id": "e603b2a7-4854-4368-8bfb-e68d0ac6c170"
            }]
        }
        :return:
        """
        vm_u = body.get("vm-user")
        if not vm_u:
            raise InvalidateParam(args=['vm-user'])
        for v_u in vm_u:
            vm_id = v_u.get("vm_id")
            u_id = v_u.get("user_id")
            vm = yield compute.get_server(vm_id)
            if not vm:
                raise VmNotExist(args=["vm_id"])
            vm_tenant_id = vm["tenant"]["id"]
            users = yield list_tenant_users(vm_tenant_id)
            user_ids = [user_item["id"] for user_item in users]
            if not user_ids or u_id not in user_ids:
                raise VmTenantUserUnmatch(args=[{"user_id": u_id}])
        for v_u in vm_u:
            vm_id = v_u.get("vm_id")
            u_id = v_u.get("user_id")
            vm = yield compute.get_server(vm_id)
            user = yield get_user_by_id(u_id)
            attch_vol = yield compute.list_server_attach_volume(vm_id)
            for vol_item in attch_vol:
                vol_id = vol_item["volume_id"]
                yield set_volume_user(vol_id, u_id)
            yield compute.set_vm_user(vm_id, u_id)
            log.write(self.request, log.Type.VM,
                      vm['name'], log.Operator.SET_USER,
                      vm['displayname'] + " " + gen_network_comment(vm['network'].values()) + " " + user['displayname'])
        self.response(Response())

    @gen.coroutine
    @get(_path="/vm/{vm_id}/nics")
    def list_vm_nics(self, vm_id):
        vm = yield compute.get_server(vm_id, detailed=False)
        if not vm:
            raise InvalidateParam(args=['vm_id'])
        nics = yield compute.list_vm_nics(vm)
        self.response(Response(result=nics, total=len(nics)))

    @gen.coroutine
    @put(_path="/vm/{vm_id}/nic")
    def add_vm_nic(self, vm_id, body):
        vlan_id = body.get("vlan_id")
        subnet_id = body.get("subnet_id")
        ip = body.get("ip")
        mac = body.get("mac")
        vlan = yield get_network(vlan_id)
        vm = yield compute.get_server(vm_id, detailed=False)
        if not vm or not vlan:
            raise InvalidateParam(args=['vm_id'])
        fixed_ip = yield compute.add_vm_nic(vm, vlan_id, subnet_id, ip, mac)
        log.write(self.request, log.Type.VM,
                  vm['name'], log.Operator.ADD_NIC,
                  vlan.get("name") + " " + fixed_ip)
        self.response(Response())

    @gen.coroutine
    @delete(_path="/vm/{vm_id}/nic/{port_id}")
    def del_vm_nic(self, vm_id, port_id):
        vm = yield compute.get_server(vm_id, detailed=False)
        port = yield compute.get_port(port_id)
        if not vm or not port:
            raise InvalidateParam(args=['vm_id'])
        yield compute.del_vm_nic(vm, port_id)
        log.write(self.request, log.Type.VM,
                  vm['name'], log.Operator.DEL_NIC,
                  port.get("name") + " " + port.get("ip"))
        self.response(Response())

    @gen.coroutine
    @delete(_path="/vm/nic/{port_id}")
    def delete_port(self, port_id):
        try:
            port = yield compute.get_port(port_id)
            if not port:
                raise PortNotExist()
            yield request_delete_ports(port.get("tenant_id"), port_id)
        except BaseException as e:
            LOG.error("delete_port error : %s" % e)
            raise e
        self.response(Response())
