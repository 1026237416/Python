# -*- coding: utf-8 -*-
import logging

import datetime
import six
import base64

from volumes import list_server_attach_volume
from easted.image import get_image
from easted.utils import encodeutils, trace
from tornado import gen
from easted.core.consumer import MessageExecuter
from easted.utils import jsonutils as simplejson
from easted import network as network_module

try:
    import json
except ImportError:
    import simplejson as json
try:
    from urllib import urlencode
except ImportError:
    from urllib.parse import urlencode

from easted import config
import easted.core.openstack as os
from easted.core import dbpools
from easted.utils import required
from easted.identify import update_quota_used, QUOTA_NAMES, check_quota
from easted.core.exception import RequiredParamNotExist
from exception import ServerOperationFailed, SetServerMetaError, ServerListFailed, \
    OnlyOneIpTypeError
from easted.volume import list_volume, delete_volume, volume_create, get_metadata, volume_list, volume_delete, \
    get_volume_image_metadata, update_volume_image_metadata, get_drive_image_id
from easted.utils.cacheUtils import eval_val
from easted.core import task
from easted.core import openstack
from easted.utils import jsonutils
from constant import *

config.register("compute.max_booting", default="5", setting_type=config.TYPE_INT)
config.register("compute.boot_interval", default="120", setting_type=config.TYPE_INT)
CONF = config.CONF

SYS_VOLUME_IMAGE = "ecloud-sys-volume-image-%s"
DRIVE_VOLUME_IMAGE = "ecloud-drive-volume-image-%s"

__author__ = 'yangkefeng@easted.com.cn'
LOG = logging.getLogger("system")

__all__ = ["Metadata",
           "server_request",
           "server_action",
           "live_migrate_request",
           "server_list",
           "server_delete",
           "server_force_delete",
           "server_restore",
           "update_server",
           "get_tenant_quota",
           "update_tenant_vm_quotas",
           "add_server_meta",
           "del_meta",
           "del_server_meta",
           "get_server_metas",
           "update_server_meta",
           "vm_set_meta_item",
           "servers_metadata",
           "set_or_update_vm_meta",
           "create_reboot_start_schedule",
           "server_state_count",
           "get_vms_nics"
           ]


class Metadata(object):
    user = str
    order = str
    image = str
    sys_volume = dict
    extend = dict

    def __init__(self, **kwargs):
        self.user = kwargs.get("user", "")
        self.order = kwargs.get("order", "")
        self.image = kwargs.get("image", "")
        self.sys_volume = kwargs.get("sys_volume", {})
        self.extend = kwargs.get("extend", {})

    @property
    def metadata(self):
        return {"user": self.user, "order": self.order, "image": self.image,
                "sys_volume": str(self.sys_volume.__dict__ if self.sys_volume else self.sys_volume),
                "extend": str(self.extend.__dict__ if self.extend else self.extend)}


class Control(object):
    START = "os-start"
    STOP = 'os-stop'
    REBOOT = 'reboot'


@gen.coroutine
def server_request(request_url, tenant_id=None,
                   response_key="servers",
                   method=os.METHOD_GET,
                   request_body=None):
    """ volume async request decorators
    :param request_url: the action url of handle volume
    :param tenant_id: the id of tenant, default None
    :param response_key: the key of response: volume or volumes
    :param method: request method: get, post, delete, put
    :param request_body: request body: A dict
    :return:
    """
    session = yield os.get_session(tenant=tenant_id)
    result = yield os.connect_request(session=session, type=os.TYPE_COMPUTE,
                                      method=method, url=request_url,
                                      response_key=response_key, body=request_body)
    raise gen.Return(result)


@gen.coroutine
def server_action(vm_id, action, info=None):
    """  Perform a server "action" -- reboot/rebuild/resize/etc.
    :param vm_id: id of vm to action
    :param action: reboot/rebuild/resize/etc.
    :param info:
    :return:
    """
    try:
        body = {action: info}
        url = "/servers/%s/action" % vm_id
        ret = yield server_request(request_url=url,
                                   request_body=body,
                                   method=os.METHOD_POST,
                                   response_key="server")
    except Exception, e:
        LOG.error("server action error: %s" % e)
        raise ServerOperationFailed()
    raise gen.Return(ret)


