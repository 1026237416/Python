#!/usr/bin/env python
# -*- coding: utf-8 -*-
import libvirt
import time

from xml.etree import ElementTree

class GetVmMeter(object):
    def __init__(self):
        self.url = "qemu:///system"
        self.connection = None

    def get_connection(self):
        if not self.connection:
            self.connection = libvirt.open(self.url)
        return self.connection

    def get_domain(self, vm_id=None, name=None, uuid=None):
        if vm_id:
            return self.get_connection().lookupByID(vm_id)
        if name:
            return self.get_connection().lookupByName(name)
        if uuid:
            return self.get_connection().lookupByUUIDString(uuid)

    def get_cpu_util(self, domain):
        (_, _, _, num_cpu, cpu_time_start) = domain.info()
        real_time_start = time.time()
        time.sleep(1)
        (_, _, _, _, cpu_time_end) = domain.info()
        real_time_end = time.time()
        real_diff_time = real_time_end - real_time_start
        cpu_util = 100 * (cpu_time_end - cpu_time_start) / float(num_cpu * real_diff_time * 1000000000)
        if cpu_util > 100:
            cpu_util = 100.0
        elif cpu_util < 0:
            cpu_util = 0.0

        return cpu_util

    def get_mem_usage(self, domain):
        domain.setMemoryStatsPeriod(10)
        mem_info = domain.memoryStats()
        free_mem = float(mem_info['unused'])
        total_mem = float(mem_info['available'])
        mem_usage = ((total_mem - free_mem) / total_mem) * 100

        return mem_usage

    def get_nic_rx_info(self, domain):
        tree = ElementTree.fromstring(domain.XMLDesc())
        interfaces = tree.findall('devices/interface/target')
        all_rx_bytes = 0
        all_tx_bytes = 0
        for interface in interfaces:
            interface_name = interface.get("dev")
            rx_bytes, _, _, _, tx_bytes, _, _, _ = domain.interfaceStats(interface_name)

            all_rx_bytes += rx_bytes
            all_tx_bytes += tx_bytes
        return all_rx_bytes

    def get_nic_tx_info(self, domain):
        tree = ElementTree.fromstring(domain.XMLDesc())
        interfaces = tree.findall('devices/interface/target')
        all_rx_bytes = 0
        all_tx_bytes = 0
        for interface in interfaces:
            interface_name = interface.get("dev")
            rx_bytes, _, _, _, tx_bytes, _, _, _ = domain.interfaceStats(interface_name)

            all_rx_bytes += rx_bytes
            all_tx_bytes += tx_bytes
        return all_tx_bytes

    def get_disk_read_ops_info(self, domain):
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

    def get_disk_write_ops_info(self, domain):
        tree = ElementTree.fromstring(domain.XMLDesc())
        devices = tree.findall("devices/disk/target")

        all_write_ops = 0
        for device in devices:
            device_name = device.get("dev")
            try:
                _, _, _, write_ops, _ = domain.blockStats(device_name)
                all_write_ops += write_ops
            except libvirt.libvirtError:
                pass

        return all_write_ops

    def conn_close(self):
        if self.connection:
            self.connection.close()

    def get_all_on_vm_uuid(self):
        return [self.get_connection().lookupByID(instance_id).UUIDString()
                for instance_id in self.get_connection().listDomainsID()]

    def get_all_on_vm_name(self):
        return [self.get_connection().lookupByID(instance_id).name()
                for instance_id in self.get_connection().listDomainsID()]

if __name__ == '__main__':
    libvirt_conn = GetVmMeter()

    all_vm_uuid = libvirt_conn.get_all_on_vm_uuid()
    uuid = "682e69cd-52ee-431e-9847-75beb6ab8dd8"

    all_vm_name = libvirt_conn.get_all_on_vm_name()
    print all_vm_name

    # domain = libvirt_conn.get_domain(uuid=uuid)
    # print libvirt_conn.get_cpu_util(domain)
    # print libvirt_conn.get_disk_read_ops_info(domain)


