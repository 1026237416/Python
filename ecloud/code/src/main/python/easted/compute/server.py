# -*- coding: utf-8 -*-
import logging

from oslo_serialization import jsonutils
from tornado import gen
from constant import *
from ast import literal_eval
from common import server_list, Metadata, servers_metadata, \
    check_tenant_quota, create_vm_template, update_tenant_vm_quotas, \
    get_tenant_quota, set_or_update_vm_meta, server_force_delete, del_server_meta, \
    check_image_up_down, get_vms_nics, check_drive_image_up_down
from easted import config
from easted import image as image_module
from easted import network as network_module
from easted.network import check_ip_port_used, get_subnet_ips
from exception import HostUnAvailable, VmNotExist, ServerOperationFailed, ClearUserVmRelationError, MacHasExist, \
    WindowsDriveImageNotExist, DeletePortsFailed
from manor.util.generals import trace
from strategy import get_host_by_stategy
from easted.core import sequence
from easted.core.exception import InvalidateParam, IpsInUsedError, RequiredParamNotExist
from easted.core.task import insert_task_flow, get_expire_task
from easted.volume import volume_create, set_volume_status, \
    set_volume_attach_vm_id, delete_volume, volume_metadata, get_volume_image_metadata, \
    get_drive_image_id
from volumes import list_server_attach_volume, detach_server_volume
from flavor import find_or_create_flavor
from easted.core import dbpools
from easted.identify import get_tenant_by_id, get_user_by_id
from easted.host import get_avilable_host
from easted.core import task
from easted.core.openstack import get_admin_tenant_id
from easted.utils import dict_deep_convert, datetimeUtils
from easted.core.consumer import MessageExecuter

__author__ = 'litao@easted.com.cn'

__all__ = [
    "create_server",
    "list_server",
    "get_server",
    "get_servers_metadata",
    "del_server",
    "Server",
    "list_vm_by_database",
    "set_vm_user",
    "clear_vm_user",
    "check_network",
    "clear_task"
]

config.register("compute.policy", default="1", setting_type=config.TYPE_INT)
config.register("compute.expiration", default="1800", setting_type=config.TYPE_INT)

CONF = config.CONF
LOG = logging.getLogger('system')


class Server(object):
    tenant = str
    host = str
    image = str
    cores = int
    memory = int
    num = int
    size = int
    super_user_pass = str
    network = []
    metadata = Metadata
    userdata = None
    create_policy = int

    def __init__(self, **kwargs):
        self.tenant = kwargs.get("tenant", None)
        self.host = kwargs.get("host", None)
        self.image = kwargs.get("image", None)
        self.userdata = kwargs.get("userdata", None)
        self.cores = kwargs.get("cores", 0)
        self.memory = kwargs.get("memory", 0)
        self.num = kwargs.get("num", 1)
        self.size = kwargs.get("size", 0)
        self.super_user_pass = kwargs.get("super_user_pass", None)
        self.network = kwargs.get("network", [])
        self.metadata = kwargs.get("metadata", {})
        self.create_policy = kwargs.get("create_policy", CONF.compute.policy)