@gen.coroutine
def server_list(server_ids=None, tenant_ids=None, names=None, hosts=None, user_ids=None, batch=None):
    """
    :param server_ids:
    :param tenant_ids:
    :param hosts:
    :param user_ids:
    :param batch:
    :param names:
    :return:
    """
    try:
        params = []
        db = dbpools.get_pool(dbpools.NOVA_DB)
        sql = "SELECT vm.uuid as id, vm.vm_state, vm.task_state, vm.power_state, " \
              "vm.project_id as tenant_id, vm.created_at, vm.display_name as name, " \
              "vm.display_description as des, vm.memory_mb as memory, im.value as user_id, " \
              "vm.vcpus as cores, cn.host_ip, cn.id as host_id, cn.host as host_name, " \
              "cn.disabled as service_disabled, cn.heatbeat as host_heatbeat " \
              "FROM (SELECT uuid, vm_state, task_state, power_state, project_id, " \
              "created_at, display_name, display_description, memory_mb, vcpus, host " \
              "FROM instances WHERE deleted=0 and vm_state!='soft-delete') vm " \
              "left join (SELECT a.id, a.host, a.host_ip, b.disabled, " \
              "TIMESTAMPDIFF(SECOND,a.updated_at,UTC_TIMESTAMP()) as heatbeat from compute_nodes as a, " \
              "services as b where a.service_id = b.id) cn on cn.host = vm.host " \
              "left join (SELECT tm.key, tm.value, tm.instance_uuid " \
              "FROM instance_metadata tm WHERE tm.key='user') im on vm.uuid=im.instance_uuid "
        sql += " WHERE 1=1 "
        if user_ids and isinstance(user_ids, list):
            sql += " and  im.value in %s "
            params.append(tuple(user_ids))
        elif user_ids and isinstance(user_ids, basestring):
            sql += " and im.value=%s "
            params.append(user_ids)

        if names and isinstance(names, list):
            sql += " and  vm.display_name in %s "
            params.append(tuple(names))
        elif names and isinstance(names, basestring):
            sql += " and vm.display_name=%s "
            params.append(names)

        if tenant_ids and isinstance(tenant_ids, list):
            sql += " and vm.project_id in %s "
            params.append(tuple(tenant_ids))
        elif tenant_ids and isinstance(tenant_ids, basestring):
            sql += " and vm.project_id=%s "
            params.append(tenant_ids)

        if hosts and isinstance(hosts, list):
            sql += " and vm.host in %s "
            params.append(tuple(hosts))
        elif hosts and isinstance(hosts, basestring):
            sql += " and vm.host=%s "
            params.append(hosts)

        if batch:
            sql += " and (vm.display_name=%s or vm.display_name like %s)"
            params.append(batch)
            params.append(batch + "-%")

        if server_ids and isinstance(server_ids, list):
            sql += " and vm.uuid in %s "
            sql += " order by vm.created_at desc"
            params.append(tuple(server_ids))
        elif server_ids and isinstance(server_ids, basestring):
            sql += " and vm.uuid=%s "
            params.append(server_ids)
        else:
            sql += " order by vm.created_at desc"
        cur = yield db.execute(sql, params)
        servers = cur.fetchall()
    except Exception, e:
        LOG.error("list servers from db error: %s" % e)
        raise ServerListFailed()
    raise gen.Return(servers)


@gen.coroutine
def servers_metadata(vm_ids):
    """
    :param vm_ids: list
    :return:
    """
    if isinstance(vm_ids, basestring):
        vm_ids = [vm_ids]
    if not vm_ids:
        raise gen.Return([])
    params = []
    try:
        db = dbpools.get_pool(dbpools.NOVA_DB)
        sql = "SELECT im.instance_uuid as server_id, im.key as meta_key, im.value as meta_value " \
              "FROM instance_metadata im WHERE deleted=0 and im.instance_uuid "
        if isinstance(vm_ids, basestring):
            sql += " =%s "
            params.append(vm_ids)
        else:
            sql += " in %s "
            params.append(tuple(vm_ids))
        cur = yield db.execute(sql, params)
        metadatas = cur.fetchall()
    except Exception, e:
        LOG.error("instance metadata error: %s" % e)
        raise e
    raise gen.Return(metadatas)


@gen.coroutine
def server_state_count():
    try:
        db = dbpools.get_pool(dbpools.NOVA_DB)
        sql = "SELECT count(id) count, vm_state state " \
              "FROM instances WHERE vm_state='active' or vm_state='stopped' group by vm_state"
        cur = yield db.execute(sql)
        rst = cur.fetchall()
    except Exception, e:
        LOG.error("Server state count error: %s" % e)
        raise e
    raise gen.Return(rst)


@gen.coroutine
def server_delete(vm_id):
    """
    delete a server.
    :param vm_id: id of server to get
    :return
    """
    try:
        server = yield server_request(request_url="/servers/%s" % vm_id,
                                      response_key="server",
                                      method=os.METHOD_DELETE)
    except Exception, e:
        LOG.error("delete server error: %s" % e)
        raise ServerOperationFailed()
    raise gen.Return(server)


@gen.coroutine
def delete_instance_info(vm_id):
    try:
        db = dbpools.get_pool(dbpools.NOVA_DB)
        sql = "update instances set deleted=1, updated_at=utc_timestamp(), deleted_at=utc_timestamp(), vm_state='deleted' where uuid=%s"
        yield dbpools.update(db, sql, [vm_id])
    except Exception, e:
        LOG.error("delete server error: %s" % e)
        raise ServerOperationFailed()


@gen.coroutine
def server_force_delete(vm_id):
    """
    force delete a server.
    :param vm_id: id of server to get
    :return
    """
    try:
        server = yield server_action(vm_id, "forceDelete")
    except Exception, e:
        LOG.error("force delete server error: %s" % e)
        raise ServerOperationFailed()
    finally:
        servers = yield server_list(server_ids=vm_id)
        if servers and servers[0].get("vm_state") == VM_STATUS_ERROR:
            server = servers[0]
            vd_name = "ecloud-sys-volume-%s" % server["name"]
            sys_vds = yield list_volume(detailed=False, name=vd_name, vd_type=1)
            if sys_vds:
                sys_vd_id = sys_vds[0]["id"]
                yield delete_volume(sys_vd_id)
            yield delete_instance_info(vm_id)
            yield task.delete_task_flow_by_resource(server["name"])
    raise gen.Return(server)


@gen.coroutine
def server_restore(vm_id):
    """
    restore a server.

    :param vm_id: id of server to get
    :return
    """
    ret = yield server_action(vm_id, "restore")
    raise gen.Return(ret)


