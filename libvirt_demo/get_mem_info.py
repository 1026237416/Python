#!/usr/bin/env python
# -*- coding: utf-8 -*-

import libvirt

conn = libvirt.open("qemu:///system")
for instance_id in conn.listDomainsID():
    domain = conn.lookupByID(instance_id)
    print domain.UUIDString()
    print domain.name()
    # domain.setMemoryStatsPeriod(10)
    # mem_info = domain.memoryStats()
    # print mem_info

conn.close()


