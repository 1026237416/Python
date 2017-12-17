# -*- coding: utf-8 -*-
import logging

from tornado import gen
from easted.core import dbpools
import easted.core.openstack as os
from easted import volume as _vm
from easted.utils import required, is_equals
from exception import AttachBeyondDomainError, \
    ServerAttachVolumeError, ServerDetachVolumeError

LOG = logging.getLogger("system")
__all__ = ["list_server_attach_volume",
           "detach_server_volume",
           "attach_server_volume"
           ]


@gen.coroutine
def server_request(request_url, response_key="volumeAttachments",
                   method=os.METHOD_GET, request_body=None):
    """ volume async request decorators
    :param request_url: the action url of handle volume
    :param response_key: the key of response: volume or volumes
    :param method: request method: get, post, delete, put
    :param request_body: request body: A dict
    :return:
    """
    session = yield os.get_session()
    result = yield os.connect_request(session=session, type=os.TYPE_COMPUTE,
                                      method=method, url=request_url,
                                      response_key=response_key, body=request_body)
    raise gen.Return(result)


@gen.coroutine
@required("server_id")
def list_server_attach_volume(server_id, vd_type=0):
    params = []
    try:
        db = dbpools.get_pool(dbpools.CINDER_DB)
        sql = "SELECT  v.size, v.display_name as name, v.host, v.status as status, vmate.value as displayname, vt.name as type, va.volume_id, va.instance_uuid as vm_id, va.mountpoint " \
              "FROM (SELECT id, volume_id, instance_uuid, mountpoint " \
              "FROM volume_attachment WHERE deleted=0 and instance_uuid=%s) va " \
              "left join volumes v on v.id=va.volume_id " \
              "left join volume_types vt on v.volume_type_id=vt.id " \
              "left join ( SELECT a.id, a.key, a.value, a.volume_id FROM volume_metadata a WHERE a.key='displayname') vmate on vmate.volume_id=v.id "\
              "where v.display_description "
        params.append(server_id)
        if isinstance(vd_type, list):
            sql += "in %s"
            params.append(tuple(vd_type))
        else:
            sql += "=%s"
            params.append(vd_type)
        cur = yield db.execute(sql, params)
        volumes = cur.fetchall()
    except Exception, e:
        LOG.error("list server attach volume error: %s" % e)
        raise e
    raise gen.Return(volumes)


@gen.coroutine
@required("server_id", "volume_id")
def attach_server_volume(server_id, volume_id, device=None):
    """ attach specific volume to specific server
    :param server_id: The :id: Server
    :param volume_id: The :id: volume
    :param device: attach device name,default None
    :return:
    """
    try:
        body = {'volumeAttachment': {'volumeId': volume_id,
                                     'device': device}}
        url = "/servers/%s/os-volume_attachments" % server_id
        attachment =yield server_request(request_url=url, method=os.METHOD_POST,
                             request_body=body, response_key="volumeAttachment")
    except Exception as e:
        LOG.error("attach volume to server error: %s" % e)
        raise ServerAttachVolumeError
    raise gen.Return(attachment)

@gen.coroutine
@required("server_id", "volume_id")
def detach_server_volume(server_id, volume_id):
    """ detach specific volume from specific server
    :param server_id: The :id: Server
    :param volume_id: The :id: volume
    """
    try:
        url = "/servers/%s/os-volume_attachments/%s" % (server_id, volume_id)
        yield server_request(request_url=url, method=os.METHOD_DELETE)
    except Exception as e:
        LOG.error("detach volume from server error: %s" % e)
        yield __force_detach_server_volume(volume_id)


@gen.coroutine
def __force_detach_server_volume(volume_id):
    """ force detach specific volume from specific server
    :param volume_id: The :id: volume
    """
    try:
        volume = yield _vm.get_volume(volume_id=volume_id, detailed=False)
        if volume['status'] != 'in-use':
            yield __force_del_detach_volume(volume_id)
            yield _vm.force_delete_volume_from_db(volume_id=volume_id)
        else:
            raise ServerDetachVolumeError()
    except Exception as e:
        LOG.error("force detach volume from server error: %s" % e)


@gen.coroutine
def __force_del_detach_volume(volume_id):
    """ force detach specific volume from specific server
    :param volume_id: The :id: volume
    """
    try:
        try:
            db = dbpools.get_nova()
            yield dbpools.execute_commit(
                    db,
                    "delete from block_device_mapping where volume_id = %s",
                    (volume_id)
            )
        except Exception, e:
            LOG.error("force delete server attach volume from db error: %s" % e)
            raise e
    except Exception as e:
        LOG.error("force del server detach volume error: %s" % e)


@gen.coroutine
def main():
    volume_id = "1440e1b2-9647-47f0-9e36-4db64f18142f"
    server_id = "ed32f4a3-acd9-4264-a1f1-75eabed29ae4"
    # yield attach_server_volume(volume_id=volume_id,
    #                            server_id=server_id)

    yield detach_server_volume(volume_id=volume_id,
                               server_id=server_id)
    # vm = {"server_id": server_id,
    #       "server_name": 'vm-82',
    #       "server_network": "",
    #       "server_os": 'xp'}
    # attach_vm = {"attach_vm": str(vm)}
    # yield set_metadata(volume_id, attach_vm)
    # yield delete_metadata(volume_id, vm.keys())
    # yield delete_metadata(volume_id, attach_vm.keys())


if __name__ == "__main__":
    from tornado import ioloop
    #from easted.core import dbpools

    #dbpools.init()

    ioloop.IOLoop.current().run_sync(main)
