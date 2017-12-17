# -*- coding: utf-8 -*-

import logging

from easted.host import HostUnAvailable, get_availability_zone

try:
    import json
except ImportError:
    import simplejson as json
try:
    from urllib import urlencode
except ImportError:
    from urllib.parse import urlencode

from tornado import gen
from easted.utils.cacheUtils import eval_val
import easted.core.openstack as os
from easted import config
from easted.core import dbpools
from easted.utils import required
from easted.identify import get_tenant_by_id, get_user_by_id
from exception import VolumeOperationFailed
from easted.utils import datetimeUtils

__all__ = [
    "volume_request",
    "volume_real_used",
    "volume_action",
    "volume_list",
    "volume_metadata",
    "gen_out_volume",
    "volume_create",
    "volume_delete",
    "volume_update",
    "get_metadata",
    "set_metadata",
    "update_metadata",
    "delete_metadata",
    "upload_to_image",
    "force_delete",
    "force_delete_volume_from_db",
    "volume_type_list",
    "reset_state",
    "volume_state_count",
    "update_volume_image_metadata",
    "get_volume_image_metadata",
    "get_drive_image_id"
]

SORT_DIR_VALUES = ('asc', 'desc')
SORT_KEY_VALUES = ('id', 'status', 'size', 'availability_zone', 'name',
                   'bootable', 'created_at')

LOG = logging.getLogger("system")
config.settings.register(name="storage.share_storage_access")
CONF = config.CONF

@gen.coroutine
def volume_request(request_url, tenant_id=None,
                   response_key="volume",
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
    try:
        session = yield os.get_session(tenant=tenant_id)
        result = yield os.connect_request(session=session, type=os.TYPE_VOLUME,
                                          method=method, url=request_url,
                                          response_key=response_key, body=request_body)
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result)


@gen.coroutine
def volume_real_used(tenant_id):
    try:
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql = "SELECT COUNT(id) as count, SUM(size) as used_size " \
              "FROM volumes " \
              "WHERE display_description = 0 and project_id=%s and status != 'deleted'"
        cur = yield db.execute(sql, [tenant_id])
        volume_used = cur.fetchone()
    except Exception, e:
        LOG.error("volume real used error: %s" % e)
        raise e
    raise gen.Return(volume_used)


@gen.coroutine
def volume_action(action, volume_id, info=None):
    """Perform a volume "action."
    :param action: action volume
    :param volume_id: id of volume
    :param info: action info
    :return:
    """
    body = {action: info}
    url = '/volumes/%s/action' % volume_id
    result = yield volume_request(request_url=url, request_body=body,
                                  method=os.METHOD_POST, response_key="")
    raise gen.Return(result)


