#!/usr/bin/env python
# -*- coding: utf-8 -*-

import libvirt

conn = libvirt.open("qemu:///system")
# for instance_id in conn.listDomainsID():
for instance_id in conn.listDomainsID():
    domain = conn.lookupByID(instance_id)
    print instance_id
    print(domain.name())
    print(domain.UUIDString())
    # print(domain.info())
    print("******************************")
conn.close()
