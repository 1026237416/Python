# -*- coding: utf-8 -*-
from tornado import gen
import logging

from easted.snapshot.exception import SnapShotNotExist
from easted.core.authen import get_user
from easted.core.exception import InvalidateParam
from easted.core.rest import put, RestHandler, Response, delete, get, post
from easted.snapshot import SnapshotTypeNotStandard, snapshot_create
from easted.compute import get_server, VmNotExist
from easted.volume import get_volume, VolumeNotExist
from easted import snapshot as snapshot_package
import easted.log as optLog
from easted.log import Type, Operator
from easted import volume as volume_package
from easted.utils import trace

LOG = logging.getLogger('system')
from easted import config

CONF = config.CONF


def enum_recover_status(status, r_status):
    if r_status:
        return "error"

    if status == "snapshoting":

        return "snapshoting"

    elif status == "recovering":
        return "recovering"

    elif status == "deleting":
        return "deleting"

    else:
        return "available"


class Service(RestHandler):
    """ volume_type management
    """

    @gen.coroutine
    @put(_path="/snapshot", _required=["type", "id", "name"])
    def create_volume_snapshot(self, params):
        """
        :param params:
        {
            'type':'snapshot_type',  0:vm;1:vd
            'id':"source_id",
            'name':'name',
            'description':'description',
            'volume_ids':[id1,id2...]
        }
        :return:
        """
        snapshot_type = params.get("type")
        source_id = params.get("id")
        name = params.get("name")
        description = params.get("des", "")
        volume_ids = params.get("volume_ids", [])
        if snapshot_type not in [0, 1]:
            raise SnapshotTypeNotStandard
        if snapshot_type == 0:
            info = yield get_server(vm_id=source_id)
            if not info:
                raise VmNotExist()
        else:
            info = yield get_volume(volume_id=source_id)
            if not info:
                raise VolumeNotExist()
        yield snapshot_create(source_id, snapshot_type, name, description, volume_ids)
        if snapshot_type == 0:
            for volume in volume_ids:
                volume_info = yield volume_package.get_volume(volume_id=volume)
                optLog.write(self.request, Type.SNAPSHOT, volume_info.get("name"), Operator.CREATE, name)
        optLog.write(self.request, Type.SNAPSHOT, info.get("name"), Operator.CREATE, name)
        self.response(Response())

    @gen.coroutine
    @delete(_path="/snapshot/{snapshot_id}")
    def delete_snapshot(self, snapshot_id):
        """
        :param snapshot_id:
        :return:
        """
        snapshot = yield snapshot_package.get_snapshot(snapshot_id)
        if not snapshot:
            raise SnapShotNotExist
        snapshot_info = yield snapshot_package.delete_snapshot(snapshot_id)
        snapshot_name = snapshot_info["name"]
        name = snapshot_name[len("ecloud-snapshot-"):]
        optLog.write(self.request, Type.SNAPSHOT, name, Operator.DELETE,
                     snapshot_info["metadata"].get("displayname", ""))
        self.response(Response())

    @gen.coroutine
    @delete(_path="/snapshots")
    def delete_snapshots(self):
        """
        :return:
        """
        snapshots = yield volume_package.list_volume(detailed=False, vd_type=2)
        for snapshot_item in snapshots:
            snapshot_info = yield snapshot_package.delete_snapshot(snapshot_item["id"])
        self.response(Response())

    @gen.coroutine
    @get(_path="/snapshots/summary")
    def list_snapshot_summary(self, type):
        """
        获取云主机或者云硬盘的统计信息
        :param type: 0:vm or 1:volume
        :return:
        """
        curr_user = get_user(self.request)
        tenant_ids = curr_user.get("tenant_role")
        out_snapshots = yield snapshot_package.snapshot_list_summary(snapshot_type=int(type), tenant_id=tenant_ids)
        self.response(Response(result=out_snapshots, total=len(out_snapshots)))

    @gen.coroutine
    @post(_path="/snapshot/{snapshot_id}")
    def update_snapshot_snapshot(self, snapshot_id, params):
        try:
            snapshot = yield snapshot_package.get_snapshot(snapshot_id)
        except BaseException as e:
            LOG.error("snapshot is not exist %s", e)
            LOG.error(trace())
            raise SnapShotNotExist
        volume_name = yield snapshot_package.update_snapshot(snapshot_id, params.get("name"), params.get("des"))
        name = volume_name[len("ecloud-snapshot-"):]
        optLog.write(self.request, Type.SNAPSHOT, name, Operator.UPDATE, params.get("name"))
        self.response(Response())

    @gen.coroutine
    @get(_path="/snapshots/{name}")
    def list_snapshots(self, name):
        """
        :param name:
        :return:
        """
        if name.startswith("vm-"):
            vm = yield get_server(name=name)
            status = vm["state"]
            r_status = vm["recover-status"]
            id = vm['id']
        elif name.startswith("vd-"):
            source = yield get_volume(name=name)
            status = source["status"]
            r_status = source["recover-status"]
            id = source['id']
        else:
            raise InvalidateParam()
        out_snapshots = yield snapshot_package.list_snapshot(name)
        result = {
            "snapshots": out_snapshots,
            "status": status,
            "id": id,
            "recover-status": enum_recover_status(status, r_status)
        }
        self.response(Response(result=result, total=len(out_snapshots)))

    @gen.coroutine
    @get(_path="/snapshot/{snapshot_id}")
    def get_snapshot(self, snapshot_id):
        snapshot = yield snapshot_package.get_snapshot(snapshot_id)
        self.response(Response(result=snapshot))

    @gen.coroutine
    @get(_path="/snapshot/{snapshot_id}/recover")
    def recover_snapshot(self, snapshot_id):
        """
        :param snapshot_id:
        :param params:
        :return:
        """
        snapshot_info = yield snapshot_package.get_snapshot(snapshot_id, detailed=True)
        if not snapshot_info:
            raise SnapShotNotExist
        name = snapshot_info["name"][len("ecloud-snapshot-"):]
        restore_result = yield snapshot_package.snapshot_recover(snapshot_info)
        optLog.write(self.request, Type.SNAPSHOT, name, Operator.RESTORE,
                     snapshot_info["metadata"].get("displayname", ""))
        LOG.debug("Leave restore_volume_snapshot method, id is %s" % id)
        self.response(Response(result={"result": restore_result}))
