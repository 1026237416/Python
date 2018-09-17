#!/usr/bin/env python
# -*- coding: utf-8 -*-

import libvirt
from xml.etree import ElementTree

conn = libvirt.open("qemu:///system")

for instance_id in conn.listDomainsID():
    domain = conn.lookupByID(instance_id)

    tree = ElementTree.fromstring(domain.XMLDesc())
    devices = tree.findall("devices/disk/target")
    #
    # for device in devices:
    #     device_name = device.get("dev")
    #     try:
    #         dev_info = domain.blockInfo(device_name)
    #     except libvirt.libvirtError:
    #         pass
    #     print("Instance:%s, Device:%s, Info:%s" % (domain.name(), device_name, dev_info))

    all_write_ops = 0
    print "=================="
    for device in devices:
        device_name = device.get("dev")
        try:
            # (_, _, _, write_ops, _) = domain.blockInfo(device_name)
            # all_write_ops += write_ops
            print "********"
            print domain.blockStats(device_name)
        except libvirt.libvirtError:
            pass
    # print all_write_ops
conn.close()
