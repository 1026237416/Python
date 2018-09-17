#!/usr/bin/env python
# -*- coding: utf-8 -*-

import libvirt

conn = libvirt.open("qemu:///system")
# for instance_id in conn.listDomainsID():
domain = conn.lookupByUUIDString("650e80e0-8d77-4770-b9dc-4bfe5d5523f6")
print(domain.name())
print(domain.UUIDString())
print(domain.info())
print("******************************")
conn.close()
