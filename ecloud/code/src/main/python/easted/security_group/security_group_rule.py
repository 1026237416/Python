# -*- coding: utf-8 -*-
from common import *
from tornado import gen
from easted.core.consumer import MessageExecuter
from easted.utils import trace
from easted.utils.validParamUtils import required
from easted.security_group.constants import *
from easted.network.subnetdao import *
from easted.core import dbpools

__author__ = 'yangkefeng@easted.com.cn'
__all__ = ["SecurityGroupRule",
           "list_security_group_rule",
           "get_security_group_rule",
           "create_security_group_rule",
           "delete_security_group_rule",
           "get_security_group_from_neutron",
           "equal_default_rule_ws",
           "diff_admin_security_group_rule"]


class SecurityGroupRule(object):
    tenant_id = str
    security_group_id = str
    cidr = str
    protocol = str
    from_port = int
    to_port = int
    ethertype = str
    direction = str

    def __init__(self, **kwargs):
        self.tenant_id = kwargs.get("tenant_id", None)
        self.security_group_id = kwargs.get("security_group_id", None)
        self.cidr = convert_cidr(kwargs.get("cidr", None))
        self.protocol = kwargs.get("protocol", None)
        self.from_port = kwargs.get("from_port", None)
        self.to_port = kwargs.get("to_port", None)
        self.ethertype = kwargs.get("ethertype", "IPv4")
        self.direction = kwargs.get("direction", "ingress")


def convert_cidr(cidr):
    """ convert cidr format
    :param cidr:
    :return:
    """
    try:
        final_cidr = None
        if len(cidr) > 1:
            cidr = cidr.split('/')
            ip = cidr[0]

            ip = ip.split('.')
            tmp_ip = ""
            for i in ip:
                i = bin(int(i))
                i = i[2:]
                length = len(i)
                prefix = ""
                for j in range(8 - length):
                    prefix = prefix + "0"
                i = prefix + i
                tmp_ip = tmp_ip + i
            tmp_ip = tmp_ip[:int(cidr[1])]

            bin_arr = ['0' for i in range(32 - int(cidr[1]))]
            bin_arr = ''.join(bin_arr)
            tmp_ip = tmp_ip + bin_arr

            final_ip = [''.join(tmp_ip[i * 8:i * 8 + 8]) for i in range(4)]
            final_ip = [str(int(tmpstr, 2)) for tmpstr in final_ip]
            final_ip = '.'.join(final_ip)
            final_cidr = final_ip + "/" + cidr[1]
            final_cidr = str(final_cidr)
    except Exception, e:
        LOG.error("add cidr error: %s" % e)
        raise CreateSecGroupRuleFailed()
    return final_cidr


def __gen_security_group_rule(**rule):
    """ generate security group rule
    :param rule: A Dict of security group rule
    :return:
    """
    return {"direction": rule['direction'],
            "cidr": rule['remote_ip_prefix'],
            "protocol": gen_sgr_protocol(rule['protocol']),
            "tenant_id": rule['tenant_id'],
            "to_port": rule['port_range_max'],
            "security_group_id": rule['security_group_id'],
            "port_range": gen_sgr_port_range(rule['protocol'],
                                             rule['port_range_min'],
                                             rule['port_range_max']),
            "from_port": rule['port_range_min'],
            "ethertype": rule['ethertype'],
            "default": rule.get('default', False),
            "id": rule['id']}


@gen.coroutine
def list_security_group_rule(tenant_id=None):
    """ get security group rules by tenant_id
    :param tenant_id: id of tenant,default None
    """
    try:
        admin_flag = False
        # 获取admin租户的id
        if not tenant_id:
            tenant_id = yield get_admin_tenant_id()
            admin_flag = True

        # rules = yield security_group_rule_request(request_url=security_group_rules_path)

        # 获取安全组规则
        out_rules = yield get_securitygrouprules_by_db(tenant_id=tenant_id)
        if admin_flag:
            for out_rule in out_rules:
                if equal_default_rule(out_rule):
                    out_rule['default'] = True
        # 调整输出安全组的格式
        out_rules = [__gen_security_group_rule(**out_rule) for out_rule in out_rules]

    except Exception, e:
        LOG.error("list security group rule error: %s" % e)
        raise SecGroupRuleOperationFailed()
    else:
        out_rules.sort(key=lambda x: x['protocol'])
    raise gen.Return(out_rules)