@gen.coroutine
def volume_list(volume_id=None, tenant_ids=None, batch=None, user_id=None, name=None, vd_type=0, available=False):
    """
    :param volume_id:
    :param tenant_ids: str or list
    :param user_id:
    :param name: str or list
    :param vd_type:
    :param batch:
    :param available
    :return:[{
        "id":"xxx", volume id
        "name":"xxx", volume name
        "volume_type":"xxx",
        "size_gb":"xxx",
        "status":"xxx",
        "type":"xxx",
        "created_at":"xxx",
        "tenant_id":"xxx",
        "user_id":"xxx",
        "attatchments_id":"xxx",
        "vm_id":"xxx", attatchments vm id
    }]
    """
    try:
        params = []
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql = "SELECT v.id as id, v.display_name as name, CONCAT(substring_index(v.host,'#',1),'#',t.`name`) as host," \
              "v.size as size_gb, v.status as status, v.display_description as type, " \
              "v.created_at as created_at, v.project_id as tenant_id, va.id as attatchments_id," \
              "va.instance_uuid as vm_id, vm.value as user_id " \
              "FROM (SELECT id, display_name, created_at, project_id, size, host,volume_type_id, status, display_description " \
              "FROM volumes WHERE status!='deleted' and  deleted =0  and display_description=%s) v " \
              "LEFT JOIN volume_types as t ON v.volume_type_id = t.id " \
              "LEFT JOIN (SELECT id, instance_uuid,volume_id FROM volume_attachment WHERE deleted=0) va ON v.id=va.volume_id " \
              "LEFT JOIN (SELECT vmt.volume_id, vmt.key, vmt.value FROM volume_metadata vmt WHERE vmt.key='user') vm ON vm.volume_id = v.id "
        sql += " WHERE 1=1 "
        params.append(vd_type)

        if user_id:
            sql += " and vm.value=%s"
            params.append(user_id)
        if tenant_ids and isinstance(tenant_ids, basestring):
            sql += " and v.project_id=%s"
            params.append(tenant_ids)
        elif tenant_ids and isinstance(tenant_ids, list):
            sql += " and v.project_id in %s"
            params.append(tuple(tenant_ids))

        if name and isinstance(name, basestring):
            sql += " and v.display_name=%s"
            params.append(name)
        elif name and isinstance(name, list):
            sql += " and v.display_name in %s"
            params.append(tuple(name))

        if batch:
            sql += " and (v.display_name=%s or v.display_name like %s)"
            params.append(batch)
            params.append(batch + "-%")

        if available:
            sql += " and v.status='available'"

        if volume_id and isinstance(volume_id, basestring):
            sql += " and v.id=%s"
            params.append(volume_id)
        elif volume_id and isinstance(volume_id, list):
            sql += " and v.id in %s"
            params.append(tuple(volume_id))
        else:
            sql += " order by v.created_at desc"
        cur = yield db.execute(sql, params)
        volumes = cur.fetchall()
    except Exception, e:
        LOG.error("Volume list error: %s" % e)
        raise e
    raise gen.Return(volumes)


@gen.coroutine
def get_drive_image_id():
    """
    get drive image id
    :return: image_id
    """
    try:
        db = dbpools.get_pool(dbpools.GLANCE_DB)
        sql = "SELECT image_id FROM image_properties WHERE NAME = 'ecloud_image_type' AND VALUE = '2'"
        cur = yield db.execute(sql)
        result = cur.fetchall()
    except Exception, e:
        LOG.error("Get drive image id error: %s" % e)
        raise e
    image_id = None
    if result:
        image_id = result[0].get("image_id", "")
    raise gen.Return(image_id)

@gen.coroutine
def volume_metadata(volume_ids):
    """
    :param volume_ids: list
    :return:
    """
    try:
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql = "SELECT vm.volume_id as volume_id, vm.key as meta_key, vm.value as meta_value " \
              "FROM volume_metadata vm WHERE volume_id in %s and deleted=0"
        cur = yield db.execute(sql, [tuple(volume_ids)])
        metadatas = cur.fetchall()
    except Exception, e:
        LOG.error("Volume metadata error: %s" % e)
        raise e
    raise gen.Return(metadatas)


@gen.coroutine
def volume_state_count():
    """
    :return:
    """
    try:
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql = "SELECT count(*) count, sum(size) size, display_description as v_type FROM volumes " \
              "WHERE deleted=0 and display_description in (0, 2) GROUP BY display_description"
        cur = yield db.execute(sql)
        metadatas = cur.fetchall()
    except Exception, e:
        LOG.error("Volume state count error: %s" % e)
        raise e
    raise gen.Return(metadatas)


@gen.coroutine
def volume_type_list():
    try:
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql = "SELECT vt.id as id, vt.name as name FROM volume_types vt WHERE vt.deleted=0"
        cur = yield db.execute(sql)
        volume_types = cur.fetchall()
    except Exception, e:
        LOG.error("Volume type list error: %s" % e)
        raise e
    raise gen.Return(volume_types)


