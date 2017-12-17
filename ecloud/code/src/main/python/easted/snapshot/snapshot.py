# coding:utf-8

import logging
from tornado import gen
from easted import compute
from easted.compute import InvalidVm, list_server_attach_volume, \
    set_or_update_vm_meta, list_server, \
    attach_server_volume, detach_server_volume
from easted.identify import QUOTA_NAMES, check_quota, update_quota_used
from easted.volume import list_volume, delete_metadata, volume_list, \
    get_volume, TYPE_SNAPSHOT_VOLUME, get_metadata, \
    set_metadata
import easted.volume.common as volume_request
from easted.core.consumer import MessageExecuter
from constant import *
from exception import *
from easted.core.exception import *
from easted import config
from easted.compute import del_meta
from snapshotdao import update_volume_db
import snapshotdao

CONF = config.CONF

LOG = logging.getLogger('system')
ECLOUD_SNAPSHOT = "ecloud-snapshot-%s"

__all__ = ["snapshot_create",
           "delete_snapshot",
           "snapshot_list_summary",
           "list_snapshot",
           "get_snapshot",
           "update_snapshot",
           "snapshot_recover",
           "update_volume_db",
           "snapshot_set_vm_volume_displayname",
           "clean_vm_or_volume_snapshot"
           ]

config.settings.register(name="storage.share_storage_access")

@gen.coroutine
def check_tenant_snapshot_quota(tenant_id, need_size, need_count):
    """
    :param tenant_id:
    :param need_size:
    :param need_count:
    :return:
    """
    snapshots_tenant_quotas = yield get_tenant_snapshot_used_quota(tenant_id)
    used_snapshots = snapshots_tenant_quotas.get("used_count") + need_count
    used_snapshot_capacity = snapshots_tenant_quotas.get("used_size") + need_size
    yield check_quota(tenant_id, QUOTA_NAMES.snapshots, used_snapshots)
    yield check_quota(tenant_id, QUOTA_NAMES.snapshot_capacity, used_snapshot_capacity)
    raise gen.Return({
        "used_count": used_snapshots,
        "used_size": used_snapshot_capacity
    })


@gen.coroutine
def update_tenant_snapshot_quotas(tenant_id, used_size=None, used_count=None):
    if used_size is not None:
        yield update_quota_used(tenant_id, QUOTA_NAMES.snapshot_capacity, used_size)
    if used_count is not None:
        yield update_quota_used(tenant_id, QUOTA_NAMES.snapshots, used_count)


@gen.coroutine
def get_tenant_snapshot_used_quota(tenant_id):
    useds = yield snapshotdao.snapshot_real_used(tenant_id)
    used_quotas = {
        "used_count": useds["count"],
        "used_size": 0 if useds["used_size"] is None else useds["used_size"]
    }
    raise gen.Return(used_quotas)