@gen.coroutine
def create_server(vm):
    """ create vm
    :param request: the request of function
    :param vm: VirtualMachine = {"network": [{"vlan": "uuid", "ip": "ip"}],
    "tenant": "uuid", "host": "10.10.3.11", "image": "uuid", "cores": 4,
    "memory": 8,"metadata": {"sys_vloume": {"type": "ssd"}, "user": "uuid",
    "order": "uuid", "extend": {"des": "desc", "keepalive ": 0, "displayname": "sys"}},
    "super_user_pass": "123456"}

    1.自动创建系统盘模板
    2.镜像信息改动
    3.双网卡
    """
    try:

        """check image"""
        task_id = task.gen_task_id()
        nics = []
        image = yield image_module.get_image(vm.image)
        sys_volume_size = vm.size if vm.size and int(vm.size) > int(image['min_disk']) else int(image['min_disk'])
        volume_type = vm.metadata.sys_volume.get('type') or CONF.storage.default_type
        vm.metadata.sys_volume["type"] = volume_type
        is_lvm = volume_type.lower() == "lvm"
        is_iso = 'iso' == image.get("disk_format")
        is_windows = 'windows' == image.get("os").lower()
        message = {"sys_volume_id": "", "drive_volume_id": ""}
        """lvm num must be one"""
        if is_lvm:
            vm.num = 1
        """check quota"""
        total_cores = vm.num * vm.cores
        total_memory = vm.num * vm.memory
        quota = yield check_tenant_quota(vm.tenant, total_cores, total_memory)
        yield update_tenant_vm_quotas(vm.tenant, quota.get("used_cores"), quota.get("used_memorys"))
        """check flavor"""
        flavor = yield find_or_create_flavor(vm.cores, vm.memory, sys_volume_size)

        vm_name = yield sequence.number_seq(VM_SEQUENCE_NAME, VM_SEQUENCE_PREFIX)

        """check available host"""
        host_id = ""
        if vm.host:
            subnet_ids = [network.get('subnet') for network in vm.network]
            avilable_host = yield get_avilable_host(vm.tenant, subnet_ids, total_cores, total_memory, volume_type)
            for host in avilable_host:
                if vm.host == host['name']:
                    host_id = host['id']
            if not host_id:
                raise HostUnAvailable

        """check network unused ip"""
        vlan_name = {}
        for network in vm.network:
            vlan_id = network.get('vlan')
            network_obj = yield network_module.get_network(vlan_id)
            vlan_name[vlan_id] = network_obj.get("name") if network_obj else ""
            subnet_id = network.get('subnet')
            ips = yield network_module.get_tenant_ips(subnet_id, tenant_id=vm.tenant)
            unused = []
            for ip in ips.get("ipavailable"):
                available = yield network_module.gen_ips_list(ip["start"], ip["end"])
                unused.extend(available)
            if len(unused) < vm.num:
                raise IpsInUsedError

        """create vm templates"""
        name_ips = []
        vm_templates = []
        vm_host_used = {}
        availability_zone = None
        for i in xrange(1, vm.num + 1):
            if vm.num > 1:
                name = str(vm_name) + "-" + str(i)
            else:
                name = vm_name

            """select host"""

            host_name = vm.host
            if not vm.host:
                subnet_ids = [network.get('subnet') for network in vm.network]
                avilable_hosts = yield get_avilable_host(vm.tenant, subnet_ids, vm.cores, vm.memory, volume_type,
                                                         vm_host_used)
                select_host = yield get_host_by_stategy(avilable_hosts, vm.create_policy)
                host_name = select_host['name']
                host_id = select_host['id']
                if host_name in vm_host_used:
                    vm_host_used[host_name]['used_cores'] += vm.cores
                    vm_host_used[host_name]['used_memorys'] += vm.memory
                else:
                    vm_host_used[host_name] = {
                        "used_cores": vm.cores,
                        "used_memorys": vm.memory
                    }
            """check network"""
            nics = yield check_network(name, vm.network, vm.tenant, vm.metadata.user, host_id)
            new_nics = []
            ips = []
            for nic in nics:
                ips.append(nic.get('v4-fixed-ip'))
                new_nics.append({
                    "name": vlan_name[nic.get('net-id')],
                    "id": nic.get('net-id'),
                    "ip": nic.get('v4-fixed-ip')
                })
            name_ips.append({
                "name": name,
                "ips": ips
            })
            block_device_mapping_v2 = {"vda": "%s:volume:volume:1:0:disk:" + image.get("disk_bus", "virtio")}
            vm.metadata.sys_volume['size'] = sys_volume_size
            metadata = {
                "user": vm.metadata.user,
                "nics": str(new_nics),
                "sys_volume": str(vm.metadata.sys_volume),
                "extend": str(vm.metadata.extend)
            }
            if is_lvm:
                availability_zone = host_name

            if is_iso:
                block_device_mapping_v2["vda"] = "%s:volume:volume:0:0:cdrom:" + image.get("disk_bus", "virtio")
                block_device_mapping_v2["vdb"] = "%s:volume:volume:1:1:disk:virtio"

                if is_windows:
                    """check drive volume image"""
                    drive_image_id = yield get_drive_image_id()
                    if not drive_image_id:
                        raise WindowsDriveImageNotExist()
                    image_volume = yield check_drive_image_up_down(drive_image_id, availability_zone, volume_type)
                    drive_image_volume_id = image_volume.get("drive_volume")
                    if drive_image_volume_id:
                        """drive volume exist"""
                        message["drive_volume_id"] = drive_image_volume_id
                    else:
                        """create drive volume image"""
                        admin_tenant = yield get_admin_tenant_id()
                        yield volume_create(size=image['min_disk'],
                                            tenant_id=admin_tenant,
                                            snapshot_id=None,
                                            source_volid=None,
                                            name=image_volume.get("name"),
                                            description=3,
                                            volume_type=volume_type,
                                            source_replica=None,
                                            metadata={
                                                "task_id": task_id,
                                                "displayname": image.get("disk_format")
                                            },
                                            project_id=admin_tenant,
                                            image_ref=drive_image_id,
                                            availability_zone=availability_zone)

                    block_device_mapping_v2["vdc"] = "%s:volume:volume:0:2:cdrom:" + image.get("disk_bus", "virtio")

            template = create_vm_template(name=name, image="", host=host_name, tenant=vm.tenant,
                                          userdata=vm.userdata,
                                          flavor=flavor['id'], meta=metadata,
                                          block_device_mapping_v2=block_device_mapping_v2,
                                          nics=nics,
                                          disk_config='AUTO', admin_pass=vm.super_user_pass,
                                          availability_zone="nova:%s:%s" % (host_name, host_name))

            LOG.debug("boot vm task id is %s resource is %s", task_id, name)

            volume = {
                "name": SYS_VOLUME % name,
                "size": str(sys_volume_size),
                "volume_type": volume_type,
                "tenant_id": vm.tenant,
                "availability_zone": availability_zone
            }
            yield insert_task_flow(task_id, "wait creat", name, message,
                                   type=task.VM_CREATE_TYPE, body=template['body'],
                                   resource_url=template['resource_url'], response_key=template['response_key'],
                                   tenant=vm.tenant, image=vm.image, is_iso=is_iso, cores=vm.cores, memory=vm.memory,
                                   host=template['host'],
                                   volume=volume, is_windows=is_windows)

            vm_templates.append(template)

        """check sys volume image"""
        image_volume = yield check_image_up_down(vm.image, availability_zone, volume_type)
        image_sys_volume = image_volume.get("sys_volume")

        if not image_sys_volume:
            """create sys volume image"""
            admin_tenant = yield get_admin_tenant_id()
            yield volume_create(size=image['min_disk'],
                                tenant_id=admin_tenant,
                                snapshot_id=None,
                                source_volid=None,
                                name=image_volume.get("name"),
                                description=3,
                                volume_type=volume_type,
                                source_replica=None,
                                metadata={
                                    "task_id": task_id,
                                    "displayname": image.get("disk_format")
                                },
                                project_id=admin_tenant,
                                image_ref=vm.image,
                                availability_zone=availability_zone)
        else:
            """clone sys volume"""
            for vm_template in vm_templates:
                vm_n = vm_template['body']["server"]["name"]
                volume = {
                    "name": SYS_VOLUME % vm_n,
                    "size": str(sys_volume_size),
                    "volume_type": volume_type,
                    "tenant_id": vm.tenant,
                }
                LOG.debug("create_server create vm sys volume is %s", volume)
                if is_iso:
                    image_sys_volume = None
                yield volume_create(size=volume.get("size"),
                                    tenant_id=volume.get("tenant_id"),
                                    snapshot_id=None,
                                    source_volid=image_sys_volume,
                                    name=volume["name"],
                                    description=str(1),
                                    volume_type=volume['volume_type'],
                                    source_replica=None,
                                    metadata=None,
                                    project_id=volume['tenant_id'],
                                    image_ref=None,
                                    availability_zone=availability_zone)

    except Exception, e:
        LOG.error("create instance error: %s" % e)
        used_quota = yield get_tenant_quota(tenant_id=vm.tenant)
        yield update_tenant_vm_quotas(vm.tenant, used_quota.get("used_cores"), used_quota.get("used_memorys"))
        for nic in nics:
            yield network_module.request_delete_ports(vm.tenant, nic.get("port-id"))
        raise e
    raise gen.Return({"name": vm_name, "name_ips": name_ips})