@gen.coroutine
def gen_out_volume(volume, metadata):
    """
    :param volume:
    :param metadata:
    :return:
    """
    tenant_id = volume["tenant_id"]
    new_tenant = yield get_tenant_by_id(tenant_id)
    user_id = metadata.get('user', None)
    new_user = {}
    if user_id:
        try:
            new_user = yield get_user_by_id(user_id)
        except Exception:
            metadata["user"] = ""
    attachments = []
    if volume["attatchments_id"]:
        attach = {
            "id": volume["attatchments_id"],
            "vm_id": volume["vm_id"],
            "volume_id": volume["id"]
        }
        attachments.append(attach)
    volume_status = metadata["status"] if "status" in metadata and metadata["status"] else volume['status']
    recover_status = metadata.get("recover_status", "")
    out_volume = {
        "id": volume['id'],
        "name": volume['name'],
        "size_gb": volume['size_gb'],
        "status": volume_status,
        "recover-status": recover_status,
        "location": volume['host'],
        "type": volume["type"],
        "attachments": attachments,
        "tenant": new_tenant,
        "user": new_user,
        "metadata": metadata,
        "created_at": datetimeUtils.time2epoch(volume['created_at'])
    }
    raise gen.Return(out_volume)


@gen.coroutine
@required("size", "tenant_id")
def volume_create(size, tenant_id, consistencygroup_id=None, snapshot_id=None,
                  source_volid=None, name=None, description=None,
                  volume_type=None, user_id=None,
                  project_id=None, availability_zone=None,
                  metadata=None, image_ref=None, scheduler_hints=None,
                  source_replica=None):
    """Creates a volume.

    :param size: Size of volume in GB
    :param tenant_id: Project id derived from context
    :param consistencygroup_id: ID of the consistencygroup
    :param snapshot_id: ID of the snapshot
    :param name: Name of the volume
    :param description: Description of the volume
    :param volume_type: Type of volume
    :param user_id: User id derived from context
    :param project_id: Project id derived from context
    :param availability_zone: Availability Zone to use
    :param metadata: Optional metadata to set on volume creation
    :param image_ref: reference to an image stored in glance
    :param source_volid: ID of source volume to clone from
    :param source_replica: ID of source volume to clone replica
    :param scheduler_hints: (optional extension) arbitrary key-value pairs
                        specified by the client to help boot an instance
    :rtype: :class:`Volume`
   """
    try:
        if metadata is None:
            volume_metadata = {}
        else:
            volume_metadata = metadata

        if volume_type and volume_type.lower() == "lvm":
            availability_zone = yield get_availability_zone(availability_zone)
            if not availability_zone:
                raise HostUnAvailable

        body = {'volume': {'size': size,
                           'consistencygroup_id': consistencygroup_id,
                           'snapshot_id': snapshot_id,
                           'name': name,
                           'description': description,
                           'volume_type': volume_type,
                           'user_id': user_id,
                           'project_id': project_id,
                           'availability_zone': availability_zone if availability_zone else CONF.storage.share_storage_access,
                           'status': "creating",
                           'attach_status': "detached",
                           'metadata': volume_metadata,
                           'imageRef': image_ref,
                           'source_volid': source_volid,
                           'source_replica': source_replica,
                           }}

        if scheduler_hints:
            body['OS-SCH-HNT:scheduler_hints'] = scheduler_hints

        volume = yield volume_request(tenant_id=tenant_id, request_url='/volumes',
                                      method=os.METHOD_POST,
                                      request_body=body, response_key='volume')
    except Exception as e:
        LOG.error("create volume error: %s" % e)
        raise e

    raise gen.Return(volume)


@gen.coroutine
@required("volume_id")
def volume_delete(volume_id):
    """Delete a volume.

    :param volume_id: The :class:`Volume` to delete.
    """
    try:

        del_ok = yield volume_request(request_url="/volumes/%s" % volume_id,
                                      method=os.METHOD_DELETE, response_key='volume')
    except Exception as e:
        yield delete_metadata(volume_id, ["status"])
        LOG.error("delete volume error: %s" % e)
        raise e

    raise gen.Return(del_ok)