@gen.coroutine
def live_migrate_request(vm_id, destination_host):
    """
    Migrates a running instance to a new machine.

    :param vm_id: instance id which comes from nova list.
    :param destination_host: destination host name.

    """
    yield server_action(vm_id=vm_id, action='os-migrateLive',
                        info={'host': destination_host,
                              'block_migration': False,
                              'disk_over_commit': False})


def __gen_server_network(server_network):
    def __filter_ip(ips):
        return [ip['addr'] for ip in ips]

    network = {}
    if server_network:
        network = {k: __filter_ip(v)
                   for k, v in server_network.iteritems()}

    return network


@gen.coroutine
def update_server(vm_id, metadata):
    """ update instance
    :param vm_id: id of vm
    :param metadata: VMMetadata
    """
    metas = yield servers_metadata(vm_ids=vm_id)
    server_meta = {}
    for item in metas:
        try:
            server_meta[item["meta_key"]] = eval(item["meta_value"])
        except Exception, e:
            server_meta[item["meta_key"]] = item["meta_value"]
    if not server_meta:
        extend = metadata.metadata
    else:
        old_display_name = server_meta["extend"]["displayname"]
        old_des = server_meta["extend"]["des"]
        new_display_name = metadata.extend["displayname"]
        new_des = metadata.extend["des"]
        extend = {"displayname": new_display_name if new_display_name else old_display_name,
                  "des": new_des,
                  "keepalive": metadata.extend["keepalive"]}
    new_meta = yield update_server_meta(vm_id, "extend", extend)
    raise gen.Return(new_meta)


@gen.coroutine
@required("tenant_id")
def update_tenant_vm_quotas(tenant_id, used_cores, used_memory):
    """ update tenant 's quotas of vm
    :param tenant_id: id of tenant
    :param used_cores: current cores usage
    :param used_memory; current memory usage
    """
    if used_cores is not None:
        yield update_quota_used(tenant_id=tenant_id,
                                name=QUOTA_NAMES.cores,
                                used=used_cores)
    if used_memory is not None:
        yield update_quota_used(tenant_id=tenant_id,
                                name=QUOTA_NAMES.memory,
                                used=used_memory)


@gen.coroutine
def check_tenant_quota(tenant_id, core, memory):
    """ get tenant quota set
    :param memory:
    :param core:
    :param tenant_id: id of tenant
    """
    quotas = {"used_cores": core, "used_memorys": memory}
    used_quota = yield get_tenant_quota(tenant_id=tenant_id)
    quotas['used_cores'] += used_quota.get('used_cores')
    quotas['used_memorys'] += used_quota.get('used_memorys')
    yield check_quota(tenant_id, QUOTA_NAMES.cores, quotas['used_cores'])
    yield check_quota(tenant_id, QUOTA_NAMES.memory, quotas['used_memorys'])
    raise gen.Return(quotas)


@gen.coroutine
@required("tenant_id")
def get_tenant_quota(tenant_id):
    """ get tenant quota set
    :param tenant_id: id of tenant
    """
    try:
        db = dbpools.get_nova()
        sql = "select  IFNULL(sum(memory_mb),0)  as used_memorys , IFNULL(sum(vcpus),0)  as used_cores  from instances where deleted = 0 and vm_state != 'soft-delete' and  project_id = %s "
        cur = yield db.execute(sql, (tenant_id))
        used_quotas = cur.fetchone()
    except Exception, e:
        LOG.error("list tenant's quota error: %s" % e)
        raise e
    raise gen.Return(used_quotas)


@gen.coroutine
def vm_set_meta_item(vm_id, k, v):
    try:
        url = '/servers/%s/metadata/%s' % (vm_id, k)
        body = {'meta': {k: v}}
        session = yield os.get_session()
        yield os.connect_request(session=session, type=os.TYPE_COMPUTE, url=url,
                                 method=os.METHOD_PUT, body=body)
    except Exception, e:
        LOG.error("reboot vm  error: %s" % e)
        raise SetServerMetaError()


@gen.coroutine
def del_meta(vm_id, keys):
    try:
        session = yield os.get_session()
        for k in keys:
            url = "/servers/%s/metadata/%s" % (vm_id, k)
            yield os.connect_request(session=session, type=os.TYPE_COMPUTE, url=url,
                                     method=os.METHOD_DELETE)
    except Exception, e:
        LOG.error("reboot vm  error: %s" % e)
        raise SetServerMetaError()


@gen.coroutine
def add_server_meta(vm_id, **meta):
    """ add meta to instance
    :param vm_id: id of vm
    :param meta: {}
    """
    try:
        if not vm_id:
            raise RequiredParamNotExist(args=['vm_id'])
        if not meta:
            raise RequiredParamNotExist(args=['meta'])

        if isinstance(meta, dict):
            for k, v in meta.items():
                yield vm_set_meta_item(vm_id, k, str(v))

    except Exception, e:
        LOG.error("add meta to instance error: %s" % e)
        raise SetServerMetaError()


@gen.coroutine
def del_server_meta(vm_id, meta_keys):
    """ del meta from instance
    :param vm_id: id of vm
    :param meta_keys: A list of metadata keys to delete from the server
    """
    try:
        if not vm_id:
            raise RequiredParamNotExist(args=['vm_id'])
        if not meta_keys:
            raise RequiredParamNotExist(args=['meta_keys'])

        if isinstance(meta_keys, (list, tuple)):
            yield del_meta(vm_id, meta_keys)
    except Exception, e:
        LOG.error("del meta from instance error: %s" % e)
        raise SetServerMetaError()


