# -*- coding: utf-8 -*-
import math
import logging
from tornado import gen
from easted import config
from easted.volume.common import *
from easted.core.consumer import MessageExecuter
from easted.core.sequence import number_seq
from easted.core.exception import InvalidateParam
from easted.utils import required
from easted.identify import update_quota_used, \
    QUOTA_NAMES, check_quota, get_quota, get_user_by_id
from easted.utils import is_none_or_empty
from exception import VolumeNotExist, VolumeOperationFailed, ClearUserVolumeRelationError
from easted.utils import datetimeUtils

__all__ = ["CloudVolume",
           "get_volume",
           "list_volume",
           "create_volume",
           "update_volume",
           "delete_volume",
           "calc_size",
           "clear_user_volumes",
           "get_volumes_by_batch",
           "set_volume_status",
           "set_volume_attach_vm_id",
           "set_volume_user"
           ]

config.settings.register(name="storage.default_type", default="iscsi")
CONF = config.CONF
LOG = logging.getLogger("system")


class CloudVolume(object):
    """ backup_id is openstack 's snapshot_id
    """
    id = str
    name = str
    displayname = str
    size = int
    volume_type = str
    user_id = str
    tenant_id = str
    host = str
    source_volid = str
    image_ref = str
    num = int
    des = str

    def __init__(self, **kwargs):
        self.id = kwargs.get('id', None)
        self.name = kwargs.get('name', None)
        self.displayname = kwargs.get('displayname', None)
        self.size = kwargs.get('size', 1)
        self.volume_type = kwargs.get('volume_type', CONF.storage.default_type)
        self.user_id = kwargs.get('user_id', None)
        self.tenant_id = kwargs.get('tenant_id', None)
        self.host = kwargs.get('host', None)
        self.source_volid = kwargs.get('source_volid', None)
        self.image_ref = kwargs.get('image_ref', None)
        self.num = kwargs.get('num', 1)
        self.des = kwargs.get('des', None)


@gen.coroutine
def get_volume(volume_id=None, vd_type=0, name=None, detailed=True):
    """ get volume
    :param detailed:
    :param volume_id:
    :param vd_type:
    :param name:
    :return:
    """
    if not volume_id and not name:
        raise InvalidateParam(args=['volume_id, name'])
    out_volumes = yield list_volume(volume_id=volume_id, name=name, vd_type=vd_type, detailed=detailed)
    if out_volumes:
        out_volume = out_volumes[0]
    else:
        raise VolumeNotExist
    raise gen.Return(out_volume)


@gen.coroutine
def get_volumes_by_batch(batch, detailed=False):
    """ get volumes
    :param batch: str
    :param detailed:
    :return:
    """
    out_volumes = yield list_volume(batch=batch, detailed=detailed)
    raise gen.Return(out_volumes)


@gen.coroutine
def list_volume(detailed=True, volume_id=None, batch=None, name=None, tenant_ids=None, user_id=None, vd_type=0, available=False):
    """
    :param detailed:
    :param volume_id:
    :param batch:
    :param tenant_ids:
    :param user_id:
    :param available:
    :param name:
    :param vd_type:
    :return:
    """
    try:
        volumes = yield volume_list(volume_id=volume_id, batch=batch, name=name, tenant_ids=tenant_ids, user_id=user_id,
                                    available=available, vd_type=vd_type)
    except Exception, e:
        LOG.error("list volumes error: %s" % e)
        raise VolumeOperationFailed()
    else:
        if vd_type==0:
            volumes = sorted(volumes, key=lambda d: (int(d["name"].split("-")[1]), int(d["name"].split("-")[2]) if len(d["name"].split("-")) > 2 else 0), reverse=True)
        out_volumes = []
        if detailed:
            volume_ids = [volume["id"] for volume in volumes]
            metadatas = []
            if volume_ids:
                metadatas = yield volume_metadata(volume_ids)
            volume_mate = {}
            for meta_item in metadatas:
                if meta_item["volume_id"] in volume_mate:
                    volume_mate[meta_item["volume_id"]].update({meta_item["meta_key"]: meta_item["meta_value"]})
                else:
                    volume_mate[meta_item["volume_id"]] = {meta_item["meta_key"]: meta_item["meta_value"]}

            for volume in volumes:
                mate_item = volume_mate.get(volume["id"], {})
                out_volume = yield gen_out_volume(volume, mate_item)
                out_volumes.append(out_volume)
        else:
            for volume in volumes:
                out_volume = {
                    "id": volume['id'],
                    "name": volume['name'],
                    "size_gb": volume['size_gb'],
                    "created_at": datetimeUtils.time2epoch(volume['created_at']),
                    "type": volume["type"],
                    "location":volume['host'],
                    "tenant_id": volume["tenant_id"],
                    "status": volume["status"]
                }
                out_volumes.append(out_volume)
    raise gen.Return(out_volumes)