@gen.coroutine
@required("volume_id")
def volume_update(volume_id, **kwargs):
    """Update the name or description for a volume.

    :param volume_id: The :class:`Volume` to update.
    """
    try:
        if not kwargs:
            return

        body = {"volume": kwargs}
        url = "/volumes/%s" % volume_id
        yield volume_request(request_url=url, method=os.METHOD_PUT,
                             request_body=body, response_key='volume')
    except Exception as e:
        LOG.error("update volume error: %s" % e)
        raise e


@gen.coroutine
@required("volume_id")
def get_metadata(volume_id):
    """Update/Set a volumes metadata.

    :param volume_id: The :class:`Volume`.
    """
    try:
        url = "/volumes/%s/metadata" % volume_id
        volume_meta = yield volume_request(request_url=url, method=os.METHOD_GET,
                                           response_key='metadata')
    except Exception as e:
        LOG.error("get volume meta error: %s" % e)
        raise VolumeOperationFailed()
    else:
        metadata = {k: eval_val(v) for k, v in volume_meta.items()}

    raise gen.Return(metadata)


@gen.coroutine
@required("volume_id")
def set_metadata(volume_id, metadata):
    """Update/Set a volumes metadata.

    :param volume_id: The :class:`Volume`.
    :param metadata: A list of keys to be set.
    """
    try:
        if not metadata:
            return

        body = {'metadata': metadata}
        url = "/volumes/%s/metadata" % volume_id
        yield volume_request(request_url=url, method=os.METHOD_POST,
                             request_body=body, response_key='metadata')
    except Exception as e:
        LOG.error("update volume error: %s" % e)
        raise VolumeOperationFailed()


@gen.coroutine
@required("volume_id")
def update_metadata(volume_id, metadata):
    """Delete specified keys from volumes metadata.
    :param volume_id: The :id:`Volume`.
    :param metadata: A list of keys to be removed.
    """
    try:
        if not metadata:
            return

        if metadata:
            body = {'metadata': {k: str(v) for k, v in metadata.items()}}
            url = "/volumes/%s/metadata" % volume_id
            yield volume_request(request_url=url, method=os.METHOD_PUT,
                                 request_body=body, response_key='metadata')
    except Exception as e:
        LOG.error("update volume metadata error: %s" % e)
        raise VolumeOperationFailed()


@gen.coroutine
@required("volume_id")
def delete_metadata(volume_id, meta_keys):
    """Delete specified keys from volumes metadata.
    :param volume_id: The :id:`Volume`.
    :param meta_keys: A list of keys to be removed.
    """
    try:
        if not meta_keys:
            return

        for k in meta_keys:
            url = "/volumes/%s/metadata/%s" % (volume_id, k)
            yield volume_request(request_url=url, method=os.METHOD_DELETE,
                                 response_key='metadata')
    except Exception as e:
        LOG.error("delete volume metadata error: %s" % e)
        raise VolumeOperationFailed()


@gen.coroutine
@required("volume_id", "force", "image_name",
          "container_format", "disk_format")
def upload_to_image(volume_id, force, image_name,
                    container_format, disk_format):
    """"Upload volume to image service as image.

    :param volume_id: The :id:`Volume` to upload.
    :param force: force upload or not
    :param image_name: image name
    :param container_format:  image container format
    :param disk_format:  image disk format
    :return:
    """
    try:
        info = {'force': force,
                'image_name': image_name,
                'container_format': container_format,
                'disk_format': disk_format}
        volume = yield volume_action(action="os-volume_upload_image",
                                     volume_id=volume_id, info=info)
    except Exception as e:
        LOG.error("upload volume to image error: %s" % e)
        raise VolumeOperationFailed()

    raise gen.Return(volume)


