#!/usr/bin/env python
# -*- coding: utf-8 -*-
import unittest
from testcase.core.base import TestCase


class ClusterTest(TestCase):
    comm = {}

    def __call__(self,result=None):
        self.base_url = "https://10.10.130.87:8443"
        super(ClusterTest,self)._pre_setup(self.base_url)
        super(ClusterTest,self).__call__()

    def setUp(self):
        if not ClusterTest.comm.get("token",""):
            state,rst = self.login()
            ClusterTest.comm["token"] = rst["token"]
        self.header = {
            "Ecloud-Token": ClusterTest.comm["token"]
        }

    def login(self):
        url = '/login'
        method = 'POST'
        data = {"name": "ecloud","password": "password"}
        state,rst = self.client.request(url,method,data=data)
        return state,rst

    def _test_create_cluster(self):
        url = '/cluster'
        method = 'PUT'
        data = {"name": "first", "description": "aa"}
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_update_cluster(self):
        url = '/cluster/1'
        method = 'POST'
        data = {"description": "hahaha"}
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_get_cluster(self):
        url = '/cluster/d7c67f8f-3317-4e3b-9022-6fc3d3f2bbac'
        method = 'GET'
        state, rst = self.client.request(url, method, header=self.header)

    def test_list_available_host(self):
        url = '/cluster/hosts'
        method = 'GET'
        state, rst = self.client.request(url, method, header=self.header)

    def _test_list_cluster_hosts(self):
        url = '/cluster/1/hosts'
        method = 'GET'
        state, rst = self.client.request(url, method, header=self.header)

    def _test_set_cluster_hosts(self):
        url = '/cluster/1/hosts'
        method = 'POST'
        data={"hosts": [1, 20]}
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_list_cluster(self):
        url = '/clusters'
        method = 'GET'
        state, rst = self.client.request(url, method, header=self.header)

    def _test_delete_cluster_host(self):
        url = '/cluster/1?hosts=1,20'
        method = 'DELETE'
        state, rst = self.client.request(url, method, header=self.header)

    def _test_delete_cluster(self):
        url = '/cluster/1'
        method = 'DELETE'
        state, rst = self.client.request(url, method, header=self.header)





def tearDown(self):
    pass


if __name__ == '__main__':
    unittest.main()


def _create_cluster(self):
    url = "/cluster"
    method = 'PUT'
    data = {"name": "first", "description": "aa"}
    state, rst = self.client.request(url, method, header=self.header, data=data)