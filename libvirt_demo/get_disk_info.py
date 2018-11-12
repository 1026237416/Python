#!/usr/bin/env python
# -*- coding: utf-8 -*-

import libvirt
from xml.etree import ElementTree

conn = libvirt.open("qemu:///system")


domain = conn.lookupByUUIDString("e1bbacc6-f6fc-4417-9747-326ffd0c74de")


def get_disk_read_ops_info(domain):
    tree = ElementTree.fromstring(domain.XMLDesc())
    devices = tree.findall("devices/disk/target")

    all_read_ops = 0
    for device in devices:
        device_name = device.get("dev")
        try:
            _, read_ops, _, _, _ = domain.blockStats(device_name)
            all_read_ops += read_ops
        except libvirt.libvirtError:
            pass

    return all_read_ops

print(get_disk_read_ops_info(domain))

# for instance_id in conn.listDomainsID():
#     domain = conn.lookupByID(instance_id)
#
#     tree = ElementTree.fromstring(domain.XMLDesc())
#     devices = tree.findall("devices/disk/target")
#     #
#     # for device in devices:
#     #     device_name = device.get("dev")
#     #     try:
#     #         dev_info = domain.blockInfo(device_name)
#     #     except libvirt.libvirtError:
#     #         pass
#     #     print("Instance:%s, Device:%s, Info:%s" % (domain.name(), device_name, dev_info))
#
#     all_write_ops = 0
#     print "=================="
#     for device in devices:
#         device_name = device.get("dev")
#         try:
#             # (_, _, _, write_ops, _) = domain.blockInfo(device_name)
#             # all_write_ops += write_ops
#             print "********"
#             print domain.blockStats(device_name)
#         except libvirt.libvirtError:
#             pass
#     # print all_write_ops
# conn.close()
