#!/usr/bin/env python
# -*- coding: utf-8 -*-

import libvirt
from xml.etree import ElementTree


conn = libvirt.open("qemu:///system")

for instance_id in conn.listDomainsID():
    domain = conn.lookupByID(instance_id)
    tree = ElementTree.fromstring(domain.XMLDesc())
    interfaces = tree.findall('devices/interface/target')
    for interface in interfaces:
        interface_name = interface.get("dev")
        interface_info = domain.interfaceStats(interface_name)

        print("*************************************************")
        print("VM:%s, interface:%s, info:%s" % (domain.name(), interface_name, interface_info))

conn.close()
