# -*- coding: utf-8 -*-
import logging

from tornado import gen

from easted import security_group
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get
from easted.core.rest import put
from easted.core.rest import delete
from easted.log import log
from easted.identify import tenant
from easted.security_group import equal_default_rule_ws
from easted.security_group.exception import DefaultSecGroupRuleOperationFailed

__author__ = 'yangkefeng@easted.com.cn'

LOG = logging.getLogger('system')


def gen_rule_common(rule):
    result = ""
    if rule.get("direction") == "ingress":
        result += "入口 "
    else:
        result += "出口 "
    if rule.get("protocol"):
        result += rule.get("protocol") + " "
    else:
        result += "任何 "

    if rule.get("port_range"):
        result += rule.get("port_range") + " "
    else:
        result += "任何 "

    result += rule.get("cidr") if rule.get("cidr") else  "-"
    return result


class Service(RestHandler):
    @gen.coroutine
    @get(_path="/security/rules")
    def list_security_group_rules(self, filter=False, tenant_id=None):
        """ list security group rules
        :param filter: the flag of show
        :param tenant_id: the id of tenant, default None
        """
        out_sgs = yield security_group.list_security_group_rule(tenant_id)
        if filter:
            admin_sgs = yield security_group.list_security_group_rule()
            out_sgs = security_group.diff_admin_security_group_rule(out_sgs, admin_sgs)
            out_sgs.sort(key=lambda x: x['protocol'])
        self.response(Response(result=out_sgs, total=len(out_sgs)))

    @gen.coroutine
    @put(_path="/security/rule")
    def create_global_security_group_rule(self, rule):
        """ create security group rule
        """
        rule = security_group.SecurityGroupRule(**rule)
        rule_id = yield security_group.create_security_group_rule(rule.__dict__)
        res = yield security_group.get_security_group_rule(rule_id=rule_id)
        log.write(self.request, log.Type.SECUIRTY_GROUP, res['port_range'], log.Operator.CREATE, gen_rule_common(res))
        self.response(Response())

    @gen.coroutine
    @put(_path="/security/{tenant_id}/rule")
    def create_tenant_security_group_rule(self, tenant_id, body):
        """ create security group rule
        :param tenant_id: the id security group rule
        :param body: the data of create security group rule
        """
        for r in body.get("rules"):
            rule = security_group.SecurityGroupRule(**r)
            rule_id = yield security_group.create_security_group_rule(rule.__dict__, tenant_id)
            res = yield security_group.get_security_group_rule(rule_id=rule_id)
            t = yield tenant.get_tenant_by_id(tenant_id)
            log.write(self.request, log.Type.TENANT, t['name'], log.Operator.CRATE_RULE,
                      gen_rule_common(res))
        self.response(Response())


    @gen.coroutine
    @delete(_path="/security/rule/{rule_id}")
    def delete_global_security_group_rule(self, rule_id):
        """ delete global security group rule
        :param rule_id: he security group rule id which will be deleted

        """
        rule = yield security_group.get_security_group_rule(rule_id=rule_id)
        if equal_default_rule_ws(rule):
            raise DefaultSecGroupRuleOperationFailed()
        yield security_group.delete_security_group_rule(rule)
        log.write(self.request, log.Type.SECUIRTY_GROUP, rule['port_range'], log.Operator.DELETE,
                  gen_rule_common(rule))
        self.response(Response())

    @gen.coroutine
    @delete(_path="/security/{tenant_id}/rule/{rule_id}")
    def delete_tenant_security_group_rule(self, tenant_id, rule_id):
        """ delete tenant security group rule
        :param rule_id: the security group rule id which will be delete
        :param tenant_id: the security group id
        """
        rule = yield security_group.get_security_group_rule(rule_id=rule_id)
        yield security_group.delete_security_group_rule(rule=rule, tenant_id=tenant_id)
        t = yield tenant.get_tenant_by_id(tenant_id)
        log.write(self.request, log.Type.TENANT, t['name'], log.Operator.DELETE_RULE,
                  gen_rule_common(rule))
        self.response(Response())
