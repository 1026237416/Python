# -*- coding: UTF-8 -*-
import sys
import ldap
import ldappool

reload(sys)
sys.setdefaultencoding('utf-8')


class ldapc:

    def __init__(self, ldap_path, baseDN, domainname, ldap_authuser, ldap_authpass):
        self.baseDN = baseDN
        self.ldap_error = None
        ldap_authduser = '%s\%s' % (domainname, ldap_authuser)
        self.l = ldap.initialize(ldap_path)
        self.l.protocol_version = ldap.VERSION3
        try:
            self.l.simple_bind_s(ldap_authduser, ldap_authpass)
        except ldap.LDAPError, err:
            self.ldap_error = 'Connect to %s failed, Error:%s.' % (ldap_path, err.message['desc'])
            print self.ldap_error
            # finally:
            #     self.l.unbind_s()
            #     del self.l

    def search_users(self, username):  # 模糊查找，返回一个list，使用search_s()
        if self.ldap_error is None:
            try:
                searchScope = ldap.SCOPE_SUBTREE
                searchFiltername = "sAMAccountName"  # 通过samaccountname查找用户
                retrieveAttributes = None
                searchFilter = '(' + searchFiltername + "=" + username + '*)'
                ldap_result = self.l.search_s(self.baseDN, searchScope, searchFilter, retrieveAttributes)
                if len(ldap_result) == 0:  # ldap_result is a list.
                    return "%s doesn't exist." % username
                else:
                    # result_type, result_data = self.l.result(ldap_result, 0)
                    # return result_type, ldap_result
                    return ldap_result
            except ldap.LDAPError, err:
                return err

    def search_user(self, username):  # 精确查找，返回值为list，使用search()
        if self.ldap_error is None:
            try:
                searchScope = ldap.SCOPE_SUBTREE
                searchFiltername = "sAMAccountName"  # 通过samaccountname查找用户
                retrieveAttributes = None
                searchFilter = '(' + searchFiltername + "=" + username + ')'
                ldap_result_id = self.l.search(self.baseDN, searchScope, searchFilter, retrieveAttributes)
                result_type, result_data = self.l.result(ldap_result_id, 0)
                if result_type == ldap.RES_SEARCH_ENTRY:
                    return result_data
                else:
                    return "%s doesn't exist." % username
            except ldap.LDAPError, err:
                return err

    def search_userDN(self, username):  # 精确查找，最后返回该用户的DN值
        if self.ldap_error is None:
            try:
                searchScope = ldap.SCOPE_SUBTREE
                searchFiltername = "sAMAccountName"  # 通过samaccountname查找用户
                retrieveAttributes = None
                searchFilter = '(' + searchFiltername + "=" + username + ')'
                ldap_result_id = self.l.search(self.baseDN, searchScope, searchFilter, retrieveAttributes)
                result_type, result_data = self.l.result(ldap_result_id, 0)
                if result_type == ldap.RES_SEARCH_ENTRY:
                    return result_data[0][0]  # list第一个值为用户的DN，第二个值是一个dict，包含了用户属性信息
                else:
                    return "%s doesn't exist." % username
            except ldap.LDAPError, err:
                return err

    def valid_user(self, username, userpassword):  # 验证用户密码是否正确
        if self.ldap_error is None:
            target_user = self.search_userDN(username)  # 使用前面定义的search_userDN函数获取用户的DN
            if target_user.find("doesn't exist") == -1:
                try:
                    self.l.simple_bind_s(target_user, userpassword)
                    # logging.info('%s valid passed.\r'%(username)) #logging会自动在每行log后面添加"\000"换行，windows下未自动换行
                    return True
                except ldap.LDAPError, err:
                    return err
            else:
                return target_user

    def update_pass(self, username, oldpassword, newpassword):  #####未测试#########
        if self.ldap_error is None:
            target_user = self.search_userDN(username)
            if target_user.find("doesn't exist") == -1:
                try:
                    self.l.simple_bind_s(target_user, oldpassword)
                    self.l.passwd_s(target_user, oldpassword, newpassword)
                    return 'Change password success.'
                except ldap.LDAPError, err:
                    return err
            else:
                return target_user

    def search_OU(self):  # 精确查找，最后返回该用户的DN值
        if self.ldap_error is None:
            try:
                searchScope = ldap.SCOPE_SUBTREE
                # searchFiltername = "sAMAccountName" #通过samaccountname查找用户
                retrieveAttributes = None
                searchFilter = '(&(objectClass=person))'
                ldap_result = self.l.search_s(self.baseDN, searchScope, searchFilter, retrieveAttributes)
                if ldap_result is not None:
                    udict = {}
                    usersinfor = []
                    for pinfor in ldap_result:
                        # pinfor是一个tuple，第一个元素是该用户的CN，第二个元素是一个dict，包含有用户的所有属性
                        if pinfor[1]:
                            p = pinfor[1]
                            sAMAccountName = p['sAMAccountName'][0]  # 返回值是一个list
                            # displayName = p['displayName'][0]
                            # 如果用户的某个属性为空，则dict中不会包含有相应的key
                            if 'department' in p:
                                department = p['department'][0]
                            else:
                                department = None
                            # print sAMAccountName,displayName,department
                            udict['sAMAccountName'] = sAMAccountName
                            # udict['displayName'] = displayName
                            udict['department'] = department
                            usersinfor.append(udict)
                            # print udict
                    return usersinfor
            except ldap.LDAPError, err:
                return err
            finally:
                self.l.unbind_s()
                del self.l


if __name__ == '__main__':
    # ldap_authuser='admin'
    # ldap_authpass='_123qweasd'
    # domainname='ecloud'
    # ldappath='ldap://10.10.3.252:389'
    baseDN = 'CN=Users,DC=ecloud,DC=com'  # ldap_authuser在连接到LDAP的时候不会用到baseDN，在验证其他用户的时候才需要使用
    # # username = 'liu1' #要查找/验证的用户
    #
    # p=ldapc(ldappath,baseDN,domainname,ldap_authuser,ldap_authpass)
    #
    # print p.search_OU()
    # print p.valid_user('test','password') #调用valid_user()方法验证用户是否为合法用户


    uri = 'ldap://10.10.3.252:389'
    dn = '%s\%s'%("ecloud","admin")
    passwd = '_123qweasd'
    cm = ldappool.ConnectionManager(uri, dn, passwd, use_pool=True, size=2)
    searchScope = ldap.SCOPE_SUBTREE
    # searchFiltername = "sAMAccountName" #通过samaccountname查找用户
    retrieveAttributes = ['sAMAccountName']
    searchFilter = '(&(objectClass=person))'

    with cm.connection() as conn:
        ldap_result = conn.search_s(baseDN, searchScope, searchFilter, retrieveAttributes)
        if ldap_result is not None:
            udict = {}
            usersinfor = []
            for pinfor in ldap_result:
                # pinfor是一个tuple，第一个元素是该用户的CN，第二个元素是一个dict，包含有用户的所有属性
                if pinfor[1]:
                    p = pinfor[1]
                    sAMAccountName = p['sAMAccountName'][0]  # 返回值是一个list
                    # displayName = p['displayName'][0]
                    # 如果用户的某个属性为空，则dict中不会包含有相应的key
                    if 'department' in p:
                        department = p['department'][0]
                    else:
                        department = None
                    # print sAMAccountName,displayName,department
                    udict['sAMAccountName'] = sAMAccountName
                    # udict['displayName'] = displayName
                    udict['department'] = department
                    usersinfor.append(udict)
                    # print udict
            print usersinfor