@gen.coroutine
def snapshot_create(source_id, snapshot_type, name, description, volume_ids=[]):
    """
    :param source_id:
    :param snapshot_type:
    :param name:
    :param description:
    :param volume_ids:
    :return:
    """
    snapshots = []
    data_volumes = []
    volume_mate = {}
    if snapshot_type == SNAPSHOT_TYPE_VM:  # vm
        LOG.debug("Create Snapshot Type is vm")
        vm_info = yield compute.get_server(vm_id=source_id)
        vm_state = vm_info.get("state")
        if vm_state not in ["active", "stopped"]:
            raise VmMustActiveOrStop()
        vm_id = vm_info["id"]
        vm_name = vm_info["name"]
        tenant_id = vm_info["tenant"]["id"]
        sys_volumes = yield list_server_attach_volume(vm_id, vd_type=1)
        if not sys_volumes:
            raise InvalidVm
        sys_volume = sys_volumes[0]
        sys_volume_id = sys_volume["volume_id"]
        sys_volume_size = sys_volume["size"]
        sys_volume_type = sys_volume["type"]
        sys_volume_status = sys_volume["status"]
        host = sys_volume["host"]
        total_size = sys_volume_size
        total_count = 1
        if volume_ids:
            data_volumes = yield list_volume(volume_id=volume_ids)
            metadatas = yield volume_request.volume_metadata(volume_ids)
            for meta_item in metadatas:
                if meta_item["volume_id"] in volume_mate:
                    volume_mate[meta_item["volume_id"]].update({meta_item["meta_key"]: meta_item["meta_value"]})
                else:
                    volume_mate[meta_item["volume_id"]] = {meta_item["meta_key"]: meta_item["meta_value"]}

            for item_vol in data_volumes:
                if item_vol["status"] not in ["in-use", "available"]:
                    raise VolumeStatusNotAvailable(args=[item_vol["id"]])
                total_size += item_vol["size_gb"]
            total_count += len(data_volumes)
        quota = yield check_tenant_snapshot_quota(tenant_id, total_size, total_count)
        yield update_tenant_snapshot_quotas(tenant_id, used_size=quota.get("used_size"),
                                            used_count=quota.get("used_count"))
        yield set_or_update_vm_meta(vm_id, "status", "snapshoting")
        snapshots.append({
            "volume_id": sys_volume_id,
            "tenant_id": tenant_id,
            "name": "ecloud-snapshot-%s" % vm_name,
            "size": sys_volume_size,
            "volume_type": sys_volume_type,
            "display_discription": TYPE_SNAPSHOT_VOLUME,
            "status": sys_volume_status,
            "metadata": {
                "des": description,
                "displayname": name,
                "vm_id": source_id,
                "availability_zone": host[:host.index("@")] if "lvm" in host else CONF.storage.share_storage_access,
                "sys_volume_id": sys_volume_id,
                "source_status": sys_volume_status
            }
        })
    else:
        LOG.debug("Create Snapshot Type is vd")
        volume_ids.append(source_id)
        total_size = 0
        data_volumes = yield list_volume(volume_id=volume_ids)
        metadatas = yield volume_request.volume_metadata(volume_ids)
        for meta_item in metadatas:
            if meta_item["volume_id"] in volume_mate:
                volume_mate[meta_item["volume_id"]].update({meta_item["meta_key"]: meta_item["meta_value"]})
            else:
                volume_mate[meta_item["volume_id"]] = {meta_item["meta_key"]: meta_item["meta_value"]}

        for item_vol in data_volumes:
            if item_vol["status"] not in ["in-use", "available"]:
                raise VolumeStatusNotAvailable(args=[item_vol["id"]])
            total_size += item_vol["size_gb"]
        tenant_id = data_volumes[0]["tenant"]["id"]
        quota = yield check_tenant_snapshot_quota(tenant_id, total_size, len(data_volumes))
        yield update_tenant_snapshot_quotas(tenant_id, used_size=quota.get("used_size"),
                                            used_count=quota.get("used_count"))
    for volume_item in data_volumes:
        volume_id = volume_item["id"]
        volume_name = volume_item["name"]
        volume_size = volume_item["size_gb"]
        volume_tenant_id = volume_item["tenant"]["id"]
        status = volume_item["status"]
        host = volume_item["location"]
        snapshots.append({
            "volume_id": volume_id,
            "tenant_id": volume_tenant_id,
            "name": "ecloud-snapshot-%s" % volume_name,
            "size": volume_size,
            "volume_type": host[host.rindex("#") + 1:],
            "display_discription": TYPE_SNAPSHOT_VOLUME,
            "status": status,
            "volume_matedata": volume_mate[volume_id],
            "metadata": {
                "des": description,
                "displayname": name,
                "availability_zone": host[:host.index("@")] if "lvm" in host else CONF.storage.share_storage_access,
                "volume_id": volume_id,
                "source_status": status
            }
        })
    LOG.debug("Snapshot Info Ready. Start gen snapshot volume.")
    yield _gen_snapshot_volume(snapshots)