@gen.coroutine
def del_server_batch(batch):
    vm_info = yield list_server(batch=batch, detailed=True, with_task=False)
    if not vm_info:
        raise VmNotExist(args=['batch', batch])
    for info in vm_info:
        yield del_server(info["id"], delete_volume_ids=list())


@gen.coroutine
def del_server(vm_id_or_name, delete_volume_ids=list()):
    """
    :param vm_id_or_name:
    :param delete_volume_ids: list
    :return:
    """
    if vm_id_or_name.startswith("vm-"):
        server_task = yield task.get_task_flow(resource=vm_id_or_name)
        if server_task:
            server_task = server_task[0]
            task_id = server_task.get("id")
            server_info = server_task["body"]["server"]
            networks = server_info["networks"]
            LOG.debug("vm %s delete task", vm_id_or_name)
            yield task.delete_task_flow(task_id)
            tenant_id = server_task.get('tenant')
            LOG.debug("vm %s free quotas", vm_id_or_name)
            used_quotas = yield get_tenant_quota(tenant_id=tenant_id)
            yield update_tenant_vm_quotas(tenant_id=tenant_id,
                                          used_cores=used_quotas["used_cores"],
                                          used_memory=used_quotas["used_memorys"])
    else:
        try:
            vm = yield get_server(vm_id_or_name, detailed=False)
            for volume_id in delete_volume_ids:
                LOG.debug("delete vm %s  with volume %s set deleting status", vm.get("name"), volume_id)
                yield set_volume_status(volume_id, status='deleting')
            if str(vm.get("vm_state")) != 'error':
                LOG.debug("delete vm %s  set deleting status", vm.get("name"))
                yield set_or_update_vm_meta(vm_id_or_name, meta_key="status", meta_value="deleting")
                attach_volumes = yield list_server_attach_volume(vm_id_or_name, vd_type=0)
                if attach_volumes:
                    for attach_volume in attach_volumes:
                        # if int(attach_volume.get("type")) == TYPE_VDISK:
                        LOG.debug("detach vm %s  with volume %s ", vm.get("name"), attach_volume['volume_id'])
                        yield set_volume_attach_vm_id(attach_volume.get("volume_id"), attach_vm_id=vm_id_or_name)
                        yield detach_server_volume(vm_id_or_name, attach_volume['volume_id'])
                else:
                    LOG.debug("force delete  vm %s ", vm.get("name"))
                    yield server_force_delete(vm_id_or_name)
            else:
                LOG.debug("force delete  vm %s ", vm.get("name"))
                yield server_force_delete(vm_id_or_name)
            try:
                networks = yield get_vms_nics(vm.get("id"))
                for network in networks:
                    port_id = network.get("port_id")
                    yield network_module.request_delete_ports(vm.get("tenant_id"), port_id)
            except Exception as e:
                LOG.error("delete ports error: %s" % e)
                raise DeletePortsFailed
        except Exception as e:
            try:
                yield set_or_update_vm_meta(vm_id_or_name, meta_key="status", meta_value="")
            except Exception as e:
                raise e
            LOG.error("del vm error: %s" % e)