@gen.coroutine
def get_security_group_rule(rule_id=None, rule_info=None, tenant_id=None):
    """ get security group rule by rule_id and tenant_id
    :param rule_id: the id of security group rule
    """
    try:
        rule = yield get_securitygrouprules_by_db(rule_id=rule_id, rule_info=rule_info, tenant_id=tenant_id)

    except Exception, e:
        LOG.error("get security group rule error: %s" % e)
        raise SecGroupRuleOperationFailed()
    else:
        if rule:
            out_rule = __gen_security_group_rule(**rule[0])
            raise gen.Return(out_rule)


@gen.coroutine
def __gen_sgr(rule, tenant_id, sg_id):
    try:
        body = gen_sgr_body(rule, sg_id)
        sgr = None
        if body:
            sgr = yield security_group_rule_request(request_url=security_group_rules_path,
                                                    tenant_id=tenant_id,
                                                    method=os.METHOD_POST,
                                                    request_body=body)
    except Exception as e:
        LOG.error("create security group rule error:%s" % e)
        raise e
    raise gen.Return(sgr)


@gen.coroutine
@required("tenant_id")
def sync_security_group_rule(rule, tenant_id):
    """ sync security group rule by rule_id and tenant_id
    :param rule: security group rule
    :param tenant_id: the id of tenant
    """
    if not rule:
        raise CreateSecGroupRuleFailed()

    try:
        sg = yield get_security_group_from_neutron(tenant_id)
        sgr = yield __gen_sgr(rule, tenant_id, sg['id'])
        if not sgr:
            raise CreateSecGroupRuleFailed()
    except Exception, e:
        LOG.error("create security group rule error: %s" % e)
        raise CreateSecGroupRuleFailed()

    raise gen.Return(sgr['security_group_rule']['id'])


@gen.coroutine
def create_security_group_rule(rule, tenant_id=None):
    """ create security group rule by rule_id and tenant_id
    :param rule: security group rule
    :param tenant_id: the id of tenant,default None
    """
    try:
        if not rule:
            raise CreateSecGroupRuleFailed()
        LOG.debug("create security rule %s", rule)

        if tenant_id:
            sg_id = rule.get('security_group_id')
            if not sg_id:
                #  根据项目找到安全组ID
                sg = yield get_security_groups_from_db(tenant_id=tenant_id)
                # None
                if sg:
                    sg_id = sg[0]['id']
            sgr = yield __gen_sgr(rule, tenant_id, sg_id)

        else:
            admin_tenant_id = yield get_admin_tenant_id()
            sg = yield get_security_groups_from_db(admin_tenant_id)
            if sg:
                sgr = yield __gen_sgr(rule, admin_tenant_id, sg[0]['id'])
        if not sgr:
            raise CreateSecGroupRuleFailed()
    except Exception, e:
        LOG.error("create security group rule %s error: %s", rule, e)
        raise CreateSecGroupRuleFailed()

    raise gen.Return(sgr['security_group_rule']['id'])


def __is_equals(admin_rule, sgr):
    """  admin_rule is equals sgr
    :param admin_rule: the security group rule of admin tenant
    :param sgr: the security group rule of else tenant
    :rtype bool
    """
    return admin_rule['direction'] == sgr['direction'] and \
           admin_rule['cidr'] == sgr['remote_ip_prefix'] and \
           admin_rule['protocol'] == sgr['protocol'] and \
           admin_rule['to_port'] == sgr['port_range_max'] and \
           admin_rule['from_port'] == sgr['port_range_min'] and \
           admin_rule['ethertype'] == sgr['ethertype']




@gen.coroutine
def __get_tenant_default_sgs():
    """ get security groups and tenants relations
     :rtype dict: {"tenant_id": "security_group_id"}
    """
    # tenant_id = yield get_admin_tenant_id()
    # security_groups = yield security_group_request(request_url=security_groups_path,
    #                                                tenant_id=tenant_id)
    security_groups = yield security_group_request(request_url=security_groups_path)
    out_security_groups = {sg['tenant_id']: sg['id']
                           for sg in security_groups['security_groups']
                           if sg['name'] == DEFAULT_SECURITY_GROUP}
    raise gen.Return(out_security_groups)



@gen.coroutine
def __get_tenant_default_sgrs(admin_rule):

    """ get security group rules and tenants relations
    :param admin_rule: the security group rule of admin tenant
    :rtype dict: {"tenant_id": "security_group_rule_id"}
    """

    def get_del_sgr(sg):
        """ get delete security group rule from default security group of tenant
        :param sg: default security group rules of tenant
        :return:

        """
        rst = []
        if __is_equals(admin_rule, sg):
            tmp = sg['id']
            rst.append(tmp)
        return rst

        #[rule['id'] for rule in sg['security_group_rules']
        #return [rule['id'] for rule in sg if __is_equals(admin_rule, rule)]
    try:
        tenant_id = yield get_admin_tenant_id()
        # security_groups = yield security_group_request(request_url=security_groups_path,tenant_id=tenant_id)
        #默认安全组
        # security_groups = yield get_security_groups_from_db(tenant_id = tenant_id)
        security_groups = yield get_securitygrouprules_by_db(tenant_id = tenant_id)

        security_group_rules = {}
        #获取安全组
        for sg in security_groups:
            sgr = get_del_sgr(sg)
            if not sgr:
                continue
            security_group_rules[sg['tenant_id']] = sgr
    except Exception as e:
        LOG.error("get tenant default security group error:%s" % e)
    raise gen.Return(security_group_rules)