@gen.coroutine
def _gen_snapshot_volume(snapshots):
    for snapshot_item in snapshots:
        volume_id = snapshot_item["volume_id"]
        size = snapshot_item["size"]
        tenant_id = snapshot_item["tenant_id"]
        source_volid = volume_id
        metadata = snapshot_item["metadata"]
        status = snapshot_item["status"]
        availability_zone = metadata["availability_zone"]
        back_description = snapshot_item["display_discription"]
        volume_type = snapshot_item["volume_type"]
        snapshot_name = snapshot_item["name"]
        if snapshot_name.startswith("ecloud-snapshot-vd-"):
            volume_metadata = snapshot_item["volume_matedata"]
            volume_metadata["status"] = "snapshoting"
            yield volume_request.update_metadata(source_volid, volume_metadata)
        yield volume_request.reset_state(volume_id=volume_id, volume_state="available")
        try:
            volume = yield volume_request.volume_create(size, tenant_id, consistencygroup_id=None,
                                                        snapshot_id=None,
                                                        source_volid=source_volid, name=snapshot_name,
                                                        description=back_description,
                                                        volume_type=volume_type, user_id=None,
                                                        project_id=tenant_id, availability_zone=availability_zone,
                                                        metadata=metadata, image_ref=None,
                                                        scheduler_hints=None,
                                                        source_replica=None)
        except Exception as e:
            LOG.error("Snapshot error when create volume clone. msg:%s", e)
            yield volume_request.reset_state(volume_id=volume_id, volume_state=status)
            vm_id = metadata.get("vm_id", None)
            if vm_id:
                yield del_meta(vm_id, ["status"])
            raise SnapshotCreateError()


@gen.coroutine
def __snapshot_set_metadata(snapshot_id, metadata):
    try:
        for item in metadata:
            metadata[item] = str(metadata[item])
        yield volume_request.set_metadata(volume_id=snapshot_id, metadata=metadata)
    except Exception as e:
        LOG.error("update snapshot metadata error: %s" % e)
        raise SnapshotOperationFailed


@gen.coroutine
def snapshot_set_vm_volume_displayname(vm_volume_name, displayname):
    snapshots = yield list_snapshot(vm_volume_name)
    if snapshots:
        for snapshot in snapshots:
            metadata = snapshot.get("metadata")
            metadata["displayname"] = displayname
            yield __snapshot_set_metadata(snapshot.get("id"), metadata)


@gen.coroutine
def get_snapshot(snapshot_id, detailed=False):
    snapshot = yield get_volume(volume_id=snapshot_id, vd_type=2)
    if detailed:
        raise gen.Return(snapshot)
    snapshot_info = {
        "id": snapshot["id"],
        "name": snapshot["name"],
        "displayname": snapshot["metadata"]["displayname"],
        "create_at": snapshot.get('created_at'),
        "des": snapshot["metadata"]["des"],
        "size": snapshot["size_gb"],
        "status": snapshot["status"]
    }
    raise gen.Return(snapshot_info)


@gen.coroutine
def list_snapshot(name):
    """
    :param name: vm or volume name
    :return:
    """
    try:
        snapshots = yield list_volume(name="ecloud-snapshot-%s" % name, vd_type=2)
        out_snapshots = []
        for snapshot in snapshots:
            if snapshot.get("status") == "deleting":
                continue
            out_snapshots.append({
                "id": snapshot["id"],
                "name": snapshot["name"],
                "displayname": snapshot["metadata"]["displayname"],
                "create_at": snapshot['created_at'],
                "des": snapshot["metadata"]["des"],
                "size": snapshot["size_gb"],
                "status": snapshot["status"]
            })
    except Exception as e:
        LOG.error("List Snapshots Error, msg : %s" % e)
        raise e
    raise gen.Return(out_snapshots)


@gen.coroutine
def snapshot_list_summary(snapshot_type, tenant_id=None):
    summary = []
    if snapshot_type == SNAPSHOT_TYPE_VM:
        vm_ids = []
        tmp = {}
        vm_summary = yield snapshotdao.get_snapshot_vm_summary(tenant_ids=tenant_id)
        vm_summary = sorted(vm_summary, key=lambda d: (
        int(d["vm_name"].split("-")[1]), int(d["vm_name"].split("-")[2]) if len(d["vm_name"].split("-")) > 2 else 0),
                            reverse=True)
        if not vm_summary:
            raise gen.Return(summary)
        for t_item in vm_summary:
            vm_ids.append(t_item["id"])
            t_item["size"] = int(t_item["size"])
            tmp[t_item["id"]] = t_item
        servers = yield list_server(vm_ids=vm_ids, detailed=True, with_task=False)
        for vm_item in servers:
            vm_id = vm_item["id"]
            vm_tmp = tmp[vm_id]
            vm_tmp.update({"name": vm_item["name"], "displayname": vm_item["displayname"]})
            summary.append(vm_tmp)
    elif snapshot_type == SNAPSHOT_TYPE_VOLUME:
        summary = yield snapshotdao.get_snapshot_volume_summary(tenant_ids=tenant_id)
        summary = sorted(summary, key=lambda d: (
        int(d["name"].split("-")[1]), int(d["name"].split("-")[2]) if len(d["name"].split("-")) > 2 else 0),
                         reverse=True)
        for s_item in summary:
            s_item["size"] = int(s_item["size"])
    raise gen.Return(summary)


