#!/usr/bin/env python
# -*- coding: utf-8 -*-

VM_STATES_CONSUMING_CPU = ('ACTIVE', 'PAUSED', 'RESCUED', 'active', 'paused', 'rescued')

PARAM_INSTANCE_ID = 'vm'
PARAM_HOST_ID = 'host'
QUERY_WINDOW_WIDTH_IN_MINUTES = 5

# meter definitions that supported.
USAGE_CPU_CLOUD = 'cpu_usage'
CLOUD = ('cpu_util',
         USAGE_CPU_CLOUD,
         'memory',
         'memory.usage',
         'memory_util',
         'disk.read.bytes.rate',
         'disk.write.bytes.rate')
NETWORK_CLOUD = ('network.incoming.bytes.rate',
                 'network.outgoing.bytes.rate')

UTIL_CPU_HOST = 'hardware.cpu.percent'
UTIL_MEMORY_HOST = 'hardware.memory.percent'
HOST = (UTIL_CPU_HOST,
        'hardware.cpu.usage',
        'hardware.memory.total',
        'hardware.memory.used',
        UTIL_MEMORY_HOST,
        'hardware.network.incoming.bytes.rate',
        'hardware.network.outgoing.bytes.rate')

NAME_UNIT_MAP = {
    "hardware.cpu.percent":"%",
    "hardware.memory.percent":"%",
    "cpu_util":"%",
    "memory_util":"%",
    "disk.read.bytes.rate":"B/s",
    "disk.write.bytes.rate":"B/s",
    "hardware.network.incoming.bytes.rate":"B/s",
    "hardware.network.outgoing.bytes.rate":"B/s",
    "network.incoming.bytes.rate":"B/s",
    "network.outgoing.bytes.rate":"B/s"

}

# predefined keys.
VOLUME = 'volume'
HOST_NAME = 'metadata.host'
VCPUS = 'metadata.flavor.vcpus'

FREQ = 'frequency'
NUM_CORES = 'num_cores'
NUM_ADIGNED_CORES = 'num_asigned_vcores'


METER_INTERVAL = {
    "cpu_util":5,
    "memory_util":5,
    "disk.read.bytes.rate":10,
    "disk.write.bytes.rate":10,
    "network.incoming.bytes.rate":10,
    "network.outgoing.bytes.rate":10,
    "hardware.cpu.percent":5,
    "hardware.memory.percent":5,
    "hardware.network.incoming.bytes.rate":5,
    "hardware.network.outgoing.bytes.rate":5
}