@gen.coroutine
def delete_security_group_rule(rule=None, tenant_id=None):
    """ delete security group rule with rule_id and tenant_id
    :param rule_id: the id of security group rule
    :param tenant_id: the id of tenant,default None
    """
    try:
        if tenant_id:
            yield security_group_rule_request(request_url=security_group_rule_path % rule.get("id"),
                                              method=os.METHOD_DELETE,
                                              tenant_id=tenant_id)
        else:
            # 默认安全组规则
            # sgr = yield get_security_group_rule(rule_id=rule_id)
            # del_sgrs = yield __get_tenant_default_sgrs(sgr)
            del_sgrs = yield get_securitygrouprules_by_db(rule_info=rule)
            for sgr in del_sgrs:
                url = security_group_rule_path % sgr.get("id")
                yield security_group_rule_request(request_url=url,
                                                  method=os.METHOD_DELETE)
            # for k, v in del_sgrs.iteritems():
            #     if v and len(v) > 0:
            #         url = security_group_rule_path % v[0]
            #         yield security_group_rule_request(request_url=url,
            #                                           method=os.METHOD_DELETE)

    except Exception, e:
        LOG.error("delete security group rule error: %s" % e)
        LOG.error(trace())
        raise SecGroupRuleOperationFailed()


def equal_default_rule(sgr):
    for default_rule in DEFAULT_SECURITY_RULES:
        if sgr['direction'] == default_rule['direction'] and \
               sgr['remote_ip_prefix'] == default_rule['cidr'] and \
               sgr['protocol'] == default_rule['protocol'] and \
               sgr['port_range_max'] == default_rule['to_port'] and \
               sgr['port_range_min'] == default_rule['from_port'] and \
               sgr['ethertype'] == default_rule['ethertype']:
            return True


def equal_default_rule_ws(rule):
    for default_rule in DEFAULT_SECURITY_RULES:
        if rule['direction'] == default_rule['direction'] and \
                rule['cidr'] == default_rule['cidr'] and \
                rule['protocol'] == default_rule['protocol'] and \
                rule['to_port'] == default_rule['to_port'] and \
                rule['from_port'] == default_rule['from_port'] and \
                rule['ethertype'] == default_rule['ethertype']:
            return True

def __is_equal_admin_rule(admin_rule, tenant_rule):
    """admin_rule is equals tenant_rule
    :param admin_rule:the security group rule of admin
    :param tenant_rule:the security group rule of tenant
    :return:
    """
    return admin_rule['direction'] == tenant_rule['direction'] and \
           admin_rule['cidr'] == tenant_rule['cidr'] and \
           admin_rule['protocol'] == tenant_rule['protocol'] and \
           admin_rule['to_port'] == tenant_rule['to_port'] and \
           admin_rule['from_port'] == tenant_rule['from_port'] and \
           admin_rule['ethertype'] == tenant_rule['ethertype']


def diff_admin_security_group_rule(tenant_sgs, admin_sgs):
    """sync admin security group rule to tenant
    :param tenant_sgs: the security group rule of tenant
    :param admin_sgs: the security group rule of admin

    """
    sync_security_group_rule = []
    try:
        for admin_rule in admin_sgs:
            flag = True
            for tenant_rule in tenant_sgs:
                if __is_equal_admin_rule(admin_rule, tenant_rule):
                    flag = False
                    break
            if flag:
                sync_security_group_rule.append(admin_rule)

    except Exception as e:
        LOG.error("sync admin security group rule error: %s" % e)
        raise e
    return sync_security_group_rule


@gen.coroutine
def main():

    rule = {"direction": "egress", "from_port": None,
            "protocol": "ALL ICMP", "to_port": None,
            "cidr": "10.10.3.121/24", "ethertype": "IPv4"}
    sgr = yield create_security_group_rule(rule)
    print json.dumps(sgr)

    sg = yield __get_tenant_default_sgs()
    print sg
    print len(sg)


if __name__ == "__main__":
    from tornado import ioloop

    ioloop.IOLoop.current().run_sync(main)