@gen.coroutine
@required("tenant_id", "size")
def create_volume(**volume):
    """ create volume
    :param volume: A dict of volume
    :return:
    """
    if is_none_or_empty(volume['volume_type']):
        volume['volume_type'] = CONF.storage.default_type
    volume_project = volume['tenant_id']
    volume_size = calc_size(volume['size'])
    volume_num = volume['num']
    if volume['volume_type'] == "lvm":
        volume_num = 1

    disk_capacity = yield get_quota(volume_project, QUOTA_NAMES.disk_capacity)
    disks = yield get_quota(volume_project, QUOTA_NAMES.disks)

    used_disks = disks.get("quota_used")
    used_disk_capacity = disk_capacity.get("quota_used")

    used_disks += volume_num
    used_disk_capacity += volume_size * volume_num

    yield check_quota(volume_project,
                      QUOTA_NAMES.disks,
                      used_disks)
    yield check_quota(volume_project,
                      QUOTA_NAMES.disk_capacity,
                      used_disk_capacity)

    yield update_quota_used(volume_project, QUOTA_NAMES.disks,
                            used_disks)
    yield update_quota_used(volume_project, QUOTA_NAMES.disk_capacity,
                            used_disk_capacity)

    try:
        volume_name = yield number_seq("volume-sequence", "vd-")
        names = []
        for i in range(1, volume_num + 1):
            if volume_num > 1:
                name = str(volume_name) + "-" + str(i)
            else:
                name = volume_name
            names.append(name)
            metadata = {"des": "" if is_none_or_empty(volume['des']) else volume['des'],
                        "user": "" if is_none_or_empty(volume['user_id']) else volume['user_id'],
                        "displayname": "" if is_none_or_empty(volume['displayname']) else volume['displayname']}

            yield volume_create(size=volume_size,
                                tenant_id=volume_project,
                                snapshot_id=None,
                                source_volid=volume['source_volid'],
                                name=name,
                                description=str(0),
                                volume_type=volume['volume_type'],
                                source_replica=None,
                                metadata=metadata,
                                project_id=volume['tenant_id'],
                                image_ref=volume['image_ref'],
                                availability_zone=volume["host"])
    except Exception, e:
        LOG.error("create volume error: %s" % e)
        raise VolumeOperationFailed()
    finally:
        volume_os_used = yield volume_real_used(volume_project)
        yield update_quota_used(volume_project, QUOTA_NAMES.disks,
                                volume_os_used.get('count'))
        yield update_quota_used(volume_project, QUOTA_NAMES.disk_capacity,
                                volume_os_used.get('used_size'))
    raise gen.Return({"batch_name": volume_name, "names": names})


@gen.coroutine
@required("volume_id")
def update_volume(volume_id, **params):
    """ update volume's displayname or description
    :param volume_id: The :id: Volume
    :param params: Update volume info:A Dict={"displayname": "vm-1",
    "des": "desc volume"}
    :return:
    """
    try:
        volume = yield get_volume(volume_id=volume_id)
        if volume:
            volume_meta = volume['metadata'] \
                if volume['metadata'] else {}
            volume_meta['des'] = params['des']
            volume_meta['displayname'] = params['displayname']
            yield set_metadata(volume_id=volume_id,
                               metadata=volume_meta)
    except Exception, e:
        LOG.error("update volume error: %s" % e)
        raise VolumeOperationFailed()
    raise gen.Return(volume.get("name"))


@gen.coroutine
def clear_user_volumes(tenant_id,user_id):
    try:
        volumes = yield list_volume(tenant_ids=tenant_id,user_id=user_id)
        for vol in volumes:
            volume_id = vol.get("id")
            volume_meta = vol['metadata'] \
                if vol['metadata'] else {}
            volume_meta['user'] = ""
            yield set_metadata(volume_id=volume_id,
                               metadata=volume_meta)
            LOG.info("clear user '%s' volumes success", user_id)
    except Exception, e:
        raise ClearUserVolumeRelationError


@gen.coroutine
def set_volume_user(volume_id, user_id):
    result = {
        "name": "",
        "displayname": "",
        "user": ""
    }
    try:
        volume = yield get_volume(volume_id=volume_id)
        if not is_none_or_empty(user_id):
            user = yield get_user_by_id(user_id)
            result['user'] = user.get("displayname")
        if volume:
            result['name'] = volume.get("name")
            volume_meta = volume['metadata'] \
                if volume['metadata'] else {}
            volume_meta['user'] = user_id
            result['displayname'] = volume_meta.get("displayname")
            yield set_metadata(volume_id=volume_id,
                               metadata=volume_meta)
    except Exception, e:
        LOG.error("set volume user error: %s" % e)
        raise VolumeOperationFailed()
    raise gen.Return(result)