@gen.coroutine
def clear_task():
    LOG.debug("*************************************************")
    LOG.debug("***********    Clear Task  Start   ************")
    LOG.debug("*************************************************")
    try:
        tasks = yield get_expire_task(CONF.compute.expiration)
        for task in tasks:
            pro = jsonutils.loads(task.get("param"))
            if pro.get("type", None) == SCHED_TYPE_ACTIONG_CREATE:
                LOG.error("expires task vm name is %s", task.get("resource"))
                yield del_server(task.get("resource"))

    except Exception, e:
        print e
    LOG.debug("*************************************************")
    LOG.debug("***********    Clear Task  END   ************")
    LOG.debug("*************************************************")


@gen.coroutine
def check_mac(mac):
    try:
        db = dbpools.get_neutron()
        sql = "select id from ports where mac_address = %s"
        cur = yield db.execute(sql, (mac))
        resp = cur.fetchone()
        if resp:
            raise MacHasExist
    except Exception, e:
        LOG.error("check mac error: %s" % e)
        raise e


@gen.coroutine
def check_network(vm_name, vm_network, tenant, user, host_id):
    nics = []
    for network in vm_network:
        vlan = network.get('vlan')
        subnet = network.get('subnet')
        mac = network.get('mac', None)
        yield check_mac(mac)
        ip = network.get("ip")
        ip_selected = False
        if not vlan:
            raise RequiredParamNotExist(args=['vlan'])
        if ip:
            body = {"network_id": vlan, "fixed_ips": [{"subnet_id": subnet, "ip_address": ip}]}
            if mac:
                body["mac_address"] = mac
            try:
                port = yield network_module.request_create_ports(tenant, body)
            except Exception as e:
                LOG.error("create port error ip is %s  %s", ip, e)
            else:
                ip_selected = True
                nics.append({
                    "net-id": vlan,
                    "port-id": port.get("id"),
                    "v4-fixed-ip": ip
                })

        if not ip_selected:
            tenant_ips = yield network_module.get_tenant_ips(subnet, tenant_id=tenant)
            for ips in tenant_ips.get("ipavailable"):
                unused = yield network_module.gen_ips_list(ips["start"], ips["end"])
                if unused:
                    for ip in unused:
                        body = {"network_id": vlan, "fixed_ips": [{"subnet_id": subnet, "ip_address": ip}]}
                        if mac:
                            body["mac_address"] = mac
                        try:
                            port = yield network_module.request_create_ports(tenant, body)
                        except Exception as e:
                            LOG.error("create port error ip is %s  %s", ip, e)
                        else:
                            nics.append({
                                "net-id": vlan,
                                "port-id": port.get("id"),
                                "v4-fixed-ip": ip
                            })
                            break
                    break
                else:
                    raise IpsInUsedError()

    raise gen.Return(nics)


