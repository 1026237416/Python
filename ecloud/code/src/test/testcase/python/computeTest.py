#!/usr/bin/env python
# -*- coding: utf-8 -*-
import unittest
from testcase.core.base import TestCase


class ComputeTest(TestCase):
    comm = {}

    def __call__(self, result=None):
        self.base_url = "https://10.10.130.99:8443"
        super(ComputeTest, self)._pre_setup(self.base_url)
        super(ComputeTest, self).__call__()

    def setUp(self):
        if not ComputeTest.comm.get("token", ""):
            state, rst = self.login()
            ComputeTest.comm["token"] = rst["token"]
        self.header = {
            "Ecloud-Token": ComputeTest.comm["token"]
        }

    def login(self):
        url = '/login'
        method = 'POST'
        data = {"name": "ecloud", "password": "password"}
        state, rst = self.client.request(url, method, data=data)
        return state, rst

    def _test_migrate(self):
        vm_id = "4a8a3311-25e4-4f46-94d2-fca3798c9882"
        url = '/vm/%s/migrate' % vm_id
        method = 'POST'
        data = {
            "destination_host": "node1",
            "migrate_policy": 1
        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_host(self):
        mv_id = "4a8a3311-25e4-4f46-94d2-fca3798c9882"
        url = "/hosts/%s/available" % mv_id
        method = "GET"
        state, rst = self.client.request(url, method, header=self.header)

    def _test_create_vm(self):
        url = "/vm"
        method = "PUT"

        data51 = {"cores": 1, "memory": 1024, "image": "10f72aec-c60b-4e08-ab09-db7cc94a6f51",
                  "tenant": "7979a5bd9a284ee2a0df82d08ad58263", "host": "node2", "num": 1,
                  "network": [{"vlan": "fea4d82a-da87-4a70-bc87-fe726e656f39", "ip": "10.10.77.1"}],
                  "metadata": {"user": "1d54a71890194d10a4423d25a84a5926",
                               "extend": {"des": "", "displayname": "we09", "keepalive": 0},
                               "sys_volume": {"type": "Default"}}}

        # data = {
        #     "network": [{
        #         "vlan": "55a96965-efab-4e91-b5b7-1d4d42f3edf0",
        #         "ip": ""
        #     }],
        #     "tenant": "121b54c0f885490a8176ec1188832d2a",
        #     "host": "",
        #     "image": "3260a296-d855-4a10-8950-a5febc1fcc69",
        #     "num":1,
        #     "cores": 1,
        #     "memory": 2,
        #     "metadata": {
        #         "sys_volume": {
        #             "type": "Default"
        #         },
        #         "user": "uuid",
        #         "extend": {
        #             "des": "desc",
        #             "keepalive": 0,
        #             "displayname": "sys"
        #         }
        #     },
        #     "super_user_pass": "123456",
        #     "create_policy":0
        # }

        data = \
            {
                'network': [{
                    'vlan': u'bd1acad0-61a7-4532-ba60-5e903f5dfbb7',
                    "subnet": "8435f161-c76c-4c54-8b60-46cbf2284a5e",
                    "ip": "172.16.17.5",
                    "mac":"52:54:00:67:c6:38"
                }],
                'image': u'5a730c85-63f0-4f90-a175-9fdee6c53bf8',
                'num': 1,
                'memory': 2048,
                'cores': 1,
                'size': 22,
                "host": "manage",
                'tenant': u'2703613d70ce4c4d94ed45895452fc36',
                'metadata': {
                    'extend': {'des': 'desc', 'displayname': 'sys', 'keepalive': 0},
                    'order': 'test-001',
                    'sys_volume': {'type': 'EVS_Storages'},
                    'user': 'uuid'
                }
            }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_detach_volumes(self):
        url = "/vm/volume/detach"
        method = "POST"
        data = {
            "vm_id": "779afd59-b7e6-46e4-ab88-ce43f253332a",
            "volume_id": "e1fba0c4-bb1a-48f6-b2ad-dcd40d384cc3"
        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_vm_attch_list_vol(self):
        vm_id = "779afd59-b7e6-46e4-ab88-ce43f253332a"
        url = "/vm/%s/attach/volumes" % vm_id
        method = "GET"
        state, rst = self.client.request(url, method, header=self.header)

    def _test_vm(self):
        vm_id = "38abd534-d58e-4981-81b9-584f708393b7"
        url = "/vm/%s" % vm_id
        method = "GET"
        data = {
        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_delete_vm(self):
        vm_id = "199c4d53-5197-4de6-94af-26aaee72415a"
        url = "/vm/%s" % vm_id
        method = "DELETE"
        state, rst = self.client.request(url, method, header=self.header)

    def test_vm_list1(self):
        url = "/vms"
        method = "GET"
        state, rst = self.client.request(url, method, header=self.header)

    def _test_del_vm(self):
        vm_id = "052f5285-23d9-4678-9579-218417040157"
        url = "/volume/server/%s"
        method = "DELETE"
        state, rst = self.client.request(url, method, header=self.header)

    def _test_del_vm_by_batch(self):
        batch = "vm-6"
        url = "/vms/%s" % batch
        method = "DELETE"
        state, rst = self.client.request(url, method, header=self.header)

    def _test_vm_control(self):
        pass

    def _test_vm_nic_attach(self):
        vm_id = "38abd534-d58e-4981-81b9-584f708393b7"
        url = "/vm/%s/nic" % vm_id
        body = \
            {
                "vlan_id": "7cfc87e9-4f84-4c74-948d-9de4e2391541",
                "ip": "10.10.133.1"
            }
        method = "PUT"
        state, rst = self.client.request(url, method, header=self.header, data=body)

    def _test_vm_nic_detach(self):
        vm_id = "38abd534-d58e-4981-81b9-584f708393b7"
        port_id = "ea7f8431-d0fa-4a4d-86d8-5ad9d72a4df2"
        url = "/vm/%s/nic/%s" % (vm_id, port_id)
        method = "DELETE"
        state, rst = self.client.request(url, method, header=self.header)

    def _test_vm_list(self):
        url = "/vms?subnet_id=04406566-1c59-4899-8c29-6a133a4dbccb"
        method = "GET"
        data = {
            # "batch":"vm-44"
        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_vm_nic_list(self):
        vm_id = "52887cbe-43aa-4767-b8da-5bddb60b4a51"
        url = "/vm/%s/nics" % vm_id
        method = "GET"
        state, rst = self.client.request(url, method, header=self.header)

    def _test_add_vm_nic(self):
        vm_id = "32d47d09-2930-41f2-b987-79c5f39b05da"
        url = "/vm/%s/nic" % vm_id
        method = "PUT"
        data = {
            "vlan_id": "75ae28c6-2550-4cf0-aede-39f0410a8271",
            "subnet_id": "44341e0b-00a6-4b05-8d09-f8b788dc6924",
            "ip": "",
            "mac": "",
        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_del_vm_nic(self):
        vm_id = "32d47d09-2930-41f2-b987-79c5f39b05da"
        port_id = "9402c98d-e6a0-45a4-82e3-8cc9785c3367"
        url = "/vm/%s/nic/%s" % (vm_id, port_id)
        method = "DELETE"
        state, rst = self.client.request(url, method, header=self.header)

    def _tearDown(self):
        pass


if __name__ == '__main__':
    unittest.main()
