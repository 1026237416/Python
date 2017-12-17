import unittest
from testcase.core.base import TestCase


class userTset(TestCase):
    comm = {}

    def __call__(self, result=None):
        self.base_url = "https://10.10.130.99:8443"
        super(userTset, self)._pre_setup(self.base_url)
        super(userTset, self).__call__()

    def setUp(self):
        if not userTset.comm.get("token", ""):
            state, rst = self.login()
            userTset.comm["token"] = rst["token"]
        self.header = {
            "Ecloud-Token": userTset.comm["token"]
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

    def test_delete_user(self):
        user_id = 'dc0505966ab14b80b248ea93153981ce'
        url = '/users/%s' %user_id
        method = 'DELETE'
        state, rst = self.client.request(url, header=self.header, method=method)
        return state, rst

    def tearDown(self):
        pass


if __name__ == '__main__':
    unittest.main()