def gen_server_status(vm_state, task_state, control_task_state=None, meta_status=None):
    state = task_state if task_state and vm_state != "error" else vm_state
    if vm_state == VM_STATUS_ERROR:
        state = VM_STATUS_ERROR
    if vm_state == VM_STATUS_BUILD:
        state = VM_STATUS_BUILD
    if state in ["reboot_started", "rebooting_hard", "reboot_started_hard"]:
        state = VM_STATUS_REBOOT
    if state in ["block_device_mapping"]:
        state = VM_STATUS_ERROR
    if state in ["spawning"]:
        state = VM_STATUS_BUILD
    if control_task_state == SCHED_TYPE_ACTIONG_START:
        state = VM_STATUS_WAIT_BOOT
    elif control_task_state == SCHED_TYPE_ACTIONG_REBOOT:
        state = VM_STATUS_WAIT_REBOOT
    if meta_status:
        state = meta_status
    return state


def gen_queue_status(queue_state, queue_type):
    state = None
    if queue_state == SCHED_STATUS_PREPARE \
            and queue_type == SCHED_TYPE_ACTIONG_CREATE:
        state = VM_STATUS_PREPARE
    elif queue_state == SCHED_STATUS_PREPARE_SUCCESS \
            and queue_type == SCHED_TYPE_ACTIONG_CREATE:
        state = VM_STATUS_WAIT_CREATE
    elif queue_state == SCHED_STATUS_PREPARE and queue_type \
            in [SCHED_TYPE_ACTIONG_START, SCHED_TYPE_ACTIONG_REBOOT]:
        state = VM_STATUS_WAIT_BOOT
    elif queue_state == SCHED_STATUS_PREPARE_FAIL:
        state = VM_STATUS_ERROR
    elif queue_state == SCHED_STATUS_RUNNING:
        state = VM_STATUS_BUILD
    return state


@gen.coroutine
def get_servers_metadata(vm_ids=None):
    """
    :param vm_ids: list or str
    :return:
    vm_ids : list
    {
        vm_id:{
            mate_key:mate_val,
            ...
        },
        ...
    }

    vm_ids : str
    {
        mate_key:mate_val,
        ...
    }
    """
    if not vm_ids:
        raise InvalidateParam(args=["vm_ids"])
    meta = {}
    servers_meta = yield servers_metadata(vm_ids)
    for meta_item in servers_meta:
        if meta_item["server_id"] not in meta:
            meta[meta_item["server_id"]] = {}
        try:
            meta[meta_item["server_id"]][meta_item["meta_key"]] = eval(meta_item["meta_value"])
        except Exception, e:
            meta[meta_item["server_id"]][meta_item["meta_key"]] = meta_item["meta_value"]
    if isinstance(vm_ids, basestring):
        meta = meta[vm_ids]
    raise gen.Return(meta)


def tarce():
    pass


