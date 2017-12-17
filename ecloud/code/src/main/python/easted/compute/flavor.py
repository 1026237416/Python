# -*- coding: utf-8 -*-
import logging
from tornado import gen
from easted.core import openstack
from easted.utils.encryptUtils import random_password
from easted.core.exception import ClassCastException
from exception import FlavorCreateOrFindError

__author__ = 'litao@easted.com.cn'
LOG = logging.getLogger('system')

__all__ = [
    'list_flavors',
    'get_flavor_by_id',
    'find_or_create_flavor'
]


@gen.coroutine
def get_flavor_by_id(flavor_id):
    """ get flavor by id
    :param flavor_id: id of flavor
    :return: flavor={}
    """
    out_flavor = {}
    try:

        url = '/flavors/%s' % flavor_id
        session = yield openstack.get_session()
        flavor = yield openstack.connect_request(session=session, type=openstack.TYPE_COMPUTE, url=url,
                                                 method=openstack.METHOD_GET, response_key="flavor")
    except Exception, e:
        LOG.error("get flavor by id error: %s" % e)
        raise FlavorCreateOrFindError()
    else:
        if flavor:
            out_flavor = __package_flavor(flavor)
    raise gen.Return(out_flavor)


@gen.coroutine
def list_flavors(detailed=True):
    """ list flavors
    :param detailed:
    :return: flavors={}
    """
    out_flavors = []
    try:
        query_string = "?is_public=true"
        detail = ""
        if detailed:
            detail = "/detail"
        url = "/flavors%s%s" % (detail, query_string)
        session = yield openstack.get_session()
        flavors = yield openstack.connect_request(session=session, type=openstack.TYPE_COMPUTE, url=url,
                                                  method=openstack.METHOD_GET, response_key="flavors")
    except Exception, e:
        LOG.error("list flavor error: %s" % e)
        raise FlavorCreateOrFindError()
    else:
        if flavors:
            for flavor in flavors:
                out_flavors.append(__package_flavor(flavor))
    raise gen.Return(out_flavors)


def __package_flavor(flavor):
    """
    :param flavor:
    :return:
    """
    try:
        return {
            "id": flavor['id'],
            "name": flavor['name'],
            "cores": flavor['vcpus'],
            "memory": flavor['ram'],
            "is_public": flavor['os-flavor-access:is_public'],
            "ephemeral": flavor['OS-FLV-EXT-DATA:ephemeral'],
            "disk_capacity": flavor['disk'],
            "disabled": flavor['OS-FLV-DISABLED:disabled']
        }
    except Exception, e:
        LOG.error("package flavor error %s" % e)
        raise FlavorCreateOrFindError()


@gen.coroutine
def find_or_create_flavor(cores, memory, disk_capacity):
    """ find flavor from flavors with cores, memory, disk_capacity
    :param flavors: the flavors of data center
    :param cores: the vcpus of flavor
    :param memory: the ram of flavor
    :param disk_capacity: the disk of flavor
    :return: flavor
    """
    new_flavor = {}
    flavors = yield list_flavors()
    try:
        if flavors:
            for flavor in flavors:
                if int(cores) == int(flavor['cores']) and \
                                int(memory) == int(flavor['memory']) and \
                                int(disk_capacity) == int(flavor['disk_capacity']):
                    new_flavor = flavor
                    break
        if not new_flavor:
            new_flavor = yield __create_flavor(cores, memory, disk_capacity)
    except Exception, e:
        LOG.error("find flavor by sets error: %s" % e)
        raise FlavorCreateOrFindError()
    raise gen.Return(new_flavor)


@gen.coroutine
def __create_flavor(cores, memory, disk_capacity):
    """ create flavor if has not flavor of setting,
        vcpus = cores, ram = memory.
    :param cores: the vcpus of flavor
    :param memory: the ram of flavor
    :param disk_capacity: the disk of flavor
    """
    new_flavor = {}
    try:
        try:
            memory = int(memory)
        except (TypeError, ValueError):
            raise ClassCastException()
        try:
            cores = int(cores)
        except (TypeError, ValueError):
            raise ClassCastException()
        try:
            disk_capacity = int(disk_capacity)
        except (TypeError, ValueError):
            raise ClassCastException()

        if cores and memory and disk_capacity:
            flavor_name = "m1.flavor-%s" % random_password(12)
            body = __build_body(flavor_name, memory, cores, disk_capacity)
            url = "/flavors"
            session = yield openstack.get_session()
            flavor = yield openstack.connect_request(session=session, type=openstack.TYPE_COMPUTE, url=url, body=body,
                                                     method=openstack.METHOD_POST, response_key="flavor")
            if flavor:
                new_flavor = __package_flavor(flavor)
    except Exception, e:
        LOG.error("create flavor error: %s" % e)
        raise FlavorCreateOrFindError()
    raise gen.Return(new_flavor)


def __build_body(name, ram, vcpus, disk):
    return {
        "flavor": {
            "name": name,
            "ram": ram,
            "vcpus": vcpus,
            "disk": disk,
            "id": None,
            "swap": 0,
            "OS-FLV-EXT-DATA:ephemeral": 0,
            "rxtx_factor": 1.0,
            "os-flavor-access:is_public": True,
        }
    }




@gen.coroutine
def main():
    # flavors =  yield list_flavors()
    # flavor = yield  get_flavor_by_id(1)
    # cores, memory, disk_capacity
    # flavor = yield  find_or_create_flavor(1,512,2)
    # yield update_vlan_ip(vlan_id=vlan, ip=ip['ip'], user_id=vm.metadata.user,
    #                                     instance_id=vm_name, used=1, host_id=None, des=vm.metadata.order)
    a = yield dbpools.update(dbpools.get_local(),"update vlan_ips set used = 1 where ip = '192.168.10.25' and used != 1",param=None)
    print a
if __name__ == '__main__':
    from tornado import ioloop
    from easted import log
    from easted.core import dbpools
    log.init()
    openstack.init()
    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)