@gen.coroutine
def get_server_metas(vm_id):
    """
    :param vm_id:
    :return:
    """
    if not vm_id:
        raise RequiredParamNotExist(args=['vm_id'])
    metas = yield servers_metadata(vm_id)
    metadata = {}
    for meta in metas:
        metadata[meta["meta_key"]] = meta["meta_value"]
    raise gen.Return(metadata)


@gen.coroutine
def update_server_meta(vm_id, meta_key, meta_val):
    """ update meta from instance
    :param vm_id: id of vm
    :param meta_key: A metadata key to update from the server
    :param meta_val: A metadata val to update from the server
    """
    try:
        if not vm_id:
            raise RequiredParamNotExist(args=['vm_id'])
        if not meta_key:
            raise RequiredParamNotExist(args=['meta_key'])

        url = '/servers/%s/metadata/%s' % (vm_id, meta_key)
        body = {'meta': {meta_key: str(meta_val)}}
        session = yield os.get_session()
        server_meta = yield os.connect_request(session=session, type=os.TYPE_COMPUTE, url=url,
                                               method=os.METHOD_PUT, body=body)
    except Exception as e:
        LOG.error("update instance meta error: %s" % e)
        raise SetServerMetaError()
    else:
        metadata = {k: eval_val(v) for k, v in server_meta['meta'].items()}

    raise gen.Return(metadata)


@gen.coroutine
def set_or_update_vm_meta(vm_id, meta_key, meta_value):
    """
        if meta_key in metadata, update the value of meta_key
        else update metadata with  meta_key, meta_value
    """
    vm_metadata = yield get_server_metas(vm_id)
    if meta_key in vm_metadata:
        yield update_server_meta(vm_id, meta_key=meta_key, meta_val=str(meta_value))
    else:
        yield vm_set_meta_item(vm_id, k=str(meta_key), v=str(meta_value))


def create_vm_template(name, image, flavor, host, meta=None, files=None,
                       reservation_id=None, min_count=None,
                       max_count=None, security_groups=None, userdata=None,
                       key_name=None, availability_zone=None,
                       block_device_mapping=None, block_device_mapping_v2=None,
                       nics=None, scheduler_hints=None,
                       config_drive=None, disk_config=None, admin_pass=None, **kwargs):
    if not min_count:
        min_count = 1
    if not max_count:
        max_count = min_count
    if min_count > max_count:
        min_count = max_count

    if block_device_mapping or block_device_mapping_v2:
        resource_url = "/os-volumes_boot"
    else:
        resource_url = "/servers"

    response_key = "server"

    body = {"server": {
        "name": name,
        "imageRef": image if image else '',
        "flavorRef": flavor,
    }}
    if userdata:
        if hasattr(userdata, 'read'):
            userdata = userdata.read()

        if six.PY3:
            userdata = userdata.encode("utf-8")
        else:
            userdata = encodeutils.safe_encode(userdata)

        userdata_b64 = base64.b64encode(userdata).decode('utf-8')
        body["server"]["user_data"] = userdata_b64
    if meta:
        body["server"]["metadata"] = meta
    if reservation_id:
        body["server"]["reservation_id"] = reservation_id
    if key_name:
        body["server"]["key_name"] = key_name
    if scheduler_hints:
        body['os:scheduler_hints'] = scheduler_hints
    if config_drive:
        body["server"]["config_drive"] = config_drive
    if admin_pass:
        body["server"]["adminPass"] = admin_pass
    if not min_count:
        min_count = 1
    if not max_count:
        max_count = min_count
    body["server"]["min_count"] = min_count
    body["server"]["max_count"] = max_count

    if security_groups:
        body["server"]["security_groups"] = [{'name': sg}
                                             for sg in security_groups]

    # Files are a slight bit tricky. They're passed in a "personality"
    # list to the POST. Each item is a dict giving a file name and the
    # base64-encoded contents of the file. We want to allow passing
    # either an open file *or* some contents as files here.
    if files:
        personality = body['server']['personality'] = []
        for filepath, file_or_string in sorted(files.items(),
                                               key=lambda x: x[0]):
            if hasattr(file_or_string, 'read'):
                data = file_or_string.read()
            else:
                data = file_or_string

            if six.PY3 and isinstance(data, str):
                data = data.encode('utf-8')
            cont = base64.b64encode(data).decode('utf-8')
            personality.append({
                'path': filepath,
                'contents': cont,
            })

    if availability_zone:
        body["server"]["availability_zone"] = availability_zone

    # Block device mappings are passed as a list of dictionaries
    if block_device_mapping:
        body['server']['block_device_mapping'] = block_device_mapping
    elif block_device_mapping_v2:
        body['server']['block_device_mapping_v2'] = block_device_mapping_v2

    if nics is not None:
        # NOTE(tr3buchet): nics can be an empty list
        all_net_data = []
        for nic_info in nics:
            net_data = {}
            # if value is empty string, do not send value in body
            if nic_info.get('net-id'):
                net_data['uuid'] = nic_info['net-id']
            if (nic_info.get('v4-fixed-ip') and
                    nic_info.get('v6-fixed-ip')):
                raise OnlyOneIpTypeError()
            elif nic_info.get('v4-fixed-ip'):
                net_data['fixed_ip'] = nic_info['v4-fixed-ip']
            elif nic_info.get('v6-fixed-ip'):
                net_data['fixed_ip'] = nic_info['v6-fixed-ip']
            if nic_info.get('port-id'):
                net_data['port'] = nic_info['port-id']
            all_net_data.append(net_data)
        body['server']['networks'] = all_net_data

    if disk_config is not None:
        body['server']['OS-DCF:diskConfig'] = disk_config

    template = {
        "body": body,
        "host": host,
        "resource_url": resource_url,
        "response_key": response_key
    }
    return template


