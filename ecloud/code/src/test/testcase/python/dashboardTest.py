#!/usr/bin/env python
# -*- coding: utf-8 -*-
import unittest
from testcase.core.base import TestCase


class DashboardTest(TestCase):
    comm = {}

    def __call__(self, result=None):
        self.base_url = "https://10.10.138.56:8443"
        super(DashboardTest, self)._pre_setup(self.base_url)
        super(DashboardTest, self).__call__()

    def setUp(self):
        if not DashboardTest.comm.get("token", ""):
            state, rst = self.login()
            DashboardTest.comm["token"] = rst["token"]
        self.header = {
            "Ecloud-Token": DashboardTest.comm["token"]
        }

    def login(self):
        url = '/login'
        method = 'POST'
        data = {"name": "ecloud", "password": "password"}
        state, rst = self.client.request(url, method, data=data)
        return state, rst

    def test_get_stat_data(self):
        url = "/statistic"
        method = "GET"
        data = {}
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def tearDown(self):
        pass


if __name__ == '__main__':
    unittest.main()
