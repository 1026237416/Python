# -*- coding: utf-8 -*-
import logging
import copy
from easted.core import dbpools
from easted.utils import trace

try:
    import json
except ImportError:
    import simplejson as json

try:
    from urllib import urlencode
except ImportError:
    from urllib.parse import urlencode
from tornado import gen

import easted.core.openstack as os
import easted.config as cfg
from easted.security_group.constants import *
from easted.security_group.exception import *

__author__ = 'yangkefeng@easted.com.cn'
CONF = cfg.CONF
LOG = logging.getLogger("system")

security_groups_path = "/v2.0/security-groups"
security_group_path = "/v2.0/security-groups/%s"
security_group_rules_path = "/v2.0/security-group-rules"
security_group_rule_path = "/v2.0/security-group-rules/%s"


@gen.coroutine
def security_group_request(request_url, tenant_id=None,
                           response_key=None,
                           method=os.METHOD_GET,
                           request_body=None):
    """ security group async request decorators
    :param request_url: the action url of handle volume
    :param tenant_id: the id of tenant, default None
    :param response_key: the key of response: volume or volumes
    :param method: request method: get, post, delete, put
    :param request_body: request body: A dict
    :return:
    """
    session = yield os.get_session(tenant=tenant_id)
    result = yield os.connect_request(session=session, type=os.TYPE_NETWORK,
                                      method=method, url=request_url,
                                      response_key=response_key, body=request_body)
    raise gen.Return(result)


@gen.coroutine
def global_delete_rules_from_db(admin_rule_id=None):
    '''
                    return admin_rule['direction'] == sgr['direction'] and \
                    admin_rule['cidr'] == sgr['remote_ip_prefix'] and \
                    admin_rule['protocol'] == sgr['protocol'] and \
                    admin_rule['to_port'] == sgr['port_range_max'] and \
                    admin_rule['from_port'] == sgr['port_range_min'] and \
                    admin_rule['ethertype'] == sgr['ethertype']
            sql = "select id, security_group_id, remote_group_id, direction, ethertype, protocol, " \
                "port_range_min, port_range_max, remote_ip_prefix " \
                "from securitygrouprules where 1=1 "
            if admin_rule:
                sql += "and direction = admin_rule['direction'] and remote_ip_prefix = admin_rule['cidr'] " \
                   "and protocol = admin_rule['protocol'] and to_port = admin_rule['to_port'] " \
                   "and from_port = admin_rule['from_port'] and ether_type = admin_rule['ethertype']"
'''
    try:
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        sql = "select  securitygrouprules where 1=1 "
        yield db.execute(sql)

    except Exception as e:
        LOG.error("global_del_rules error %s" % e)
#         raise SecGroupRuleOperationFailed()


@gen.coroutine
def get_admin_sgr_by_db(rule_id=None, tenant_id=None):
    try:
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        sql = "select tenant_id, id, security_group_id, remote_group_id, direction, ethertype, protocol, " \
              "port_range_min, port_range_max, remote_ip_prefix from securitygrouprules " \
              "where 1=1 "

        if tenant_id:
            sql += " and tenant_id='%s' " % tenant_id
        if rule_id:
            sql += " and id='%s' " % rule_id

        from_db = yield db.execute(sql)
        all_data = from_db.fetchall()

    except Exception as e:
        LOG.error("get securitygrouprules error %s" % e)
        raise SecGroupRuleOperationFailed()
    raise gen.Return(all_data)


@gen.coroutine
def get_security_groups_from_db(tenant_id=None):
    try:
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        sql = "select tenant_id, id, name ,description from securitygroups where 1=1"
        if tenant_id:
            sql += " and tenant_id='%s' " % tenant_id

        from_db = yield db.execute(sql)
        all_data = from_db.fetchall()

    except Exception as e:
        LOG.error("get get_security_groups_from_db error %s" % e)
        raise SecGroupRuleOperationFailed()
    raise gen.Return(all_data)


@gen.coroutine
def get_name_by_tenant_id(tenant_id=None):
    try:
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        sql = "select name from securitygroups " \
              "where 1=1 "

        if tenant_id:
            sql += " and tenant_id='%s' " % tenant_id
        from_db = yield db.execute(sql)
        all_data = from_db.fetchall()

    except Exception as e:
        LOG.error("get name by tenant_id error %s" % e)
        raise SecGroupRuleOperationFailed()
    raise gen.Return(all_data)