class CloneSysVolumeEndExecuter(MessageExecuter):
    def event(self):
        return "volume.create.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        name = self._message.get("display_name")
        if name.startswith("ecloud-sys-volume"):
            raise gen.Return(True)
        raise gen.Return(False)

    @gen.coroutine
    def execute(self):
        try:
            name = self._message.get("display_name")
            status = self._message.get("status")
            volume_id = self._message.get("volume_id")
            message = {"sys_volume_id": "", "drive_volume_id": ""}
            LOG.debug(
                "sys volume create end name is %s status is %s volume_id is %s",
                name, status, volume_id)
            t_obj = yield task.get_task_flow(
                resource=name[len("ecloud-sys-volume-"):],
                type=SCHED_TYPE_ACTIONG_CREATE)
            if t_obj:
                if status == "available":
                    message["drive_volume_id"] = t_obj[0].get("drive_volume_id")
                    message["sys_volume_id"] = volume_id
                    sched_status = SCHED_STATUS_PREPARE_SUCCESS
                    if t_obj[0].get("is_iso") and t_obj[0].get("is_windows") and \
                                    message["drive_volume_id"] == "":
                        sched_status = SCHED_STATUS_PREPARE
                    yield task.update_task_flow(t_obj[0].get("id"),
                                                status=sched_status,
                                                message=simplejson.dumps(message))
                else:
                    yield task.update_task_flow_status(t_obj[0].get("id"),
                                                       status=SCHED_STATUS_PREPARE_FAIL)
        except Exception, e:
            LOG.error("sysvolume clone end update task status error %s" % e)


@gen.coroutine
def check_image_up_down(image_id, availability_zone, volume_type):
    """根据availability_zone是否为空判断是本地存储还是共享存储
    共享存储：
        查询所有的镜像卷
    本地存储：
        查询本地镜像卷

    如果镜像卷已经存在直接返回ID,否则创建镜像卷。

    判断列表的镜像卷所对应的镜像是否存在如果不存在则删除。
    :param volume_type:
    :param availability_zone:
    :param image_id:
    """
    name = SYS_VOLUME_IMAGE % image_id
    image_volumes = yield volume_list(vd_type=3)
    sys_volume_id = None
    for image_volume in image_volumes:
        image_volume_id = image_volume.get("id")
        image_volume_name = image_volume.get("name")
        if "ecloud-sys-volume-image-" not in image_volume_name:
            continue
        image_volume_image_id = image_volume_name[len("ecloud-sys-volume-image-"):]
        if image_volume["status"] in ["error", "error_deleting"]:
            try:
                yield volume_delete(image_volume_id)
            except:
                LOG.error("delete image volume of image has deleted")
            continue
        if not availability_zone or availability_zone in image_volume.get("host"):
            if image_volume_name == name and volume_type in image_volume.get("host"):
                sys_volume_id = image_volume_id
            try:
                yield get_image(image_volume_image_id)
            except:
                LOG.info("image has deleted but image_volume has exist")
                try:
                    yield volume_delete(image_volume_id)
                except:
                    LOG.error("delete image volume of image has deleted")
    raise gen.Return({
        "name": name,
        "sys_volume": sys_volume_id
    })


@gen.coroutine
def check_drive_image_up_down(drive_image_id, availability_zone, volume_type):
    """
    如果镜像卷已经存在直接返回ID,否则创建镜像卷。
    :param drive_image_id:
    :param availability_zone:
    :param volume_type:
    :return:
    """
    name = DRIVE_VOLUME_IMAGE % drive_image_id
    image_volumes = yield volume_list(vd_type=3)
    drive_volume_id = None
    for image_volume in image_volumes:
        image_volume_id = image_volume.get("id")
        image_volume_name = image_volume.get("name")
        if "ecloud-drive-volume-image-" not in image_volume_name:
            continue
        image_volume_image_id = image_volume_name[len("ecloud-drive-volume-image-"):]
        if not availability_zone or availability_zone in image_volume.get("host"):
            if image_volume_name == name and volume_type in image_volume.get("host"):
                drive_volume_id = image_volume_id
            try:
                yield get_image(image_volume_image_id)
            except:
                LOG.info("image has deleted but image_volume has exist")
                try:
                    yield volume_delete(image_volume_id)
                except:
                    LOG.error("delete image volume of image has deleted")
    raise gen.Return({
        "name": name,
        "drive_volume": drive_volume_id
    })


class DriveImageVolumeEndExecuter(MessageExecuter):
    def event(self):
        return "volume.create.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        name = self._message.get("display_name")
        if name.startswith("ecloud-drive-volume-image"):
            raise gen.Return(True)
        raise gen.Return(False)

    @gen.coroutine
    def execute(self):
        try:
            name = self._message.get("display_name")
            status = self._message.get("status")
            volume_id = self._message.get("volume_id")
            message = {"sys_volume_id": "", "drive_volume_id": ""}
            LOG.debug(
                "drive volume create end name is %s status is %s volume_id is %s",
                name, status, volume_id)
            meta = yield get_metadata(volume_id)
            task_id = meta.get("task_id")
            t_obj = yield task.get_task_flow(task_id=task_id)
            if t_obj:
                if status == "available":
                    message["sys_volume_id"] = t_obj[0].get("sys_volume_id")
                    message["drive_volume_id"] = volume_id
                    sched_status = SCHED_STATUS_PREPARE_SUCCESS
                    if t_obj[0].get("is_iso") and t_obj[0].get("is_windows") and \
                                    message["sys_volume_id"] == "":
                        sched_status = SCHED_STATUS_PREPARE
                    yield task.update_task_flow(t_obj[0].get("id"), status=sched_status,
                                                message=simplejson.dumps(message))
                else:
                    yield task.update_task_flow_status(t_obj[0].get("id"), status=SCHED_STATUS_PREPARE_FAIL)
        except Exception, e:
            LOG.error("sysvolume clone end update task status error %s" % e)


