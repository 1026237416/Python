# -*- coding: utf-8 -*-
import logging
from tornado import gen
from easted import config
from easted.core import dbpools
from easted.core import openstack
from easted.core.exception import RequiredParamNotExist, InvalidateParam
from constant import *
from easted.utils import remove_null_string, required, if_none_get_empty, trace
from exception import InvalidVmActionError, VNCConsoleError, ResizeVmStatusError, ServerOperationFailed
from flavor import find_or_create_flavor
from common import update_tenant_vm_quotas, \
    Control, server_action
from common import check_tenant_quota, set_or_update_vm_meta
from server import get_server, list_server
from volumes import list_server_attach_volume
from easted.volume import upload_to_image, update_volume_image_metadata
from easted.core import task

__REBOOT_SOFT = 'SOFT'
__REBOOT_HARD = 'HARD'
__VM_ACTION_START = "start"
__VM_ACTION_SHUTDOWN = "shutdown"
__VM_ACTION_REBOOT = "reboot"
__VM_ACTIONS = (__VM_ACTION_START, __VM_ACTION_SHUTDOWN, __VM_ACTION_REBOOT)

__FLAVOR_ATTR = '''{"new": null, "old": null, "cur": {"nova_object.version": "1.1",
"nova_object.name": "Flavor", "nova_object.data": {"disabled": false, "root_gb": %d,
"name": "%s", "flavorid": "%s",
"deleted": false, "created_at": null, "ephemeral_gb": 0, "updated_at": null,
"memory_mb": %d, "vcpus": %d, "extra_specs": {},
"swap": 0, "rxtx_factor": 1.0, "is_public": true, "deleted_at": null,
"vcpu_weight": 0, "id": %d}, "nova_object.namespace": "nova"}}'''

__author__ = 'litao@easted.com.cn'
__all__ = [
    "control",
    "resize",
    "vnc",
    "template",
    "VMTemplate"
]

CONF = config.CONF
LOG = logging.getLogger('system')


class VMTemplate(object):
    name = str
    des = str
    super_user_pass = str
    user = str

    def __init__(self, **kwargs):
        self.name = kwargs.get("name", None)
        self.des = kwargs.get("des", None)
        self.super_user_pass = kwargs.get("super_user_pass", None)
        self.super_user = kwargs.get("super_user", None)


@gen.coroutine
def control(action, vm_ids):
    """ vm action control, start\reboot\shutdown
    :param request: the request of function
    :param vm_ids: the VM ids of to Control
    :param action: VM control action
    """
    try:
        if not action:
            raise RequiredParamNotExist(args=["action"])
        if not vm_ids:
            raise RequiredParamNotExist(args=["vm_ids"])

        if action not in __VM_ACTIONS:
            raise InvalidVmActionError(args=[action])

        if not isinstance(vm_ids, (list, tuple)):
            raise InvalidateParam(args=['vm_id'])

        vms = yield list_server(vm_ids=vm_ids, with_task=False)
        # vms = [vm for vm in vms if vm['id'] in vm_ids]
        vmnames = []
        task_id = task.gen_task_id()
        if action == __VM_ACTION_START:
            for vm in vms:
                if vm['state'] != VM_STATUS_STOP or vm["host_status"] == "unavailable" or vm[
                    "service_status"] == "unavailable":
                    continue
                vm_id = vm['id']
                yield task.insert_task_flow(task_id, "wait start", vm_id, type=SCHED_TYPE_ACTIONG_START,
                                            host=vm['host']['name'])
                vmnames.append({"name": vm['name'], "displayname": vm['displayname'], "network": vm['network']})

        if action == __VM_ACTION_SHUTDOWN:
            for vm in vms:
                vm_id = vm['id']
                if vm['state'] != VM_STATUS_ACTIVE or vm["host_status"] == "unavailable" or vm[
                    "service_status"] == "unavailable":
                    continue

                yield server_action(vm_id, Control.STOP)
                vmnames.append({"name": vm['name'], "displayname": vm['displayname'], "network": vm['network']})

        if action == __VM_ACTION_REBOOT:
            for vm in vms:
                vm_id = vm['id']
                if vm['state'] != VM_STATUS_ACTIVE or vm["host_status"] == "unavailable" or vm[
                    "service_status"] == "unavailable":
                    continue
                yield task.insert_task_flow(task_id, "wait reboot", vm_id, type=SCHED_TYPE_ACTIONG_REBOOT,
                                            host=vm['host']['name'])
                vmnames.append({"name": vm['name'], "displayname": vm['displayname'], "network": vm['network']})
    except Exception, e:
        LOG.error(trace())
        LOG.error("vm control error ! %s", e)
    raise gen.Return(vmnames)