@gen.coroutine
def get_securitygrouprules_by_db(rule_id=None, rule_info=None, tenant_id=None):
    """get securitygroups from database"""
    try:
        db = dbpools.get_pool(dbpools.NEUTRON_DB)
        sql = "select sgr.tenant_id, sgr.id, sgr.security_group_id, sgr.remote_group_id, " \
              "sgr.direction, sgr.ethertype, sgr.protocol, sgr.port_range_min, " \
              "sgr.port_range_max, sgr.remote_ip_prefix " \
              "from securitygroups sg, securitygrouprules sgr " \
              "where sgr.security_group_id = sg.id and sg.name = 'default'"
        if tenant_id:
            sql += " and sg.tenant_id='%s' " % tenant_id
        if rule_id:
            sql += " and sgr.id='%s' " % rule_id
        if rule_info:
            if rule_info.get("direction"):
                sql += " and sgr.direction='%s' " % rule_info.get("direction")
            if rule_info.get("cidr"):
                sql += " and sgr.remote_ip_prefix='%s' " % rule_info.get("cidr")
            if rule_info.get("cidr"):
                sql += " and sgr.protocol='%s' " % rule_info.get("protocol")
            if rule_info.get("to_port"):
                sql += " and sgr.port_range_max='%s' " % rule_info.get("to_port")
            if rule_info.get("from_port"):
                sql += " and port_range_min='%s' " % rule_info.get("from_port")
            if rule_info.get("from_port"):
                sql += " and sgr.ethertype='%s' " % rule_info.get("ethertype")
        cur = yield db.execute(sql)
        all_data = cur.fetchall()

    except Exception as e:
        LOG.error("get securitygrouprules error %s" % e)
        raise SecGroupRuleOperationFailed()
    raise gen.Return(all_data)


@gen.coroutine
def security_group_rule_request(request_url, tenant_id=None,
                                response_key=None,
                                method=os.METHOD_GET,
                                request_body=None):
    """ security group rule async request decorators
    :param request_url: the action url of handle volume
    :param tenant_id: the id of tenant, default None
    :param response_key: the key of response: volume or volumes
    :param method: request method: get, post, delete, put
    :param request_body: request body: A dict
    :return:
    """
    try:
        session = yield os.get_session(tenant=tenant_id)
        result = yield os.connect_request(session=session, type=os.TYPE_NETWORK,
                                          method=method, url=request_url,
                                          response_key=response_key, body=request_body)
    except Exception as e:
        LOG.error("get security group rule error: %s" % e)
        raise e
    raise gen.Return(result)


@gen.coroutine
def get_security_group_from_neutron(tenant_id=None):
    """ get security group by sg_id and tenant_id
        根据项目查询安全组ID
    :param tenant_id: id of security group
    :param sg_id: id of security group
    """
    try:
        security_groups = yield security_group_request(request_url=security_groups_path,
                                                       tenant_id=tenant_id)
    except Exception, e:
        LOG.error("get security group error: %s" % e)
        raise gen.Return({})
    else:
        for sg in security_groups['security_groups']:
            if sg.get('name') == DEFAULT_SECURITY_GROUP:
                security_group = sg
                # security_group = [sg for sg in security_groups['security_groups'] if sg.get('name') == DEFAULT_SECURITY_GROUP][0]
                if security_group:
                    out_security_group = {"id": security_group['id'],
                                          "name": DEFAULT_SECURITY_GROUP,
                                          "tenant_id": tenant_id}
                else:
                    out_security_group = {}
                    # out_security_group = {"id": security_group['id'],
                    #                   "name": DEFAULT_SECURITY_GROUP,
                    #                   "tenant_id": tenant_id} \
                    # if security_group else {}
    raise gen.Return(out_security_group)


@gen.coroutine
def get_admin_tenant_id():
    """ get admin tenant id
    :return:
    """
    session = yield os.get_session()
    raise gen.Return(session.tenant_id)


def gen_sgr_protocol(protocol):
    """ extract security group rule's protocol
    :param protocol: the protocol of security group rule
    """
    if not protocol:
        protocol = REVERSE_PROTOCOL_PORT_DICT[protocol]
    return protocol