@gen.coroutine
def update_snapshot(snapshot_id, name, des):
    try:
        snapshot = yield get_volume(volume_id=snapshot_id, vd_type=2)
        if snapshot:
            volume_meta = snapshot['metadata'] \
                if snapshot['metadata'] else {}
            volume_meta['des'] = str(des)
            volume_meta['displayname'] = str(name)
            yield set_metadata(volume_id=snapshot_id,
                               metadata=volume_meta)
    except Exception, e:
        LOG.error("Update Snapshot Error: %s" % e)
        raise SnapshotOperationFailed()
    raise gen.Return(snapshot.get("name"))


@gen.coroutine
def delete_snapshot(snapshot_id):
    try:
        snapshot_info = yield get_volume(volume_id=snapshot_id, vd_type=2)
        if snapshot_info:
            snapshot_id = snapshot_info.get("id")
            volume_meta = snapshot_info['metadata'] \
                if snapshot_info['metadata'] else {}
            volume_meta['status'] = "deleting"
            yield set_metadata(volume_id=snapshot_id,
                               metadata=volume_meta)
        yield volume_request.volume_delete(snapshot_id)
    except Exception as e:
        LOG.error("Del Snapshot Error: %s" % e)
        raise SnapshotDeleteError
    raise gen.Return(snapshot_info)


@gen.coroutine
def clean_vm_or_volume_snapshot(source_name):
    snapshot_name = "ecloud-snapshot-%s" % source_name
    vm_snapshots = yield list_volume(name=snapshot_name, vd_type=2, detailed=False)
    for vm_snapshot_item in vm_snapshots:
        yield delete_snapshot(vm_snapshot_item["id"])


@gen.coroutine
def snapshot_recover(snapshot_info):
    name = snapshot_info["name"][len("ecloud-snapshot-"):]
    if name.startswith("vd-"):
        yield _volume_recover(snapshot_info, name)
    elif name.startswith("vm-"):
        yield _vm_recover(snapshot_info, name)
    else:
        LOG.error("Snapshot Recover Error, InvalidateParam")
        raise InvalidateParam()

    raise gen.Return(True)


@gen.coroutine
def __set_volume_metadata(volume_id, metadata):
    try:
        metadata = {key: str(value) for key, value in metadata}
        yield volume_request.update_metadata(volume_id, metadata)
    except Exception as e:
        LOG.error("Snapshot set volume metadata error: %s" % e)


@gen.coroutine
def _vm_recover(snapshot_info, name):
    vm_info = yield compute.get_server(name=name)
    vm_status = vm_info.get("state")
    if vm_status not in ["active", "stopped", "error"]:
        raise VmMustActiveOrStop()
    snapshot_id = snapshot_info["id"]
    snapshot_metadata = snapshot_info.get("metadata")
    snapshot_metadata["status"] = "recovering"
    vm_id = vm_info.get('id')
    yield set_or_update_vm_meta(vm_id, "status", "recovering")
    yield set_or_update_vm_meta(vm_id, "recover_status", "")
    yield volume_request.update_metadata(snapshot_id, snapshot_metadata)
    yield _gen_snapshot_recover_vm(vm_id, snapshot_info)


@gen.coroutine
def _volume_recover(snapshot_info, name):
    snapshot_id = snapshot_info["id"]
    volume_info = yield get_volume(name=name)
    volume_id = volume_info.get('id')
    volume_metadata = volume_info.get("metadata")
    volume_metadata["status"] = "recovering"
    volume_metadata["recover_status"] = ""
    snapshot_metadata = snapshot_info.get("metadata")
    snapshot_metadata["status"] = "recovering"
    yield volume_request.update_metadata(volume_id, volume_metadata)
    yield volume_request.update_metadata(snapshot_id, snapshot_metadata)
    yield _gen_snapshot_recover_volume(snapshot_info, volume_info)


