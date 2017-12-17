#!/usr/bin/env python
# -*- coding: utf-8 -*-
import unittest
from testcase.core.base import TestCase

class ServiceTest(TestCase):
    comm = {}
    def __call__(self, result=None):
        self.base_url = "http://10.10.130.87:8443"
        super(ServiceTest, self)._pre_setup(self.base_url)
        super(ServiceTest, self).__call__()

    def setUp(self):
        if not ServiceTest.comm.get("token", ""):
            state, rst = self.login()
            ServiceTest.comm["token"] = rst["token"]
        self.header = {
            "Ecloud-Token": ServiceTest.comm["token"]
        }

    def login(self):
        url = '/login'
        method = 'POST'
        data = {"name":"ecloud","password":"password"}
        state, rst = self.client.request(url, method, data=data)
        return state, rst

    def test_list_service(self):
        url = '/services?flag=4'
        method = 'GET'
        state, rst = self.client.request(url,header=self.header, method=method)
        return state, rst

    def tearDown(self):
            pass

if __name__ == '__main__':
        unittest.main()