def convert_protocol(value):
    """ convert protocol
    :param value: the value of security group rule's protocol
    """
    if value is None:
        return value
    try:
        val = int(value)
        if 0 <= val <= 255:
            return str(value)
        raise InvalidRuleProtocol()
    except (ValueError, TypeError):
        if value.upper() in SG_SUPPORTED_PROTOCOLS:
            return value.upper()
        raise InvalidRuleProtocol()
    except AttributeError:
        raise InvalidRuleProtocol()


def gen_sgr_port_range(protocol, from_port, to_port):
    """ generate security group rule's port range
    :param protocol: the protocol of security group rule
    :param from_port: the port_range_min of security group rule
    :param to_port: the port_range_max of security group rule
    """
    if protocol:
        protocols = [k for k, v in PROTOCOL_PORT_DICT.iteritems() if v == to_port]
        if from_port and to_port:
            if from_port == to_port:
                port_range = "%s(%s)" % (from_port, protocols[0]) \
                    if protocols and protocols[0] else "%s" % from_port
            else:
                port_range = "%s-%s(%s)" % (from_port, to_port, protocols[0]) \
                    if protocols and protocols[0] else "%s-%s" % (from_port, to_port)
        else:
            if from_port == 0 and to_port:
                port_range = "%s-%s(%s)" % (from_port, to_port, protocols[0]) \
                    if protocols and protocols[0] else "%s-%s" % (from_port, to_port)
            elif from_port and to_port == 0:
                port_range = "%s-%s(%s)" % (from_port, to_port, protocols[0]) \
                    if protocols and protocols[0] else "%s-%s" % (from_port, to_port)
            elif from_port == 0 and not to_port:
                port_range = "%s(%s)" % (from_port, protocols[0]) \
                    if protocols and protocols[0] else "%s" % from_port
            elif not from_port and to_port == 0:
                port_range = "%s(%s)" % (to_port, protocols[0]) \
                    if protocols and protocols[0] else "%s" % to_port
            elif from_port and not to_port:
                port_range = "%s(%s)" % (from_port, protocols[0]) \
                    if protocols and protocols[0] else "%s" % from_port
            elif not from_port and to_port:
                port_range = "%s(%s)" % (to_port, protocols[0]) \
                    if protocols and protocols[0] else "%s" % to_port
            else:
                port_range = from_port

    else:
        port_range = REVERSE_PROTOCOL_PORT_DICT[None]
    return port_range


def gen_sgr_body(new_rule, sg_id):
    """ generate security group rule's body
    :param new_rule: the body of rule
    :param sg_id: the id of security group
    :rtype dict
    """
    try:
        rule = copy.deepcopy(new_rule)
        if not rule['cidr']:
            rule['cidr'] = None
        if rule['from_port'] < 0:
            rule['from_port'] = None
        if rule['to_port'] < 0:
            rule['to_port'] = None
        if isinstance(rule['protocol'], int) and rule['protocol'] < 0:
            rule['protocol'] = None
        else:
            rule['protocol'] = convert_protocol(rule['protocol'])

        if rule['protocol']:
            if rule['protocol'] in ALL_PROTOCOLS.iterkeys():
                rule['protocol'] = ALL_PROTOCOLS.get(rule['protocol'])
                if rule['protocol'] != ALL_ICMP:
                    rule['from_port'] = 1
                    rule['to_port'] = 65535
            else:
                protocols = [v for k, v in PROTOCOL_PORT_DICT.iteritems()
                             if k == rule['protocol']]
                if protocols:
                    rule['from_port'] = protocols[0]
                    rule['to_port'] = protocols[0]
                    rule['protocol'] = PROTOCOL_TCP
                    rule['direction'] = DIRECTION_IN

        if sg_id:
            rule_body = {'security_group_rule':
                             {'security_group_id': sg_id,
                              'direction': rule['direction'],
                              'ethertype': rule['ethertype'],
                              'protocol': rule['protocol'],
                              # 'remote_group_id': sg_id if rule['cidr'] is None else None,
                              'port_range_min': rule['from_port'],
                              'port_range_max': rule['to_port']}}
                              # 'remote_ip_prefix': rule['cidr']}}
            if not rule.get("cidr"):
                rule_body['security_group_rule']['remote_group_id'] = sg_id
            else:
                rule_body['security_group_rule']['remote_ip_prefix'] = rule.get("cidr")
        else:
            rule_body = {}
        return rule_body
    except BaseException as e:
        LOG.error("gen_sgr_body error:%s", e)
        LOG.error(trace())


if __name__ == "__main__":
    pass