@gen.coroutine
def _gen_snapshot_recover_volume(snapshot_info, volume_info):
    size = snapshot_info["size_gb"]
    tenant_id = snapshot_info["tenant"]["id"]
    source_volid = snapshot_info["id"]
    metadata = volume_info["metadata"]
    metadata["snapshot_id"] = source_volid
    location = snapshot_info["location"]
    volume_type = location[location.rindex("#") + 1:]
    recover_name = "ecloud-recover-%s" % snapshot_info["name"][len("ecloud-snapshot-"):]
    availability_zone = location[:location.index("@")] if "lvm" in location else None
    try:
        yield volume_request.volume_create(size, tenant_id, consistencygroup_id=None,
                                           snapshot_id=None,
                                           source_volid=source_volid, name=recover_name,
                                           description=4,
                                           volume_type=volume_type, user_id=None,
                                           project_id=tenant_id, availability_zone=availability_zone,
                                           metadata=metadata, image_ref=None,
                                           scheduler_hints=None,
                                           source_replica=None)
    except Exception as e:
        LOG.error("Snapshot recover error when create volume clone. msg:%s", e)
        volume_id = volume_info.get('id')
        volume_metadata = volume_info.get("metadata")
        volume_metadata["status"] = ""
        volume_metadata["recover_status"] = "recover-error"
        snapshot_metadata = snapshot_info.get("metadata")
        snapshot_metadata["status"] = ""
        yield volume_request.update_metadata(volume_id, volume_metadata)
        yield volume_request.update_metadata(snapshot_info["id"], snapshot_metadata)
        raise SnapshotRecoverCreateError()


@gen.coroutine
def _gen_snapshot_recover_vm(vm_id, snapshot_info):
    size = snapshot_info["size_gb"]
    tenant_id = snapshot_info["tenant"]["id"]
    source_volid = snapshot_info["id"]
    metadata = {
        "snapshot_id": source_volid,
        "vm_id": vm_id
    }
    location = snapshot_info["location"]
    volume_type = location[location.rindex("#") + 1:]
    recover_name = "ecloud-recover-%s" % snapshot_info["name"][len("ecloud-snapshot-"):]
    availability_zone = location[:location.index("@")] if "lvm" in location else None
    try:
        yield volume_request.volume_create(size, tenant_id, consistencygroup_id=None,
                                           snapshot_id=None,
                                           source_volid=source_volid, name=recover_name,
                                           description=4,
                                           volume_type=volume_type, user_id=None,
                                           project_id=tenant_id, availability_zone=availability_zone,
                                           metadata=metadata, image_ref=None,
                                           scheduler_hints=None,
                                           source_replica=None)
    except Exception as e:
        LOG.error("Snapshot recover error when create volume clone. msg:%s", e)
        snapshot_id = snapshot_info["id"]
        snapshot_metadata = snapshot_info.get("metadata")
        snapshot_metadata["status"] = ""
        yield set_or_update_vm_meta(vm_id, "status", "")
        yield set_or_update_vm_meta(vm_id, "recover_status", "recover-error")
        yield volume_request.update_metadata(snapshot_id, snapshot_metadata)
        raise SnapshotRecoverCreateError()


class CreateRecoverEndExecuter(MessageExecuter):
    def event(self):
        return "volume.create.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        name = self._message.get("display_name")
        if name.startswith('ecloud-recover-'):
            raise gen.Return(True)
        raise gen.Return(False)

    @gen.coroutine
    def execute(self):
        try:
            success = False
            if self._message.get("status") == "available":
                success = True
            volume_name = self._message.get("display_name")
            volume_id = self._message.get("volume_id")
            v_metadata = yield get_metadata(volume_id)
            source_name = volume_name[len("ecloud-recover-"):]
            snapshot_id = v_metadata.get("snapshot_id")
            LOG.debug("recover snapshot  source name  is %s  snapshot is %s ", source_name, snapshot_id)
            if source_name.startswith("vd-"):
                source_volume = yield get_volume(name=source_name)
                source_id = source_volume["id"]
                if success:
                    if source_volume.get("attachments"):
                        vm_id = source_volume["attachments"][0]["vm_id"]
                        yield attach_server_volume(vm_id, volume_id)
                    else:
                        yield volume_request.volume_update(volume_id, name=volume_name[len('ecloud-recover-'):],
                                                           description=0)

                        yield volume_request.volume_update(source_id, description=5)
                        yield volume_request.volume_delete(source_id)
                        LOG.debug("recover snapshot  delete source_id  [%s]  success ! ", source_id)
                else:
                    v_metadata["recover_status"] = "recover-error"
                v_metadata["status"] = ""
                yield volume_request.update_metadata(volume_id, v_metadata)
                yield delete_metadata(snapshot_id, ["status"])
            else:
                vm = yield compute.get_server(name=source_name, detailed=False)
                vm_id = vm["id"]
                if success:
                    yield attach_server_volume(vm_id, volume_id)
                else:
                    yield set_or_update_vm_meta(vm_id, "recover_status", "recover-error")
            if not success:
                yield volume_request.volume_delete(volume_id)
        except Exception, e:
            LOG.error("Create Recover Volume Error %s" % e)


