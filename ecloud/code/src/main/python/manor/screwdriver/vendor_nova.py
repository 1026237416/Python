# coding=utf-8
from keystoneclient import session
from keystoneclient.auth.identity import v2
from novaclient import client


def get_client():
    from manor.util import cfgutils
    auth=v2.Password(auth_url=cfgutils.getval('heat','auth_url'),
                     username=cfgutils.getval('heat','username'),
                     password=cfgutils.getval('heat','password'),
                     tenant_name=cfgutils.getval('heat','tenant_name'))
    sess=session.Session(auth=auth)
    region=cfgutils.getval('heat','region')
    if region=='None':
        region=None

    return client.Client('2',session=sess,region_name=region)


def get_info(resource_id):
    return get_client().servers.get(resource_id)


def start_server(resource_id):
    server=get_info(resource_id)
    server.start()


def stop_server(resource_id):
    server=get_info(resource_id)
    server.stop()


def reboot_server(resource_id):
    server=get_info(resource_id)
    server.reboot()


def force_delete(resource_id):
    server=get_info(resource_id)
    server.force_delete()


def delete_server(resource_id):
    server=get_info(resource_id)
    server.delete()


def list():
    return get_client().servers.list()


def get_images():
    return [_.to_dict() for _ in get_client().images.list()]


def get_flavors():
    return [_.to_dict() for _ in get_client().flavors.list()]


def get_nets():
    return [_.to_dict()['id'] for _ in get_client().networks.list()]


def get_networks():
    return [_.to_dict() for _ in get_client().networks.list()]
