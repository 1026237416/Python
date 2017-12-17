# -*- coding: utf-8 -*-
from tornado import gen
from easted.core import openstack
import socket
import netaddr
from exception import *

import logging

LOG = logging.getLogger('system')

__version = "/v2.0"


@gen.coroutine
def request_create_ports(tenant, body):
    url = __version + "/ports"
    body = {
        "port": body
    }
    try:
        session = yield openstack.get_session(tenant)
        result_ports = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url,
                body=body,
                method=openstack.METHOD_POST,
                response_key="port"
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_ports)


@gen.coroutine
def request_delete_ports(tenant, port):
    url = __version + "/ports/%s" % port
    try:
        session = yield openstack.get_session(tenant)
        result_ports = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url,
                method=openstack.METHOD_DELETE,
                response_key="port"
        )
        LOG.debug("delete ports end teant is %s port is %s", tenant, port)
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_ports)


@gen.coroutine
def request_list_ports(**params):
    url = __version + "/ports"
    urlcon = ''
    if params:
        for item in params:
            urlcon += (item + "=" + params.get(item))
        url = url + "?" + urlcon

    try:
        session = yield openstack.get_session()
        result_ports = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url,
                method=openstack.METHOD_GET
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_ports)


@gen.coroutine
def request_create_network(body):
    url = __version + "/networks"

    try:
        session = yield openstack.get_session()
        result_networks = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url,
                method=openstack.METHOD_POST,
                body=body
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_networks)


@gen.coroutine
def request_get_networks(network_id):
    url = __version + "/networks/%s" % network_id
    try:
        session = yield openstack.get_session()
        result_networks = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url,
                method=openstack.METHOD_GET
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_networks)


@gen.coroutine
def request_list_networks(**params):
    """
        获取vlan列表
    :return:
    """
    url = __version + "/networks"
    if params:
        paramsList = []
        for item in params:
            paramsList.append(item + "=" + params.get(item))
        url = url + "?" + "&".join(paramsList)

    try:
        session = yield openstack.get_session()
        result_networks = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url,
                method=openstack.METHOD_GET
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_networks)


@gen.coroutine
def request_delete_network(network_id):
    url = __version + "/networks"
    try:
        session = yield openstack.get_session()
        result_networks = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url + "/" + network_id,
                method=openstack.METHOD_DELETE,
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_networks)


@gen.coroutine
def request_update_network(network_id, body):
    url = __version + "/networks"
    try:
        session = yield openstack.get_session()
        result_networks = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url + "/" + network_id,
                method=openstack.METHOD_PUT,
                body=body
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_networks)


@gen.coroutine
def request_create_subnet(body):
    """
        创建subnet
    :return:
    """
    url = __version + "/subnets"
    try:
        session = yield openstack.get_session()
        result_subnet = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url,
                method=openstack.METHOD_POST,
                body=body
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_subnet)


@gen.coroutine
def request_list_subnet():
    """
        获取subnet
    :return:
    """
    url = __version + "/subnets"
    try:
        session = yield openstack.get_session()
        result_subnet = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url,
                method=openstack.METHOD_GET,
                response_key="subnets"
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_subnet)


@gen.coroutine
def request_delete_subnet(subnets):
    """
        获取subnet
    :return:
    """
    url = __version + "/subnets/%s"

    try:
        session = yield openstack.get_session()
        result_subnet = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url % subnets,
                method=openstack.METHOD_DELETE
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_subnet)


@gen.coroutine
def request_update_subnet(subnet_id, body):
    """
        更新 subnet
    :return:
    """
    url = __version + "/subnets/%s"
    try:
        session = yield openstack.get_session()
        result_subnet = yield openstack.connect_request(
                session=session,
                type=openstack.TYPE_NETWORK,
                url=url % subnet_id,
                method=openstack.METHOD_PUT,
                body=body
        )
    except Exception as e:
        LOG.error(e)
        raise e
    raise gen.Return(result_subnet)



def beyond_cidr_by_ip(cidr, ip):
    """ to determine ip beyond cidr
    :param cidr: network cidr
    :param ip: checked ip
    """
    cidr_ip_range = tuple(netaddr.IPNetwork(cidr))
    return netaddr.IPAddress(ip) in cidr_ip_range


def check_ip_standard(ip):
    try:
        socket.inet_aton(ip)
    except Exception as e:
        raise IpNotStandardError


def struct_convert(source, dict_key, dict_val):
    """
    Struct convert
    :param source:
    [{
        "key":"val1",
    },{
        "key":"val2"
    },
    ...]
    :param dict_key: key
    :param dict_val: val
    :return:{
        key:[val1,val2]
    }
    """
    result = {}
    for item in source:
        if item[dict_key] in result:
            result[item[dict_key]].append(item[dict_val])
        else:
            result[item[dict_key]] = [item[dict_val]]
    return result