@gen.coroutine
def list_server(vm_ids=None, tenant_ids=None, vlan_id=None, subnet_id=None, hosts=None, user_ids=None,
                batch=None, detailed=True, with_task=True):
    """
    :param vlan_id:
    :param subnet_id:
    :param vm_ids:
    :param tenant_ids:
    :param hosts:
    :param user_ids:
    :param batch:
    :param detailed:
    :param with_task:
    :return:
    """
    vm_ips = []
    if subnet_id:
        subnet_ips = yield get_subnet_ips(subnet_id)
        vm_ips = [subnet["ip"] for subnet in subnet_ips["ipused"]]
    out_servers = []
    servers = yield server_list(server_ids=vm_ids, tenant_ids=tenant_ids, hosts=hosts, user_ids=user_ids,
                                batch=batch)
    servers = sorted(servers, key=lambda d: (
        int(d["name"].split("-")[1]), int(d["name"].split("-")[2]) if len(d["name"].split("-")) > 2 else 0),
                     reverse=True)
    servers_name = [server_item["name"] for server_item in servers]
    all_tasks = yield task.get_task_flow()
    servers_task = []
    vm_control_task = []
    vm_control_task_dict = {}
    for t_obj in all_tasks:
        status = t_obj.get("status")
        task_type = t_obj.get("type")
        if task_type == SCHED_TYPE_ACTIONG_CREATE \
                and status < SCHED_STATUS_RUN_SUCCESS:
            servers_task.append(t_obj)
        elif task_type in (SCHED_TYPE_ACTIONG_START, SCHED_TYPE_ACTIONG_REBOOT) \
                and status < SCHED_STATUS_RUNNING:
            vm_control_task.append(t_obj)
    if with_task:
        # servers_task = yield task.get_task_flow(type=0)
        if not servers and not servers_task:
            raise gen.Return(out_servers)
    else:
        if not servers:
            raise gen.Return(out_servers)
    if not vm_ids:
        vm_ids = [server_item["id"] for server_item in servers]

    for c_task_item in vm_control_task:
        vm_control_task_dict[c_task_item["resource"]] = c_task_item["type"]

    meta = {}
    network_nics = {}
    if detailed:
        network_nics = yield get_vms_nics()
        servers_meta = yield servers_metadata(vm_ids)
        for meta_item in servers_meta:
            if meta_item["server_id"] in meta:
                try:
                    meta[meta_item["server_id"]][meta_item["meta_key"]] = eval(meta_item["meta_value"])
                except Exception, e:
                    meta[meta_item["server_id"]][meta_item["meta_key"]] = meta_item["meta_value"]
            else:
                meta[meta_item["server_id"]] = {}
                try:
                    meta[meta_item["server_id"]][meta_item["meta_key"]] = eval(meta_item["meta_value"])
                except Exception, e:
                    meta[meta_item["server_id"]][meta_item["meta_key"]] = meta_item["meta_value"]
    for server_item in servers:
        user = {}
        if server_item.get("user_id", None):
            try:
                user_obj = yield get_user_by_id(server_item.get("user_id"))
                user = {
                    "id": user_obj["id"],
                    "name": user_obj["name"],
                    "display_name": user_obj["displayname"]
                }
            except BaseException as e:
                LOG.error("get user by id error, id is %s ",server_item.get("user_id"))
                LOG.error(trace())

        server_id = server_item.get("id")
        vm_control_state = vm_control_task_dict.get(server_id)
        meta_item = meta.get(server_id, {})
        meta_status = meta_item.get("status", "")

        # 检查status状态为uploading时，查看镜像是否创建完成，如果完成删除云主机uploading状态。
        if meta_status == VM_STATUS_UPLOAD:
            upt_image_id = meta_item["upt_image_id"]
            image_info = yield image_module.get_image(upt_image_id)
            if image_info and image_info["status"] == "active":
                yield del_server_meta(server_id, ["status", "upt_image_id"])
                meta_status = None

        status = gen_server_status(server_item["vm_state"], server_item["task_state"], vm_control_state, meta_status)
        tenant = yield get_tenant_by_id(server_item["tenant_id"])
        network = {}
        networks = []
        try:
            flag_vlan = True
            flag_subnet = True
            networks = network_nics.get(server_id)
            for network_item in networks:
                if vlan_id and vlan_id == network_item['id']:
                    flag_vlan = False
                if subnet_id and network_item["ip"] in vm_ips:
                    flag_subnet = False
                if network_item["name"] not in network:
                    network[network_item["name"]] = []
                network[network_item["name"]].append(network_item["ip"])
        except Exception:
            network = {}
        if vlan_id and flag_vlan:
            continue
        if subnet_id and flag_subnet:
            continue
        extend = meta_item.get("extend", {})
        recover_status = meta_item.get("recover_status", "")
        out_servers.append({
            "displayname": extend.get("displayname", ""),
            "host": {
                "ip": server_item.get("host_ip"),
                "id": server_item.get("host_id"),
                "name": server_item.get("host_name")
            },
            "user": user,
            "id": server_id if status != "deleting" else "",
            "tenant": tenant,
            "network": network,
            "network_info": networks,
            "name": server_item.get("name"),
            "des": extend.get("des", ""),
            "state": status,
            "recover-status": recover_status,
            "memory_mb": server_item.get("memory"),
            "cores": server_item.get("cores"),
            "keepalive": extend.get("keepalive", ""),
            "host_status": "available" if server_item.get("host_heatbeat") <= 60 else "unavailable",
            "service_status": "unavailable" if server_item.get("service_disabled") else "available",
        })

    if with_task:
        for task_item in servers_task:
            info = dict_deep_convert(task_item)
            state = gen_queue_status(info["status"], info["type"])
            availability_zone = info.get("availability_zone")
            tenant_id = info.get("tenant")
            host = availability_zone.split(":")[-1]
            user_id = info.get("user")
            info_name = info.get("name")
            if tenant_ids and isinstance(tenant_ids, list) and tenant_id not in tenant_ids:
                continue
            elif tenant_ids and isinstance(tenant_ids, basestring) and tenant_id != tenant_ids:
                continue
            if hosts and isinstance(hosts, list) and host not in hosts:
                continue
            elif hosts and isinstance(hosts, basestring) and host != hosts:
                continue
            if user_ids and isinstance(user_ids, list) and user_id not in user_ids:
                continue
            elif user_ids and isinstance(user_ids, basestring) and user_id != user_ids:
                continue
            if batch and batch not in info_name:
                continue
            extend = literal_eval(info["extend"])
            networks_info = literal_eval(info.get("nics"))
            networks = {}
            flag_vlan = True
            flag_subnet = True
            for network_item in networks_info:
                if vlan_id and vlan_id == network_item['id']:
                    flag_vlan = False
                if subnet_id and network_item["ip"] in vm_ips:
                    flag_subnet = False
                if network_item["name"] not in networks:
                    networks[network_item["name"]] = []
                networks[network_item["name"]].append(network_item["ip"])
            if vlan_id and flag_vlan:
                continue
            if subnet_id and flag_subnet:
                continue
            tenant = yield get_tenant_by_id(tenant_id)
            if info_name and info_name not in servers_name:
                out_servers.insert(0, {
                    "displayname": extend.get("displayname"),
                    "host": {
                        "ip": "",
                        "id": "",
                        "name": host
                    },
                    "user": info.get("user", ""),
                    "id": "",
                    "tenant": tenant,
                    "network": networks,
                    "network_info": networks_info,
                    "name": info.get("name"),
                    "des": extend.get("des"),
                    "state": state,
                    "recover-status": "",
                    "memory_mb": info.get("memory"),
                    "cores": info.get("cores"),
                    "keepalive": extend.get("keepalive", "")
                })

    raise gen.Return(out_servers)


