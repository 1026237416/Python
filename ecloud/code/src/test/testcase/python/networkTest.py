#!/usr/bin/env python
# -*- coding: utf-8 -*-
import unittest
from testcase.core.base import TestCase


class NetworkTest(TestCase):
    comm = {}

    def __call__(self,result=None):
        self.base_url = "https://10.10.130.87:8443"
        super(NetworkTest,self)._pre_setup(self.base_url)
        super(NetworkTest,self).__call__()

    def setUp(self):
        if not NetworkTest.comm.get("token",""):
            state,rst = self.login()
            NetworkTest.comm["token"] = rst["token"]
        self.header = {
            "Ecloud-Token": NetworkTest.comm["token"]
        }

    def login(self):
        url = '/login'
        method = 'POST'
        data = {"name": "zhang","password": "password"}
        state,rst = self.client.request(url,method,data=data)
        return state,rst

    def _test_get_ips(self):
        network_id = "8d6b328a-3b28-45b9-9894-426e67609b56"
        url = '/network/%s/ips' % network_id
        method = 'GET'
        data = {
            # "tenant_id":"04ef375f07734cc5a18e418889516b75",
            # "used":"1"
        }
        state,rst = self.client.request(url,method,header=self.header,data=data)

    def _test_get_vlan_host(self):
        url = "/network/55a96965-efab-4e91-b5b7-1d4d42f3edf0/tenant/121b54c0f885490a8176ec1188832d2a/hosts"
        method = 'GET'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_phynetworks(self):
        url = "/phynetworks"
        method = 'GET'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_create_network(self):
        url = "/network"
        method = 'PUT'
        data = {
            "name": "vlan10",
            "phy_network": "ph-eth",
            "vlan_id": 1,
            "vlan_type": "vlan",
            "hosts": ["1","2"]
        }
        state,rst = self.client.request(url,method,header=self.header,data=data)

    def _test_list_network(self):
        url = "/networks"
        method = 'GET'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_get_network(self):
        url = "/network/40eb7f42-5e38-4094-96e2-509aeb3b4d61"
        method = 'GET'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_update_network(self):
        url = "/network/40eb7f42-5e38-4094-96e2-509aeb3b4d61"
        data = {
            "name": "vlan"
        }
        method = 'POST'
        state,rst = self.client.request(url,method,header=self.header,data=data)

    def _test_delete_network(self):
        url = "/network/8aad3d29-508b-4f1d-b5b7-ef0691744f36"
        method = 'DELETE'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_list_subnet(self):
        url = "/subnets?network_id=332"
        method = 'GET'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_get_subnet(self):
        url = "/subnet/3bcf4174-bc39-41fb-bb31-88554de666b0"
        method = 'GET'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_create_subnet(self):
        url = "/network/subnet"
        method = 'PUT'
        data = {
            "name": "vlan196",
            "network_id": "255085a1-8cf8-4430-8140-37fd2f26afc9",
            "cidr": "196.168.1.0/24",
            "gateway": "196.168.1.254",
            "dns": ["114.114.114.114"],
            "ips": ["196.168.1.1","196.168.1.2"],
        }
        state,rst = self.client.request(url,method,header=self.header,data=data)

    def _test_delete_subnet(self):
        url = "/subnet/8dc4b856-892a-4148-9585-4f2d1bc67df1"
        method = 'DELETE'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_update_subnet(self):
        url = "/subnet/2cb2cdb3-fe14-4824-ba01-a4fa54d87be3"
        method = 'POST'
        data = {
            "name": "vlan191",
            "gateway": "196.168.1.253",
            "dns": ["114.114.114.113"],
        }
        state,rst = self.client.request(url,method,header=self.header,data=data)

    def _test_get_subnet_ips(self):
        url = "/subnet/2cb2cdb3-fe14-4824-ba01-a4fa54d87be3/ips"
        method = 'GET'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_update_subnet_ips(self):
        url = "/subnet/2cb2cdb3-fe14-4824-ba01-a4fa54d87be3/ips"
        method = 'POST'
        data = {
            "ips": ["196.168.1.2","196.168.1.3"],
        }
        state,rst = self.client.request(url,method,header=self.header,data=data)

    def _test_get_network_hosts(self):
        url = "/network/2943559b-9c47-44e1-8246-62eea5ec913f/hosts"
        method = 'GET'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_set_subnet_tenant_hosts(self):
        url = "/subnet/2cb2cdb3-fe14-4824-ba01-a4fa54d87be3/tenant/6e25438edc7e4991be238df95de82099/hosts"
        method = 'POST'
        data = {
            "host_ids": ["1"]
        }
        state,rst = self.client.request(url,method,header=self.header,data=data)

    def _test_get_subnet_tenant_hosts(self):
        url = "/subnet/2cb2cdb3-fe14-4824-ba01-a4fa54d87be3/tenant/6e25438edc7e4991be238df95de82099/hosts"
        method = 'GET'
        state,rst = self.client.request(url,method,header=self.header)

    def _test_set_subnet_tenant_ips(self):
        url = "/subnet/2cb2cdb3-fe14-4824-ba01-a4fa54d87be3/tenant/6e25438edc7e4991be238df95de82099/ips"
        method = 'POST'
        data = {
            "ips": ["196.168.1.2"]
        }
        state,rst = self.client.request(url,method,header=self.header,data=data)


def tearDown(self):
    pass


if __name__ == '__main__':
    unittest.main()
