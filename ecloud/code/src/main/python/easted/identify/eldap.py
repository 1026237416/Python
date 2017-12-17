# -*- coding: utf-8 -*-
import logging
import ldap
from easted import config
from easted.identify.exception import ConnectLdapFailed
from easted.core import dbpools

__all__ = [
    "users",
    "auth"
]

__author__ = 'litao@easted.com.cn'

CONF = config.CONF
LOG = logging.getLogger('system')

config.register("ldap.base_dn", setting_type=config.TYPE_STR, secret=True)
config.register("ldap.retrieve", setting_type=config.TYPE_LIST, secret=True)
config.register("ldap.auth_user", setting_type=config.TYPE_STR, secret=True)
config.register("ldap.auth_pass", setting_type=config.TYPE_STR, secret=True)


def users(username=None):
    """
    支持根据用户名查找用户信息
    :param username:
    :return:[{
         "displayname":"",
         "name":"",
         "phone":"",
         "email":"",
         "des":"备注信息"
    }]或者
         {
         "displayname":"",
         "dn":"",
         "name":"",
         "phone":"",
         "email":"",
         "des":"备注信息"
    }
    """
    try:
        search_scope = ldap.SCOPE_SUBTREE
        base_dn = CONF.ldap.base_dn
        attributes = CONF.ldap.retrieve
        retrieve_attributes = None
        if attributes:
            retrieve_attributes = [attr.split(":")[1] for attr in attributes]
        search_filter = '(&(objectClass=person))'
        ldap_pool = dbpools.get_eldap()
        result = []
        with ldap_pool.connection("CN=" + CONF.ldap.auth_user + "," + CONF.ldap.base_dn, CONF.ldap.auth_pass) as conn:
            ldap_result = conn.search_s(base_dn, search_scope, search_filter, retrieve_attributes)
            if ldap_result is not None:
                for u in ldap_result:
                    udict = {}
                    # u，第一个元素是该用户的CN，第二个元素是一个dict，包含有用户的所有属性
                    u_info = u[1]
                    if u_info:
                        for attr in attributes:
                            ldap_ecloud = attr.split(":")
                            ecloud_attr = ldap_ecloud[0]
                            ldap_attr = ldap_ecloud[1]
                            if ldap_attr in u_info:
                                udict[ecloud_attr] = u_info[ldap_attr][0]
                            else:
                                udict[ecloud_attr] = ""
                    # 根据用户名在LDAP查找用户DN
                    if udict.get("name") == 'admin':
                        continue
                    if username and udict.get("name") == username:
                        udict["dn"] = u[0]
                        return udict
                    result.append(udict)
            LOG.debug("search ldap result is %s ", result)
            return result
    except Exception, e:
        LOG.error("search ldap users error! %s", e)
        raise ConnectLdapFailed()


def auth(username, password):
    """
    集成LDAP 用户认证
             1 先去LDAP查找该用户名是否存在
             2 再去验证密码是否正确
    :param username:
    :param password:
    :return: True/False
    """
    user = users(username)
    if not user or isinstance(user, list):
        return False
    target_user = user.get("dn")
    ldap_pool = dbpools.get_eldap()
    result = False
    with ldap_pool.connection() as conn:
        if target_user.find("doesn't exist") == -1:
            try:
                conn.simple_bind_s(target_user, password)
                LOG.info('%s valid passed.', username)
                result = True
            except ldap.LDAPError, err:
                LOG.error('%s valid failed. error is %s', username, err)
    return result


if __name__ == '__main__':
    import os
    from easted import log
    from easted.core import dbpools

    os.chdir("../../")
    log.init()
    dbpools.init()
    print auth("litao007", "password")
    # print users()