@gen.coroutine
def get_server(vm_id=None, name=None, detailed=True):
    """
    :param vm_id:
    :param name:
    :param detailed:
    :return:
    """
    if not vm_id and not name:
        raise InvalidateParam(args=['vm_id, vm_name'])
    server = yield server_list(server_ids=vm_id, names=name)
    if not server:
        raise gen.Return({})
    else:
        server = server[0]  # 取云主机的ID
    if not detailed:
        raise gen.Return(server)
    if not vm_id and server:
        vm_id = server.get("id")
    server_meta = yield servers_metadata(vm_id)
    meta = {}
    for meta_item in server_meta:
        try:
            meta[meta_item["meta_key"]] = literal_eval(meta_item["meta_value"])
        except Exception, e:
            meta[meta_item["meta_key"]] = meta_item["meta_value"]

    tenant = yield get_tenant_by_id(server["tenant_id"])
    user = {}
    if meta.get("user", None):
        try:
            user_obj = yield get_user_by_id(meta["user"])
            user = {
                "id": user_obj["id"],
                "name": user_obj["name"],
                "display_name": user_obj["displayname"]
            }
        except Exception:
            pass

    network = {}
    try:
        networks = yield get_vms_nics(vm_id)
        for network_item in networks:
            if network_item["name"] not in network:
                network[network_item["name"]] = []
            network[network_item["name"]].append(network_item["ip"])
    except Exception:
        networks = []
        network = {}
    vm_tasks = yield task.get_task_flow(resource=vm_id)
    vm_contorl_task_status = None
    for vm_tasks_item in vm_tasks:
        status = vm_tasks_item.get("status")
        task_type = vm_tasks_item.get("type")
        if task_type in (SCHED_TYPE_ACTIONG_START, SCHED_TYPE_ACTIONG_REBOOT) \
                and status < SCHED_STATUS_RUNNING:
            vm_contorl_task_status = vm_tasks_item["type"]
    meta_status = meta.get("status", "")
    status = gen_server_status(server["vm_state"], server["task_state"],
                               control_task_state=vm_contorl_task_status, meta_status=meta_status)
    extend = meta.get("extend", {})
    recover_status = meta.get("recover_status", "")

    sys_volume = yield list_server_attach_volume(vm_id, vd_type=1)
    image_meta = {}
    if sys_volume:
        sys_volume_id = sys_volume[0]['volume_id']
        image_meta = yield get_volume_image_metadata(sys_volume_id)

    out_server = {
        "displayname": extend.get("displayname", ""),
        "host": {
            "ip": server.get("host_ip"),
            "id": server.get("host_id"),
            "name": server.get("host_name")
        },
        "user": user,
        "id": server["id"],
        "tenant": tenant,
        "network": network,
        "network_info": networks,
        "name": server.get("name"),
        "des": extend.get("des", ""),
        "state": status,
        "recover-status": recover_status,
        "memory_mb": server.get("memory"),
        "cores": server.get("cores"),
        "keepalive": extend.get("keepalive", ""),
        "sys_volume": meta.get("sys_volume", ""),
        "image": image_meta,
        "created_at": datetimeUtils.time2epoch(server.get("created_at"))
    }
    raise gen.Return(out_server)