class ImageVolumeEndExecuter(MessageExecuter):
    def event(self):
        return "volume.create.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        name = self._message.get("display_name")
        if name.startswith("ecloud-sys-volume-image"):
            raise gen.Return(True)
        raise gen.Return(False)

    @gen.coroutine
    def execute(self):
        try:
            name = self._message.get("display_name")
            status = self._message.get("status")
            source_volid = self._message.get("volume_id")
            LOG.debug("image volume create end name is %s status is %s volume_id is %s", name, status, source_volid)
            meta = yield get_metadata(source_volid)
            task_id = meta.get("task_id")
            t_obj = yield task.get_task_flow(task_id=task_id)
            for t in t_obj:
                volume = t.get("volume")
                LOG.debug("create vm sys volume is %s", volume)
                if t.get("is_iso"):
                    source_volid = None
                yield volume_create(size=volume.get("size"),
                                    tenant_id=volume.get("tenant_id"),
                                    snapshot_id=None,
                                    source_volid=source_volid,
                                    name=volume["name"],
                                    description=str(1),
                                    volume_type=volume['volume_type'],
                                    source_replica=None,
                                    metadata=None,
                                    project_id=volume['tenant_id'],
                                    image_ref=None,
                                    availability_zone=volume.get('availability_zone'))
        except Exception, e:
            LOG.error("image volume create end create sys volume error %s" % e)


class VmCreateEndExecuter(MessageExecuter):
    def event(self):
        return "compute.instance.create.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        raise gen.Return(True)

    @gen.coroutine
    def execute(self):
        try:
            name = self._message.get("hostname")
            vm_id = self._message.get("instance_id")
            status = self._message.get("state")
            LOG.debug("vm create end name is %s status is %s", name, status)
            t_obj = yield task.get_task_flow(resource=name)
            if t_obj:
                if status == "active":
                    yield task.update_task_flow_status(t_obj[0].get("id"), status=4)
                else:
                    networks = yield get_vms_nics(self._message.get("instance_id"))
                    for network in networks:
                        port_id = network.get("port_id")
                        yield network_module.request_delete_ports(
                                self._message.get("tenant_id"), port_id)
                    yield task.delete_task_flow(t_obj[0].get("id"))
            iso_list = yield list_server_attach_volume(vm_id, vd_type=3)
            if iso_list:
                for iso in iso_list:
                    yield _update_iso_volume_available(iso.get("volume_id"))
            sys = yield list_server_attach_volume(vm_id, vd_type=1)
            if sys:
                image_meta = self._message.get("image_meta")
                for k, v in image_meta.items():
                    yield update_volume_image_metadata(sys[0].get("volume_id"), k, v)
        except Exception, e:
            LOG.error("instance create end process error %s" % e)


@gen.coroutine
def _update_iso_volume_available(volume_id):
    db = dbpools.get_cinder()
    tx = yield db.begin()
    try:
        yield tx.execute("update volumes set status='available', attach_status='detached'  where id = %s", (volume_id))
    except Exception as e:
        LOG.error("update iso volume available: %s" % e)
        yield tx.rollback()
        raise e
    else:
        yield tx.commit()


class PowerOnExecuter(MessageExecuter):
    def event(self):
        return "compute.instance.power_on.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        raise gen.Return(True)

    @gen.coroutine
    def execute(self):
        try:
            name = self._message.get("instance_id")
            status = self._message.get("state")
            LOG.debug("vm power_on end name is %s status is %s", name, status)
            t_obj = yield task.get_task_flow(resource=name)
            if t_obj:
                if status == "active":
                    yield task.update_task_flow_status(t_obj[0].get("id"), status=4)
                else:
                    yield task.delete_task_flow(t_obj[0].get("id"))
        except Exception, e:
            LOG.error("vm power on  end process error %s" % e)


class RebootExecuter(MessageExecuter):
    def event(self):
        return "compute.instance.reboot.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        raise gen.Return(True)

    @gen.coroutine
    def execute(self):
        try:
            name = self._message.get("instance_id")
            status = self._message.get("state")
            LOG.debug("vm reboot end name is %s status is %s", name, status)
            t_obj = yield task.get_task_flow(resource=name)
            if t_obj:
                if status == "active":
                    yield task.update_task_flow_status(t_obj[0].get("id"), status=4)
                else:
                    yield task.delete_task_flow(t_obj[0].get("id"))
        except Exception, e:
            LOG.error("vm reboot  end process error %s" % e)


