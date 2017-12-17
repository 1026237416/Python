# -*- coding: utf-8 -*-
import logging

from tornado import gen
from easted.core.exception import InvalidateParam
from easted.volume import *
from easted.snapshot import *
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get
from easted.core.rest import post
from easted.core.rest import put
from easted.core.rest import delete
from easted.core.authen import get_user
from easted.log import log
from easted import config
from easted.volume import set_volume_user
from easted.identify.tenant_users import list_tenant_users

LOG = logging.getLogger('system')
CONF = config.CONF


class Service(RestHandler):
    @gen.coroutine
    @get(_path="/volumes")
    def list(self, tenant=None, user=None, detailed="true", available="false", name=None):
        detailed = True if detailed and detailed.lower() == "true" else False
        available = True if available and available.lower() == "true" else False
        curr_user = get_user(self.request)
        tenant_ids = curr_user.get("tenant_role")
        if tenant_ids:
            if tenant and tenant not in tenant_ids:
                raise VolumeTenantUnmatch()
            elif not tenant and tenant_ids:
                tenant = tenant_ids
        rs = yield list_volume(detailed=detailed, name=name, tenant_ids=tenant, user_id=user, available=available)
        self.response(Response(result=rs, total=len(rs)))

    @gen.coroutine
    @get(_path="/volume/{volume_id}")
    def get_volume_by_id(self, volume_id):
        rs = yield list_volume(volume_id=volume_id)
        self.response(Response(result=rs))

    @gen.coroutine
    @get(_path="/volumes/{volume_batch}")
    def get_volumes_by_batch(self, batch):
        if not batch:
            raise InvalidateParam(args=['batch'])
        rs = yield get_volumes_by_batch(batch)
        self.response(Response(result=rs))

    @gen.coroutine
    @get(_path="/volume_types")
    def list_volume_type(self):
        out_volume_types = yield list_volume_type()
        self.response(Response(result=out_volume_types,
                               total=len(out_volume_types)))

    @gen.coroutine
    @put(_path="/volume", _required=["tenant_id", "size"])
    def create_volume(self, volume):
        volume = CloudVolume(**volume)
        if volume.user_id:
            users = yield list_tenant_users(volume.tenant_id)
            user_ids = [user_item["id"] for user_item in users]
            if volume.user_id not in user_ids:
                raise VolumeTenantUserUnmatch(args=[{"user_id": volume.user_id}])
        created_volume = yield create_volume(**volume.__dict__)
        display_name = volume.displayname \
            if volume.displayname else volume.name
        for v in created_volume["names"]:
            log.write(self.request, log.Type.VDISK, v, log.Operator.CREATE, display_name)
        self.response(Response(result={"batch": created_volume['batch_name']}))

    @gen.coroutine
    @post(_path="/volume/{volume_id}")
    def update_volume(self, volume_id, volume):
        vm_des = volume.get('des')
        vm_display_name = volume.get('displayname')
        params = {'displayname': vm_display_name, 'des': vm_des}
        volume = yield get_volume(volume_id, detailed=False)
        if not volume:
            raise VolumeNotExist(args=[volume_id])
        volume_name = yield update_volume(volume_id, **params)
        log.write(self.request, log.Type.VDISK,
                  volume_name, log.Operator.UPDATE, vm_display_name)
        self.response(Response())

    @gen.coroutine
    @delete(_path="/volume/{volume_id}")
    def del_volume(self, volume_id):
        volume = yield get_volume(volume_id)
        if volume:
            if volume.get("status") in (
                    VDISK_STATUS_ATTACH, VDISK_STATUS_BACKUP, VDISK_STATUS_DELETE, VDISK_STATUS_RECOVER):
                raise VolumeOperationFailed

            volume_meta = volume['metadata'] \
                if volume['metadata'] else {}
            volume_meta['status'] = VDISK_STATUS_DELETE
            yield set_metadata(volume_id=volume_id,
                               metadata=volume_meta)

            yield clean_vm_or_volume_snapshot(volume['name'])
            yield delete_volume(volume_id)
        else:
            raise VolumeNotExist
        log.write(self.request, log.Type.VDISK, volume['name'], log.Operator.DELETE, volume['metadata']['displayname'])
        self.response(Response())

    @gen.coroutine
    @delete(_path="/volume/{volume_id}/type/{vd_type}")
    def delete_volume_by_type(self, volume_id, vd_type):
        volume = yield get_volume(volume_id=volume_id, vd_type=int(vd_type))
        if not volume:
            raise VolumeNotExist(args=[volume_id])
        yield delete_volume(volume["id"])
        self.response(Response())

    @gen.coroutine
    @post(_path="/volume_user")
    def volume_user(self, body):
        volume_u = body.get("volume-user")
        if not volume_u:
            raise InvalidateParam(args=['volume-user'])
        for v_u in volume_u:
            volume_id = v_u.get("volume_id")
            volume = yield get_volume(volume_id, detailed=False)
            if not volume:
                raise VolumeNotExist(args=[volume_id])
            users = yield list_tenant_users(volume.get("tenant_id"))
            user_ids = [user_item["id"] for user_item in users]
            if user_ids and v_u.get("user_id") not in user_ids:
                raise VolumeTenantUserUnmatch(args=[{"user_id": v_u.get("user_id")}])
        for v_u in volume_u:
            result = yield set_volume_user(v_u.get("volume_id"), v_u.get("user_id"))
            log.write(self.request, log.Type.VDISK,
                      result['name'], log.Operator.SET_USER, result['displayname']+" "+result['user'])

        self.response(Response())