@gen.coroutine
def list_vm_by_database(**kwargs):
    """
    :param kwargs: 查询条件   key：数据库nova中instances表中存在字段
    :return: vm列表
    """
    db = dbpools.get_pool(dbpools.NOVA_DB)
    sql_con = ''
    if kwargs:
        for item in kwargs:
            sql_con += " and " + item + " = '%s'" % kwargs.get(item)
    sql_select = """select uuid, id, hostname as name, display_name as displayname,
                          display_description as description, user_id as uesr,
                          project_id as tenant, memory_mb, vcpus,  host,
                          vm_state as state, task_state
                        from instances where 1 = 1 %s""" % sql_con
    try:
        cur = yield db.execute(sql_select)
        vms = cur.fetchall()
    except Exception as e:
        LOG.error("Get hosts info error: %s" % e)
        raise e
    raise gen.Return(vms)


@gen.coroutine
def set_vm_user(vm_id, user_id):
    try:
        yield set_or_update_vm_meta(vm_id=vm_id, meta_key='user', meta_value=user_id)
    except Exception, e:
        LOG.error("set vm user error: %s" % e)
        raise ServerOperationFailed()


@gen.coroutine
def clear_vm_user(tenant_id, user_id):
    try:
        vms = yield list_server(tenant_ids=tenant_id, user_ids=user_id, detailed=False, with_task=False)
        for vm in vms:
            vm_id = vm.get("id")
            yield set_vm_user(vm_id, "")
        LOG.info("clear vm user %s success", user_id)
    except Exception, e:
        LOG.error("clear vm user error: %s" % e)
        raise ClearUserVmRelationError()


class DelDiskAfterDetachEndExecuter(MessageExecuter):
    def event(self):
        return "volume.detach.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        raise gen.Return(True)

    @gen.coroutine
    def execute(self):
        try:
            volume_id = self._message.get('volume_id')
            metas = yield volume_metadata([volume_id])
            volume_meta = {}
            for item in metas:
                if item["meta_key"] not in volume_meta:
                    volume_meta[item["meta_key"]] = {}
                volume_meta[item["meta_key"]] = item["meta_value"]
            if volume_meta.get("status") and str(volume_meta.get("status")) == "deleting":
                LOG.debug("delete detached volume %s ", volume_id)
                yield delete_volume(volume_id)
            vm_id = volume_meta.get("attach_vm_id", "")
            if not vm_id:
                return
            attach_volumes = yield list_server_attach_volume(vm_id)
            if not attach_volumes:
                vm_meta = yield get_servers_metadata(vm_ids=vm_id)
                if vm_meta.get("status") and str(vm_meta.get("status")) == "deleting":
                    LOG.debug("force delete  vm %s ", vm_id)
                    yield server_force_delete(vm_id)
        except Exception, e:
            LOG.error("delele disk error %s" % e)


class DelVmEndExecuter(MessageExecuter):
    def event(self):
        return "compute.instance.delete.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        raise gen.Return(True)

    @gen.coroutine
    def execute(self):
        try:
            name = self._message.get("hostname")
            status = self._message.get("state")
            LOG.debug("vm  %s  delete  end  free networks , quotas  status is %s ", name, status)
            tenant_id = self._message.get('tenant_id')
            used_quotas = yield get_tenant_quota(tenant_id=tenant_id)
            yield update_tenant_vm_quotas(tenant_id=tenant_id,
                                          used_cores=used_quotas["used_cores"],
                                          used_memory=used_quotas["used_memorys"])
        except Exception, e:
            LOG.error("delele disk error %s" % e)


from easted.utils import timeit


@gen.coroutine
@timeit
def main():
    pass
    # stat_data = yield stat_server()
    # print stat_data


if __name__ == "__main__":
    from tornado import ioloop

    ioloop.IOLoop.current().run_sync(main)
