#!/usr/bin/env python
# -*- coding: utf-8 -*-

from easted.compute import get_server
from easted.core.threadpool import FutureThreadPool
from constants import *
from easted.host.host import query_host, list_simple_hosts
from helpers import *
from result_formatter import sample_continuance_enhance

__author__ = 'fish'

__all__ = [
    "frequency_used_vcpu",
    "meters_topn_of_util",
    "SampleQuery"
]

FREQ_DICT = {}


class SampleQuery(object):
    _thread_pool = FutureThreadPool()

    ################################################
    #
    # Sample query process.
    #
    ################################################

    @gen.coroutine
    def build_query(self, meter_name, query_id, limit, **kwargs):
        """build query conditions set.

        :param meter_name: name of the meter for querying.
        :param query_id: usually the resource id of a meter record
        :param limit: the num of meter records query should return
        :return: a set of combined query conditions.
        """
        if meter_name.startswith('network.'):
            compose = {'counter_name': meter_name, 'resource_metadata.instance_id': query_id}
            limit = limit * 6
        elif meter_name.startswith('compute.'):
            host = yield query_host(id=query_id)
            host = {} if len(host) == 0 else host[0]
            compose = {'counter_name': meter_name, 'resource_metadata.host': 'compute.%s' % host.get('name')}
        elif meter_name.startswith('hardware.network.'):
            try:
                adapters = yield get_host_notwork_adapters(query_id)
                # LOG.debug("physical links got: %s" % adapters)
                limit = limit * len(adapters) * 2
                compose = {'counter_name': meter_name, 'resource_id': {"$in": [adapter for adapter in adapters]}}
            except Exception, e:
                LOG.debug("ceilometer - build query: %s" % e)
                raise OpenStackException(e.message)
        else:
            compose = {'counter_name': str(meter_name), 'resource_id': str(query_id)}
        # fetch recent 30 minutes records
        compose['timestamp'] = {'$lt': datetime.datetime.utcnow(),
                                '$gt': datetime.datetime.utcnow() - datetime.timedelta(minutes=30)}
        raise gen.Return((compose, limit))

    @gen.coroutine
    def frequency_used_vcpu(self, vm_id, vm_cpu_util):
        """calculate cpu usage of a specific vm instance according to latest records attached.

        :param vm_cpu_util: cpu_util of a vm instance.
        :param vm_id: instance id of a vm.
        :return cpu frequency used in MHz.
        """
        try:
            instance = yield get_server(vm_id=vm_id)

            host_cpu_info = yield self.cpu_info(instance['host']['ip'])
            frequency = host_cpu_info['frequency']

            frequency_used = frequency * instance['cores'] * vm_cpu_util / 100
        except Exception, e:
            LOG.debug("ceilometer - cpu frequency: %s" % e)
            raise OpenStackException(e.message)
        raise gen.Return(frequency_used)

    @gen.coroutine
    def cpu_info(self, host_ip):
        """get cpu info of a specific physical node(which runs nova).

        :param host_ip: resource_id in ceilometer while ip in openstack
        :return:
            {
                frequency: <num in MHz>,
                num_cores: <num physical cores>,
                # num_assigned_vcores: <num running vcores>
            }
        """
        try:
            host = yield list_simple_hosts(ip=host_ip)
            frequency = FREQ_DICT.get(host_ip, 1.0)
            if frequency == 1.0:
                result = yield self.meters_query('compute.node.cpu.frequency', host=host[0].get('id'))
                if result:
                    frequency = result[0]['counter_volume']
                    FREQ_DICT[host_ip] = frequency
        except Exception, e:
            raise OpenStackException(e.message)
        raise gen.Return({
            'frequency': frequency,
            'num_cores': host[0].get('cpus'),
        })

    @gen.coroutine
    def meters_query(self, meter_name, **kwargs):
        """get {limit} records of a specific meter {meter_name} of given conditions.

        :param meter_name: name of the meter for querying.
        :param kwargs: condition descriptions, currently supported parameters are resource_id, host_ip, etc
        :return: a list of meter values(dict array). A concrete return value may look like:
            [{
                id: '6daf234e6',
                type: 'vm',
                name: 'cpu_util',
                unit: '%',
                value: '24.5',
                timestamp: '2015/12/3, 08:23:24, UTC'
            },{
                id: '6dafac4e6',
                type: 'vm',
                name: 'cpu_util',
                unit: '%',
                value: '35.1',
                timestamp: '2015/12/3, 08:24:24, UTC'
            }]
        """
        try:
            host_id = kwargs.get(PARAM_HOST_ID, '')
            limit = kwargs.get('limit', 1)
            start = kwargs.get('start', None)
            end = kwargs.get('end', None)
            resource_id = kwargs.get(PARAM_INSTANCE_ID, '')

            tmp_meter = meter_name
            if meter_name == USAGE_CPU_CLOUD:
                tmp_meter = 'cpu_util'
            params = {}
            if start:
                params['start'] = start
            if end:
                params['end'] = end
            query, limit_total = yield self.build_query(tmp_meter, resource_id or host_id, limit, **params)

            if resource_id:
                try:
                    instance = yield get_server(vm_id=resource_id)
                except Exception, e:
                    instance = {}
                result = yield samples_query(query, limit_total) \
                    if (instance.get('state') in VM_STATES_CONSUMING_CPU) else []
            else:
                result = yield samples_query(query, limit_total)
            if meter_name == USAGE_CPU_CLOUD:
                for meter in result:
                    # cpu_usage meter id generated from cpu_util
                    meter['_id'] = str(meter['_id']) + uuid_gen(6)
                    meter['counter_name'] = USAGE_CPU_CLOUD
                    meter['counter_volume'] = yield self.frequency_used_vcpu(resource_id, meter['counter_volume'])
                    meter['counter_unit'] = "MHz"
            result = sample_continuance_enhance(meter_name, result, limit)
        except Exception, e:
            LOG.debug("ceilometer - samples query error: %s" % e)
            raise OpenStackException(e.message)
        raise gen.Return(result)

    ################################################
    #
    # Top n hosts or instance handling.
    #
    ################################################

    @gen.coroutine
    def topn_of_hardware(self, meter_name, num, hosts):
        samples = []
        for host in hosts:
            if host['state'] != "available":
                continue
            sample = yield self.meters_query(meter_name, host=host['ip'])
            if sample and sample[0]["counter_volume"]:
                samples.extend(sample)
        raise gen.Return(samples[:num])

    @gen.coroutine
    def topn_of_vm(self, meter_name, num, vms):
        samples = []
        for vm in vms:
            sample = yield self.meters_query(meter_name, vm=vm['id'])
            samples.extend(sample)
        samples = sorted(samples, key=lambda m: m['counter_volume'], reverse=True)
        raise gen.Return(samples[:num])

    @gen.coroutine
    def hardware_cpu_result(self, meters):
        result = []
        try:
            for meter in meters:
                info = yield self.cpu_info(meter['resource_id'])
                if info.get('frequency', None) and info.get('num_cores', None):
                    result.append(
                        {
                            'host_ip': meter['resource_id'],
                            'sample_id': str(meter['_id']),
                            'total': '%s * %s' % (info.get('num_cores', None), info.get('frequency', None)),
                            'value': meter['counter_volume'],
                            'unit': '%'
                        })
        except Exception as e:
            LOG.error(e)
            raise e
        raise gen.Return(result)

    @gen.coroutine
    def hardware_memory_result(self, meters):
        result = []
        for meter in meters:
            sample_memory_total = yield self.meters_query('hardware.memory.total', host=meter['resource_id'])
            total = sample_memory_total[0] if len(sample_memory_total) > 0 else {}
            result.append(
                {
                    'host_ip': meter['resource_id'],
                    #  'sample_id': str(meter['_id']),
                    'total': total['counter_volume'],
                    'value': meter['counter_volume'],
                    'unit': meter['counter_unit']
                })
        raise gen.Return(result)

    @staticmethod
    def vm_cpu_result(meters):
        return map(lambda meter:
                   {
                       'id': meter['resource_id'],
                       'sample_id': str(meter['_id']),
                       'total': '100',
                       'used': meter['counter_volume'],
                       'unit': meter['counter_unit']
                   }, meters)

    @gen.coroutine
    def vm_memory_result(self, meters):
        result = []
        for meter in meters:
            sample_memory_total = yield self.meters_query('memory', vm=meter['resource_id'])
            total = sample_memory_total[0] if len(sample_memory_total) > 0 else {}
            result.append(
                {
                    'id': meter['resource_id'],
                    'sample_id': str(meter['_id']),
                    'total': total['counter_volume'],
                    'used': meter['counter_volume'],
                    'unit': meter['counter_unit']
                })
        raise gen.Return(result)

    @gen.coroutine
    def meters_topn_of_util(self, num=5):
        """get the top {num} of instance statistics.

        :param num: the num of top instance samples should return.
        :return: array of samples.
        """
        try:
            result = {
                "type": "dashboard_topn",
                "cpu_used": [],
                "memory_used": []
            }
            names = [
                "hardware.cpu.percent",
                "hardware.memory.percent"
            ]
            hosts = yield list_simple_hosts()
            for meter_name in names:
                meters = yield self.topn_of_hardware(meter_name, 1000, hosts)
                if meter_name == 'hardware.cpu.percent':
                    result["cpu_used"] = yield self.hardware_cpu_result(meters)
                    result["cpu_used"] = sorted(result["cpu_used"], key=lambda m: (m['value'] if 'value' in m else 0),
                                                reverse=True)
                    result["cpu_used"] = result["cpu_used"][:num]
                elif meter_name == 'hardware.memory.percent':
                    result["memory_used"] = yield self.hardware_memory_result(meters)
                    result["memory_used"] = sorted(result["memory_used"],
                                                   key=lambda m: (m['value'] if 'value' in m else 0), reverse=True)
                    result["memory_used"] = result["memory_used"][:num]
        except Exception, e:
            LOG.debug("ceilometer - top n list: %s" % e)
            err_rst = {
                "type": "error",
                "dashboard_topn": e.message
            }
            raise OpenStackException(err_rst)
        raise gen.Return(result)


@gen.coroutine
def main():
    start = time.time()

    # rst = yield SampleQuery().meters_topn_of_util("hardware.cpu.percent",num=10)
    # print "rst====%s\n"%rst
    # print "last time: %s "%(time.time() - start)


if __name__ == "__main__":
    from tornado import ioloop
    from easted.core import dbpools

    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