@gen.coroutine
def resize(vm_id, cores, memory):
    if isinstance(vm_id, basestring):
        instance = yield get_server(vm_id=vm_id)
    else:
        instance = vm_id
    tenant = instance['tenant']['id']
    if VM_STATUS_STOP != instance['state']:
        raise ResizeVmStatusError()
    sys_volume_size = instance['sys_volume']['size']
    quota = yield check_tenant_quota(tenant, cores - instance['cores'],
                                     memory - instance['memory_mb'])
    flavor = yield find_or_create_flavor(cores, memory, sys_volume_size)
    yield __update_instance_flavor(instance['id'], **flavor)
    yield server_action(instance['id'], Control.REBOOT, info={"type": __REBOOT_HARD})
    yield update_tenant_vm_quotas(tenant, quota['used_cores'], quota['used_memorys'])


@gen.coroutine
def __update_instance_flavor(vm_id, **flavor):
    """ update tenant' quota settings
    :param vm_id: id of virtual machine
    :param flavor: resize flavor = {}
    """
    db = dbpools.get_nova()
    tx = yield db.begin()
    try:
        new_flavor = __FLAVOR_ATTR % (flavor['disk_capacity'], flavor['name'],
                                      flavor['id'], flavor['memory'],
                                      flavor['cores'], 0)
        yield tx.execute("update instance_extra set flavor = %s where instance_uuid = %s",
                         (remove_null_string(new_flavor), vm_id))
        yield tx.execute("update instances set memory_mb=%s, vcpus=%s, root_gb=%s where uuid = %s",
                         (flavor['memory'], flavor['cores'],
                          flavor['disk_capacity'], vm_id))
    except Exception, e:
        LOG.error("update instance flavor error: %s" % e)
        yield tx.rollback()
        raise ServerOperationFailed
    else:
        yield tx.commit()


@gen.coroutine
def vnc(vm_id):
    try:
        url = '/servers/%s/action' % vm_id
        body = {"os-getVNCConsole": {"type": "novnc"}}
        session = yield openstack.get_session()
        console = yield openstack.connect_request(session=session, type=openstack.TYPE_COMPUTE, url=url,
                                                  method=openstack.METHOD_POST, body=body)
        url = console["console"]["url"]
    except Exception, e:
        LOG.error("vnc vm  error: %s" % e)
        raise VNCConsoleError()
    else:
        raise gen.Return(url)


@gen.coroutine
@required("vm_id", "template_name")
def template(vm_id, template):
    """ generate vm templates from exist vm
    :param template:
    :param image_id:
    :param vm_id: the id of vm
    :return:
    """
    try:

        sys_volume = yield list_server_attach_volume(vm_id, vd_type=1)

        sys_volume_id = sys_volume[0]['volume_id']
        min_disk = sys_volume[0]['size']

        new_min_disk = min_disk * 1024 / 1000

        if min_disk * 1024 % 1000:
            new_min_disk + 1

        metadata = {"ecloud_image_type": 0,
                    "des": template.des,
                    "disk_format": "qcow2",
                    "ecloud_source": 1,
                    "min_disk": new_min_disk,
                    "super_user_pass": if_none_get_empty(template.super_user_pass),
                    "min_disk_size": new_min_disk,
                    "super_user": if_none_get_empty(template.super_user),
                    "disk_bus": 'virtio'
                    }

        # 修改镜像
        for k, v in metadata.items():
            yield update_volume_image_metadata(sys_volume_id, k, v)

        vm_temp = yield upload_to_image(volume_id=sys_volume_id,
                                        force=True,
                                        image_name=template.name,
                                        container_format="bare",
                                        disk_format=metadata["disk_format"])
        if not vm_temp:
            raise gen.Return(None)

        image_id = vm_temp.get('os-volume_upload_image').get('image_id')
        # 给云主机新增镜像上传中状态
        yield set_or_update_vm_meta(vm_id, "status", VM_STATUS_UPLOAD)
        yield set_or_update_vm_meta(vm_id, "upt_image_id", image_id)

    except Exception, e:
        LOG.error("generate vm templates error: %s" % e)
        raise ServerOperationFailed
    raise gen.Return(image_id)