@gen.coroutine
def create_reboot_start_schedule():
    LOG.debug("*************************************************")
    LOG.debug("***********   Compute Control Start  ************")
    LOG.debug("*************************************************")
    try:
        all_tasks = yield task.get_task_flow()
        host_schedule = {}
        for t_obj in all_tasks:
            host = t_obj.get("host")
            status = t_obj.get("status")
            type = t_obj.get("type")
            if host not in host_schedule:
                host_schedule[host] = {
                    "nedd_create_tasks": [],
                    "need_reboot_tasks": [],
                    "need_start_tasks": [],
                    "runnig_num": 0
                }
            if status in (SCHED_STATUS_RUNNING, SCHED_STATUS_RUN_SUCCESS):
                host_schedule[host]["runnig_num"] += 1
            if status == SCHED_STATUS_PREPARE_SUCCESS and type == SCHED_TYPE_ACTIONG_CREATE:
                host_schedule[host]["nedd_create_tasks"].append(t_obj)
            if status == SCHED_STATUS_PREPARE and type == SCHED_TYPE_ACTIONG_START:
                host_schedule[host]["need_start_tasks"].append(t_obj)
            if status == SCHED_STATUS_PREPARE and type == SCHED_TYPE_ACTIONG_REBOOT:
                host_schedule[host]["need_reboot_tasks"].append(t_obj)
            if status == SCHED_STATUS_RUN_SUCCESS:
                now = datetime.datetime.now()
                old = t_obj.get("updated_at")
                if (now -old).seconds > CONF.compute.boot_interval:
                    yield task.delete_task_flow(t_obj.get("id"))
        for k, v in host_schedule.items():
            need_running = CONF.compute.max_booting - v.get("runnig_num")
            if need_running > 0:
                for i in range(0, need_running):
                    if v["nedd_create_tasks"]:
                        t = v["nedd_create_tasks"].pop()
                        LOG.debug("boot vm name is %s  status is %s " % (t['resource'], t['status']))
                        row = yield task.update_task_flow_status(t.get("id"), status=SCHED_STATUS_RUNNING)
                        if row:
                            yield __boot_vm(t)
                        continue

                    if v["need_start_tasks"]:
                        t = v["need_start_tasks"].pop()
                        vm_id = t.get("resource")
                        need_reboot = yield get_server_metas(vm_id)
                        LOG.debug("start vm name is %s  status is %s ", vm_id, t['status'])
                        row = yield task.update_task_flow_status(t.get("id"), status=SCHED_STATUS_RUNNING)
                        if row:
                            iso_list = yield list_server_attach_volume(vm_id,
                                                                       vd_type=3)
                            if iso_list:
                                for iso in iso_list:
                                    volume_id = iso.get("volume_id")
                                    yield _detach_iso_volume(volume_id, vm_id)
                            else:
                                if need_reboot.get(NEED_REBOOT):
                                    yield server_action(vm_id, Control.REBOOT, info={"type": "HARD"})
                                    yield del_server_meta(vm_id, [NEED_REBOOT])
                                else:
                                    yield server_action(vm_id, Control.START)
                        continue

                    if v["need_reboot_tasks"]:
                        t = v["need_reboot_tasks"].pop()
                        vm_id = t.get("resource")
                        LOG.debug("reboot vm name is %s  status is %s ", t.get("resource"), t['status'])
                        row = yield task.update_task_flow_status(t.get("id"), status=SCHED_STATUS_RUNNING)
                        if row:
                            iso_list = yield list_server_attach_volume(vm_id, vd_type=3)
                            if iso_list:
                                for iso in iso_list:
                                    volume_id = iso.get("volume_id")
                                    yield _detach_iso_volume(volume_id, vm_id)
                            else:
                                yield server_action(t.get("resource"), Control.REBOOT, info={"type": "SOFT"})
                        continue
        LOG.debug("*************************************************")
        LOG.debug("***********    Compute Control End   ************")
        LOG.debug("*************************************************")
    except Exception, e:
        LOG.error(trace())
        LOG.error(" create start reboot schedule error %s" % e)


@gen.coroutine
def _detach_iso_volume(volume_id, vm_id):
    LOG.debug("the vm %s is create by iso need reboot hard ", vm_id)
    db = dbpools.get_nova()
    tx = yield db.begin()
    try:
        cur = yield tx.execute(
                "select volume_id,connection_info ,disk_bus from block_device_mapping where instance_uuid = %s and device_name = '/dev/vdb'",
                (vm_id))
        sys = cur.fetchone()
        # cur.close()
        sys_volume_id = sys.get("volume_id")
        sys_connection_info = sys.get("connection_info")
        disk_bus = sys.get("disk_bus")
        yield tx.execute(
                "update  block_device_mapping  set  device_type = 'disk' , disk_bus = %s , volume_id = %s , connection_info = %s  where instance_uuid = %s  and device_name = '/dev/vda'",
                (disk_bus,sys_volume_id, sys_connection_info, vm_id))
        yield tx.execute(
                "update  block_device_mapping  set deleted = 1 where instance_uuid = %s  and device_name = '/dev/vdb'",
                (vm_id))
        yield tx.execute(
                "update  block_device_mapping  set deleted = 1 where instance_uuid = %s  and device_name = '/dev/vdc'",
                (vm_id))
    except Exception as e:
        LOG.error("detach iso volume : %s" % e)
        yield tx.rollback()
        raise e
    else:
        yield tx.commit()
        db = dbpools.get_cinder()
        tx1 = yield db.begin()
        try:
            yield tx1.execute("update volume_attachment set deleted = 1 ,mountpoint = '/dev/vda'  where volume_id = %s and instance_uuid = %s",
                              (volume_id, vm_id))
            yield tx1.execute(
                "update volume_attachment set deleted = 1 ,mountpoint = '/dev/vdc'  where volume_id = %s and instance_uuid = %s",
                (volume_id, vm_id))
        except Exception as e:
            LOG.error("update iso volume_attachment available: %s" % e)
            yield tx1.rollback()
            raise e
        else:
            yield tx1.commit()
        yield server_action(vm_id, Control.REBOOT, info={"type": "HARD"})


