#!/usr/bin/env python
# -*- coding: utf-8 -*-

import libvirt

conn = libvirt.open("qemu:///system")
print

for instance_id in conn.listDomainsID():
    domain = conn.lookupByID(instance_id)
    print domain.state()
    # print conn.getCapabilities()
    print("**************************************************")
    print(domain.info())
    print("==================================================")
