#!/usr/bin/env python
# -*- coding: utf-8 -*-

import libvirt
import time


conn = libvirt.open("qemu:///system")
for instance_id in conn.listDomainsID():
    domain = conn.lookupByID(instance_id)
    t1 = time.time()
    c1 = int(domain.info()[4])
    time.sleep(1)
    t2 = time.time()
    c2 = int(domain.info()[4])
    c_nums = int(domain.info()[3])
    usage = (c2 - c1) * 100 / ((t2 - t1) * c_nums * 1e9)
    print "%s Cpu usage %f" % (domain.name(), usage)
conn.close()



