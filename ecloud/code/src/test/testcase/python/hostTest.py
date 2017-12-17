#!/usr/bin/env python
# -*- coding: utf-8 -*-
import unittest
from testcase.core.base import TestCase


class HostTest(TestCase):
    comm = {}

    def __call__(self, result=None):
        self.base_url = "https://10.10.130.56:8443"
        super(HostTest, self)._pre_setup(self.base_url)
        super(HostTest, self).__call__()

    def setUp(self):
        if not HostTest.comm.get("token", ""):
            state, rst = self.login()
            HostTest.comm["token"] = rst["token"]
        self.header = {
            "Ecloud-Token": HostTest.comm["token"]
        }

    def login(self):
        url = '/login'
        method = 'POST'
        data = {"name": "ecloud", "password": "password"}
        state, rst = self.client.request(url, method, data=data)
        return state, rst

    def test_list_hosts(self):
        url = "/hosts?volume_type=lvm&tenant_id=6e25438edc7e4991be238df95de82099"
        method = "GET"
        state, rst = self.client.request(url, method, header=self.header)

    def _test_available_host(self):
        url = "/hosts/available"
        method = "GET"
        data = {
            "num": 3,
            "tenant_id": "121b54c0f885490a8176ec1188832d2a",
            "cores": 1,
            "memory": 1,
            "vlans": "55a96965-efab-4e91-b5b7-1d4d42f3edf0,efefefwe",
            "volume_type":"lvm"
        }
        state, rst = self.client.request(url, method, header=self.header, data=data)


    def _test_get_host_disk(self):
        url = "/host/dev1/storages"
        method = "GET"
        state, rst = self.client.request(url, method, header=self.header)


    def tearDown(self):
        pass


if __name__ == '__main__':
    unittest.main()