@gen.coroutine
def set_volume_status(volume_id, status):
    try:
        volume = yield get_volume(volume_id=volume_id)
        if volume:
            volume_meta = volume['metadata'] \
                if volume['metadata'] else {}
            volume_meta['status'] = status
            yield set_metadata(volume_id=volume_id,
                               metadata=volume_meta)
    except Exception as e:
        LOG.error("set_volume_status error: %s" % e)
        raise e

@gen.coroutine
def set_volume_attach_vm_id(volume_id, attach_vm_id):
    volume = yield get_volume(volume_id=volume_id)
    if volume:
        volume_meta = volume['metadata'] \
            if volume['metadata'] else {}
        volume_meta['attach_vm_id'] = attach_vm_id
        yield set_metadata(volume_id=volume_id,
                           metadata=volume_meta)


@gen.coroutine
def delete_volume(volume_id):
    try:
        yield volume_delete(volume_id=volume_id)
    except Exception, e:
        LOG.error("delete volume error: %s" % e)
        raise VolumeOperationFailed()


class DelDiskEndExecuter(MessageExecuter):
    def event(self):
        return "volume.delete.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        name = self._message.get("display_name")
        if name.startswith("vd-"):
            raise gen.Return(True)
        raise gen.Return(False)

    @gen.coroutine
    def execute(self):
        try:
            tenant_id = self._message.get('tenant_id')
            volume_os_used = yield volume_real_used(tenant_id)
            yield update_quota_used(tenant_id, QUOTA_NAMES.disks,
                                    volume_os_used.get('count'))
            yield update_quota_used(tenant_id, QUOTA_NAMES.disk_capacity,
                                    volume_os_used.get('used_size'))
        except Exception, e:
            LOG.error("delele disk error %s" % e)


# class DelBackupVolumeEndExecuter(MessageExecuter):
#     def event(self):
#         return "volume.delete.end"
#
#     def queue(self):
#         return "ecloud-openstack"
#
#     @gen.coroutine
#     def prepare(self):
#         volume_id = self._message.get("volume_id")
#         t = yield task.get_task_flow(resource=volume_id)
#         if t:
#             self._task = t[0]
#         if self._task and self._task.get("type") == 2:
#             raise gen.Return(True)
#         raise gen.Return(False)
#
#     @gen.coroutine
#     def execute(self):
#         try:
#             status = self._message.get("status")
#             if status == VDISK_STATUS_DELETE:
#                 yield task.update_task_flow(self._task.get("id"), status=task.TASK__SUCCESS)
#                 tenant_id = self._message.get('tenant_id')
#                 volume_os_used = yield volume_real_used(tenant_id)
#                 yield update_quota_used(tenant_id, QUOTA_NAMES.disks,
#                                         volume_os_used.get('count'))
#                 yield update_quota_used(tenant_id, QUOTA_NAMES.disk_capacity,
#                                         volume_os_used.get('used_size'))
#             else:
#                 yield task.update_task_flow(self._task.get("id"), status=task.TASK__SUCCESS)
#                 volume_id = self._message.get("volume_id")
#                 yield set_volume_status(volume_id, VDISK_STATUS_DELETE_ERROR)
#         except Exception, e:
#             LOG.error("delele backup error %s" % e)


def calc_size(image_size):
    """ ceil image size
    :param image_size: image size
    :return: int image size
    """
    try:
        size = int(math.ceil(float(image_size)))
    except Exception, e:
        raise e
    return size


@gen.coroutine
def main():
    # d, d2 = yield get_tenant_volume_quota_used("07e75ab2848c4ed69bcc68e501eba9c0")
    # print d, d2
    # volumes = yield list_volume()
    # print volumes
    # stat_volumes = yield stat_volume()
    # print stat_volumes
    # yield update_volume(volume_id="0c8cbb0f-b70d-4a88-9e64-efe1fba73d44",
    #                     **{"displayname": "vm-1",
    #                        "des": "desc volume"})
    # volumes = yield list_volume_by_user('0ede3917fa2c46219030de35fb37273a')
    # print volumes
    volume_id = '246dd437-9ed1-4fbe-ac00-82bff2a37f4b'
    volume = yield get_volume(volume_id=volume_id, detailed=False)
    print volume


if __name__ == "__main__":
    from tornado import ioloop

    ioloop.IOLoop.current().run_sync(main)