class HardRebootExecuter(MessageExecuter):
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
            instance_id = self._message.get("instance_id")
            vm = yield compute.get_server_metas(instance_id)
            sys_volume_id = vm.get(compute.NEED_DELETE_SYS_VOLUME)
            if sys_volume_id:
                yield volume_request.volume_delete(sys_volume_id)
                LOG.debug("recover snapshot vm is is [%s] delete sys_volume_id  [%s]  end ! ", instance_id,
                          sys_volume_id)
        except Exception, e:
            LOG.error("recover vm reboot  end process error %s" % e)


class CreateSnapshotEndExecuter(MessageExecuter):
    def event(self):
        return "volume.create.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        name = self._message.get("display_name")
        if name.startswith('ecloud-snapshot-'):
            raise gen.Return(True)
        raise gen.Return(False)

    @gen.coroutine
    def execute(self):
        try:
            volume_name = self._message.get("display_name")
            volume_id = self._message.get("volume_id")
            volume_metas = yield volume_request.volume_metadata([volume_id])
            volume_meta = {}
            for item in volume_metas:
                if item["meta_key"] not in volume_meta:
                    volume_meta[item["meta_key"]] = {}
                volume_meta[item["meta_key"]] = item["meta_value"]
            old_volume_id = volume_meta.get("volume_id")
            old_volume_status = volume_meta.get("source_status")
            if volume_name.startswith("ecloud-snapshot-vm"):
                old_volume_id = volume_meta.get("sys_volume_id")
                vm_id = volume_meta.get("vm_id")
                if vm_id:
                    yield set_or_update_vm_meta(vm_id, "status", "")
            else:
                yield delete_metadata(old_volume_id, ["status"])
            yield volume_request.reset_state(volume_id=old_volume_id, volume_state=old_volume_status)
        except Exception, e:
            LOG.error("sysvolume clone end update task status error %s" % e)


class DelDiskEndExecuter(MessageExecuter):
    def event(self):
        return "volume.delete.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        name = self._message.get("display_name")
        if name.startswith("ecloud-snapshot-"):
            raise gen.Return(True)
        raise gen.Return(False)

    @gen.coroutine
    def execute(self):
        try:
            tenant_id = self._message.get('tenant_id')
            snapshot_used = yield get_tenant_snapshot_used_quota(tenant_id)
            yield update_tenant_snapshot_quotas(tenant_id,
                                                used_size=snapshot_used["used_size"],
                                                used_count=snapshot_used["used_count"])
        except Exception, e:
            LOG.error("update tenant_snapshot_quotas error when del snapshot %s" % e)


class VolumeAttachEndExecuter(MessageExecuter):
    def event(self):
        return "volume.attach.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        name = self._message.get("display_name")
        if name.startswith('ecloud-recover-vd'):
            raise gen.Return(True)
        raise gen.Return(False)

    @gen.coroutine
    def execute(self):
        try:
            volume_id = self._message.get('volume_id')
            volume_name = self._message.get("display_name")
            source_volume_name = volume_name[len("ecloud-recover-"):]
            source_volume = yield get_volume(name=source_volume_name)
            source_id = source_volume["id"]
            source_volume_metadata = source_volume["metadata"]
            source_volume_metadata["status"] = "deleting"
            if source_volume["attachments"]:
                vm_id = source_volume["attachments"][0]["vm_id"]
                volume_request.update_metadata(source_id, source_volume_metadata)
                yield volume_request.volume_update(volume_id, name=volume_name[len('ecloud-recover-'):], description=0)
                yield volume_request.volume_update(source_id, description=5)
                yield detach_server_volume(vm_id, source_id)
        except Exception, e:
            LOG.error("Volume Recover When Attach Volume End Error %s" % e)