@gen.coroutine
def update_volume_image_metadata(volume_id, key, value):
    try:
        db = dbpools.get_cinder()
        query_sql = "select * from volume_glance_metadata where volume_id = %s and `key` = %s"
        cur = yield db.execute(query_sql, [volume_id, key])
        res = cur.fetchone()
        if res:
            yield dbpools.execute_commit(
                db,
                "update volume_glance_metadata set `value` = %s  where volume_id = %s and `key` = %s",
                (value, volume_id, key)
            )
        else:
            yield dbpools.execute_commit(
                db,
                "insert into volume_glance_metadata (created_at,deleted,volume_id,`key`,`value`) VALUES (NOW(),0,%s,%s,%s)",
                (volume_id, key, value)
            )
    except Exception, e:
        LOG.error(e.message)
        raise VolumeOperationFailed()


@gen.coroutine
def get_volume_image_metadata(volume_id):
    try:
        rs = {}
        sql = "select `key`,`value` from volume_glance_metadata where volume_id = %s"
        db = dbpools.get_cinder()
        cur = yield db.execute(sql, [volume_id])
        image_meta = cur.fetchall()
        if image_meta:
            for i in image_meta:
                rs[i.get("key")] = i.get("value")
    except Exception, e:
        LOG.error(e.message)
        raise VolumeOperationFailed()
    raise gen.Return(rs)


@gen.coroutine
@required('volume_id')
def force_delete(volume_id):
    """ force delete volume
    :param volume_id: THe :id: Volume
    :return:
    """
    try:
        yield force_delete_volume_from_db(volume_id=volume_id)
        volume = yield volume_action(action="os-force_delete",
                                     volume_id=volume_id)
    except Exception as e:
        LOG.error("force delete volume error: %s" % e)
        raise VolumeOperationFailed()

    raise gen.Return(volume)


@gen.coroutine
def force_delete_volume_from_db(volume_id):
    """ clear volume attachment info from cinder db
    :param volume_id: id of volume
    :return:
    """
    try:
        db = dbpools.get_cinder()
        yield dbpools.execute_commit(
            db,
            "update volumes set status='available', attach_status='detached' "
            "where id = %s",
            (volume_id)
        )
        yield dbpools.execute_commit(
            db,
            "delete from volume_attachment where volume_id = %s",
            (volume_id)
        )
    except Exception as e:
        LOG.error("force delete volume from db error: %s" % e)
        raise e


@gen.coroutine
@required("volume_id", "volume_state")
def reset_state(volume_id, volume_state):
    """Update the provided volume with the provided state.
    :param volume_id: The :id: Volume
    :param volume_state: The status of volume to alter
    """
    try:
        volume = yield volume_action(action="os-reset_status",
                                     volume_id=volume_id,
                                     info={'status': volume_state})
    except Exception as e:
        LOG.error("reset volume state error: %s" % e)
        raise VolumeOperationFailed()

    raise gen.Return(volume)


from easted.utils import timeit


@gen.coroutine
@timeit
def main():
    volume_id = "989f54ac-a25e-4860-8db8-3a31beab4032"
    metas = yield get_metadata(volume_id)
    print(metas)
    metadata = {'attach_vm':
                    {'server_displayname': u'de',
                     'server_id': u'735b774a-dcc2-49dc-838b-bc0424ccf806',
                     'server_os': u'windows',
                     'server_ip': {u'ajuan': [u'192.168.1.5']},
                     'server_name': u'vm-131'},
                'des': 'vd-59',
                'user': '1ddbc299d64f455baf3c7f429f7c3e5d',
                'order': 'vd1603260067'}
    yield update_metadata(volume_id, metadata)
    metas = yield get_metadata(volume_id)
    print(metas)


if __name__ == "__main__":
    from tornado import ioloop
    from easted.log import log

    log.init()
    ioloop.IOLoop.current().run_sync(main)
