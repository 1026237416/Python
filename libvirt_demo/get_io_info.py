#!/usr/bin/env python
# -*- coding: utf-8 -*-

import libvirt
from xml.etree import cElementTree

conn = libvirt.open("qemu:///system")

for instance_id in conn.listDomainsID():
    domain = conn.lookupByID(instance_id)
    tree = cElementTree.fromstring(domain.XMLDesc())
    devices = tree.findall('devices/disk/target')
    for device in devices:
        dev_name = device.get("dev")
        try:
            dev_stats = domain.blockStats(dev_name)
        except libvirt.libvirtError:
            pass
        print("Instance:%s, Device:%s, Stats:%s" % (domain.name(), dev_name, dev_stats))
conn.close()