class VolumeAttachEndExecuter(MessageExecuter):
    def event(self):
        return "volume.attach.end"

    def queue(self):
        return "ecloud-openstack"

    @gen.coroutine
    def prepare(self):
        name = self._message.get("display_name")
        if name.startswith('ecloud-recover-vm'):
            raise gen.Return(True)
        raise gen.Return(False)

    @gen.coroutine
    def execute(self):
        try:
            volume_id = self._message.get('volume_id')
            volume_name = self._message.get("display_name")
            vm_name = volume_name[len("ecloud-recover-"):]
            LOG.debug("vm recover message is %s", self._message)
            source_volume = yield get_volume(volume_id=volume_id, vd_type=4)
            metadata = source_volume["metadata"]
            vm_id = metadata.get("vm_id")
            snapshot_id = metadata.get("snapshot_id")
            volume_info = yield list_server_attach_volume(vm_id, vd_type=1)
            sys_volume_id = volume_info[0]["volume_id"]

            yield snapshotdao.update_block_device_mapping(vm_id, volume_id)

            new_sys_volume_name = "ecloud-sys-volume-%s" % vm_name
            yield volume_request.volume_update(volume_id, name=new_sys_volume_name, description=1)

            yield snapshotdao.update_volume_db(volume_id=sys_volume_id, status="available",
                                               attach_status="detached")
            yield volume_request.volume_update(sys_volume_id, description=5)
            yield set_or_update_vm_meta(vm_id, compute.NEED_DELETE_SYS_VOLUME, sys_volume_id)
            yield compute.server_action(vm_id, "reboot", info={"type": "HARD"})
        except Exception, e:
            LOG.error("VM Recover When Attach Volume End Error %s" % e)
        else:
            yield compute.set_or_update_vm_meta(vm_id, "status", "")
            yield delete_metadata(snapshot_id, ["status"])


@gen.coroutine
def test_list():
    try:
        snapshots = yield volume_list()
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(snapshots)


@gen.coroutine
def main():
    used_quota = yield get_tenant_snapshot_used_quota("1d4eed1ceb064a6f9bd366eb946fc169")
    a = used_quota
    # volume_info = yield volume.list_volume()
    # print "volume_info==", volume_info
    # print "volume_info==", [vol.get("id") for vol in volume_info]
    # print "volume_info=", [vol for vol in volume_info if vol.get("name") == "backuptest"]
    # volume_info = yield backup_list("aa")
    # volume_info = yield backup_get(backup_id="f3cc3b4b-b3c7-44ba-a716-3e5a0d817f61")
    # volume_info = yield volume.get_volume("f3cc3b4b-b3c7-44ba-a716-3e5a0d817f61")
    # print "volume_info=", volume_info
    # params = {"type": "vm", "id": "e548d54b-57af-4a0c-b5be-7610748c02e5"}
    # backu_tree_info = yield backup_details(params)
    # print "backu_tree_info====", backu_tree_info
    # vm_list = yield compute.list_server()
    # print "vm_list====", vm_list
    # print "vm_list====", [vm.get("server") for vm in vm_list]
    #
    # backup_static = yield backup_list_static(backup_type="volume")
    # print "backup_static=", backup_static
    # params = {
    #     "type": "volume",
    #     "vm_id": "d544aae3-05b6-4208-a34b-075aa47b2bf5",
    #     "name": "backuptest1111",
    #     "description": "qqqqwwwwwwvolumewwwww",
    #     "volume_ids": ["aea3b0aa-d76f-4e13-aa46-7366b2408905"]
    # }
    # create_ok = yield backup_create(params)
    # print "create_ok===", create_ok
    # result = yield test_list()
    # # print result
    # for res in result:
    #     if res.get("description"):
    #         if "ecloud-backup-" in res.get("description"):
    #             print "backup===", res
    # backups = [res for res in result if "ecloud-backup-" in res.get("description")]
    # print backups
    # backup_info = yield backup_get("03ccb88b-357d-432b-a6bf-fb1132038262")
    # print "backup_info=====", backup_info
    # yield backup_restore(backup_info)


if __name__ == "__main__":
    from tornado import ioloop
    from easted.core import dbpools

    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