@gen.coroutine
def __boot_vm(t):
    try:
        tenant = t.get("tenant")
        resource_url = t.get("resource_url")
        response_key = t.get("response_key")
        body = t.get("body")
        sys_volume_id = t.get("sys_volume_id")
        drive_volume_id = t.get("drive_volume_id")
        image = t.get("image")
        is_iso = t.get("is_iso")
        volume = t.get("volume")
        is_windows = t.get("is_windows")

        if is_iso:
            image_volume = yield check_image_up_down(image, volume.get('availability_zone'), volume.get("volume_type"))
            image_sys_volume = image_volume.get("sys_volume")
            yield _update_iso_volume_available(image_sys_volume)
            body["server"]["block_device_mapping_v2"]["vda"] = body["server"]["block_device_mapping_v2"][
                                                                "vda"] % image_sys_volume
            body["server"]["block_device_mapping_v2"]["vdb"] = body["server"]["block_device_mapping_v2"][
                                                                "vdb"] % sys_volume_id
            if is_windows:
                yield _update_iso_volume_available(drive_volume_id)
                body["server"]["block_device_mapping_v2"]["vdc"] = body["server"]["block_device_mapping_v2"][
                                                                       "vdc"] % drive_volume_id
        else:
            body["server"]["block_device_mapping_v2"]["vda"] = body["server"]["block_device_mapping_v2"][
                                                                "vda"] % sys_volume_id

        body["server"]["block_device_mapping_v2"] = parse_block_device_mapping(body["server"]["block_device_mapping_v2"])

        body["server"]["metadata"].pop("nics")
        LOG.debug("create vm body is %s", body)
        session = yield openstack.get_session(tenant)
        yield openstack.connect_request(session=session, type=openstack.TYPE_COMPUTE, url=resource_url,
                                        body=body,
                                        method=openstack.METHOD_POST, response_key=response_key)
    except Exception, e:
        LOG.error("boot vm error %s" % e)


def parse_block_device_mapping(block_device_mapping):
    bdm = []

    for device_name, mapping in six.iteritems(block_device_mapping):
        #
        # The mapping is in the format:
        # <id>:[<type>]:[<size(GB)>]:[<delete_on_terminate>]
        #
        bdm_dict = {'device_name': device_name}

        mapping_parts = mapping.split(':')
        source_id = mapping_parts[0]
        bdm_dict['uuid'] = source_id
        if len(mapping_parts) == 1:
            bdm_dict['volume_id'] = source_id
            bdm_dict['source_type'] = 'volume'

        elif len(mapping_parts) > 1:
            source_type = mapping_parts[1]
            bdm_dict['source_type'] = source_type
            if source_type.startswith('snap'):
                bdm_dict['snapshot_id'] = source_id
            else:
                bdm_dict['volume_id'] = source_id

        if len(mapping_parts) > 2 and mapping_parts[2]:
            bdm_dict['destination_type'] = str(mapping_parts[2])

        if len(mapping_parts) > 3:
            bdm_dict['delete_on_termination'] = int(mapping_parts[3])

        if len(mapping_parts) > 4:
            bdm_dict['boot_index'] = int(mapping_parts[4])

        if len(mapping_parts) > 5:
            bdm_dict['device_type'] = mapping_parts[5]

        if len(mapping_parts) > 6:
            bdm_dict['disk_bus'] = mapping_parts[6]

        bdm.append(bdm_dict)
        print bdm_dict
    return bdm


@gen.coroutine
def get_vms_nics(vm_id=None):
    try:
        db = dbpools.get_nova()
        if vm_id:
            result = []
            sql = "select instance_uuid , network_info from instance_info_caches where  instance_uuid =  %s"
            cur = yield db.execute(sql, [vm_id])
            res = cur.fetchone()
            network_info = jsonutils.loads(res.get("network_info"))
            for r in network_info:
                result.append({
                    "name": r.get("network").get("label"),
                    "ip": r.get("network").get("subnets")[0].get("ips")[0].get("address"),
                    "id": r.get("network").get("id"),
                    "port_id": r.get("id")
                })
        else:
            result = {}
            sql = "select instance_uuid , network_info from instance_info_caches where deleted = 0"
            cur = yield db.execute(sql)
            response = cur.fetchall()
            for res in response:
                network_info = jsonutils.loads(res.get("network_info"))
                network = []
                for r in network_info:
                    network.append({
                        "name": r.get("network").get("label"),
                        "ip": r.get("network").get("subnets")[0].get("ips")[0].get("address"),
                        "id": r.get("network").get("id")
                    })
                result[res.get("instance_uuid")] = network
    except Exception as e:
        LOG.error("get vms nics  from db error: %s" % e)
        raise e
    raise gen.Return(result)


from easted.utils import timeit


# @gen.coroutine
# @timeit
def main():
    # vm_id = "87484a42-c935-4ac2-a04c-e911831fc786"
    # metas = yield list_server_metas(vm_id)
    # print(metas)
    # metadata = {"extend": {"displayname": "sec", "des": "desc", "keepalive": 0}}
    # yield update_server(vm_id, Metadata(**metadata))
    a = {
        "vda": "12:vol::1:1",
        "vdb": "11:vol::1:2"
    }
    parse_block_device_mapping(a)


if __name__ == "__main__":
    from tornado import ioloop

    # from easted.log import log
    #
    # log.init()
    ioloop.IOLoop.current().run_sync(main)
