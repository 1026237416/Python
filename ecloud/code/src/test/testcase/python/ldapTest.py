import unittest
from testcase.core.base import TestCase


class ldapTest(TestCase):
    comm = {}

    def __call__(self, result=None):
        self.base_url = "https://10.10.130.99:8443"
        super(ldapTest, self)._pre_setup(self.base_url)
        super(ldapTest, self).__call__()

    def setUp(self):
        if not ldapTest.comm.get("token", ""):
            state, rst = self.login()
            ldapTest.comm["token"] = rst["token"]
        self.header = {
            "Ecloud-Token": ldapTest.comm["token"]
        }

    def login(self):
        url = '/login'
        method = 'POST'
        data = {"name": "ecloud", "password": "password"}
        state, rst = self.client.request(url, method, data=data)
        return state, rst

    def _test_add_user_tenant(self):
        d = "6786be7036964a51b89235c00a4e2398"
        url = '/tenant/%s/users' % d
        method = 'POST'
        data = ["test"]
        state, rst = self.client.request(url, header=self.header, method=method, data=data)
        return state, rst

    def _test_set_user_role(self):
        url = '/user/role/set'
        method = 'POST'
        data = {"role": "sys_admin", "name": "hepeng"}
        state, rst = self.client.request(url, header=self.header, method=method, data=data)
        return state, rst

    def test_list_users(self):
        url = '/users'
        method = 'GET'
        data = {}
        state, rst = self.client.request(url, header=self.header, method=method, data=data)
        return state, rst

    def tearDown(self):
        pass


if __name__ == '__main__':
    unittest.main()
