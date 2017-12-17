#!/usr/bin/env python
# -*- coding: utf-8 -*-
import unittest
from testcase.core.base import TestCase


class VolumeTest(TestCase):
    comm = {}


    def __call__(self, result=None):
        self.base_url = "https://10.10.130.56:8443"
        super(VolumeTest, self)._pre_setup(self.base_url)
        super(VolumeTest, self).__call__()

    def setUp(self):
        if not VolumeTest.comm.get("token", ""):
            state, rst = self.login()
            VolumeTest.comm["token"] = rst["token"]
        self.header = {
            "Ecloud-Token": VolumeTest.comm["token"]
        }

    def login(self):
        url = '/login'
        method = 'POST'
        data = {"name": "ecloud", "password": "password"}
        state, rst = self.client.request(url, method, data=data)
        return state, rst

    def test_list_volumes(self):
        url = "/volumes"
        method = "GET"
        state, rst = self.client.request(url, method, header=self.header)

    def _test_create_volume(self):
        url = "/volume"
        method = "PUT"
        data = {
            "displayname": "vd001",
            "size": 1,
            "volume_type": "iscsi",
            "host":"dev2",
            "user_id": "be33368f554344c6bd6fce7c4e0220a4",
            "tenant_id": "6e25438edc7e4991be238df95de82099",
            "num": 1,
            "des": "desc",
        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_get_volumes(self):
        vol_id = "f2beff32-6547-4a8a-8daf-0231ce8205c2"
        url = "/volume/%s" % vol_id
        method = "GET"
        state, rst = self.client.request(url, method, header=self.header)

    def tearDown(self):
        pass


if __name__ == '__main__':
    unittest.main()
