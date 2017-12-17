#!/usr/bin/env python
# -*- coding: utf-8 -*-
import unittest
from testcase.core.base import TestCase

class BackupTest(TestCase):
    comm = {}
    def __call__(self, result=None):
        self.base_url = "https://10.10.130.99:8443"
        super(BackupTest, self)._pre_setup(self.base_url)
        super(BackupTest, self).__call__()

    def setUp(self):
        if not BackupTest.comm.get("token", ""):
            state, rst = self.login()
            BackupTest.comm["token"] = rst["token"]
        self.header = {
            "Ecloud-Token": BackupTest.comm["token"]
        }


    def login(self):
        url = '/login'
        method = 'POST'
        data = {"name":"bcx","password":"password123"}
        state, rst = self.client.request(url, method, data=data)
        return state, rst

    def _test_create_backup(self):
        url = "/snapshot"
        method="PUT"

        vm_id="45b69737-c88c-4571-81dd-3edd9816e616"
        vol_id1 = "42bb4595-f46c-4f9e-8cf2-8eb3f0038bf4"
        #vol_id = "0f46e2a3-0ae9-4359-8e75-cf2c38caeef4" #挂载在vm上
        data={
            "id":"%s"%vm_id,
            "type":0,
            "name":"back-vd2",
            "des":"sdss",
            "volume_ids":[]
        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_delete_backup(self):
        backup_id = "145b83ba-3093-4223-b391-17524cc020a2"
        url = "/snapshot/%s"%backup_id
        method = "DELETE"
        data = {

        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_delete_backups(self):
        url = "/snapshots"
        method = "DELETE"
        data = {

        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def test_get_backup(self):
        backup_id1 = "5d5e41ea-0a3d-4221-aac5-7ec54fc10cfa"  # vm
        backup_id2 = "6f8d803f-0bdf-4c55-92c1-6e41469afc98"  # vd
        url = "/snapshot/%s" % backup_id1
        method = "GET"
        data = {

        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_update_backup(self):
        backup_id = "6a63d778-5b00-487f-98fc-a848569e756b"
        url = "/snapshot/%s" % backup_id
        method = "POST"
        data = {
            "name":"back-vd2",
            "des":"sdss"
        }
        state, rst = self.client.request(url, method, header=self.header, data=data)


    def _test_list_back_summary(self):
        url="/snapshots/summary"
        method = "GET"
        data = {
            "type":0
        }
        state, rst = self.client.request(url, method, header=self.header, data=data)



    def _test_list_backups(self):
        name1 = "vm-183" #vm
        name2 = "vd-1-1" #vd
        url = "/snapshots/%s" % name1
        method = "GET"
        data = {

        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def _test_del_volume(self):
        volume_id = "9cf0ebcc-c553-4c89-9112-1d733e206c22"
        vd_type = 1

        #0a0030a7-ae70-4c82-90c0-76858ce18e44
        #1b795eb2-0306-473c-986f-4c96c832a4e7
        #8bab24ca-0f2f-46ad-80ac-b75413eabde1
        #cbaf2d09-fc6c-450c-b06a-42df8b1420d6

        url = "/volume/%s/type/%s" % (volume_id, vd_type)
        method = "DELETE"
        data = {

        }
        state, rst = self.client.request(url, method, header=self.header, data=data)



    def _test_recover_backup(self):
        backup_id = "3d4d73a9-c066-4617-8b79-2d9768ccb63e"
        url = "/snapshot/%s/recover"%backup_id
        method = "GET"
        data = {

        }
        state, rst = self.client.request(url, method, header=self.header, data=data)

    def tearDown(self):
        pass

if __name__ == '__main__':
    unittest.main()
