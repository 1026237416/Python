#!/usr/bin/env python
# -*- coding: utf-8 -*-

import datetime
from copy import deepcopy
from constants import NAME_UNIT_MAP, METER_INTERVAL
from easted.utils.datetimeUtils import time2epoch, timestamp2str
from datetime_conversion import *
from helpers import uuid_gen
import logging


__author__ = "fish"

__all__ = [
    "map_to_json",
    "wrap_results_for_multi_links",
    "sample_continuance_enhance",
    "gen_host_chart_rst",
    "add_missing_chart_data"
]

LOG = logging.getLogger('system')

def get_samples_interval(samples):
    default_interval = 5
    if len(samples) < 2:
        return default_interval
    adjacent_intervals = []
    for i in xrange(1, len(samples)):
        interval = (samples[i - 1]['timestamp'] - samples[i]['timestamp']).seconds
        if interval > 0:
            adjacent_intervals.append(interval)
    # LOG.debug("adjacent intervals: %s" % adjacent_intervals)
    interval = max([(adjacent_intervals.count(i), i) for i in adjacent_intervals])[1]
    return interval


def get_index(values, record):
    for i in xrange(0, len(values)):
        if record['timestamp'] > values[i]['timestamp']:
            return i
    return len(values)


def _should_insert_an_item(values, record, interval):
    return len(filter(lambda sample: abs(
        (record['timestamp'] - sample['timestamp']).total_seconds()) < interval * 1.0 / 2,
                      values)) == 0


def add_missing_records(values, cutting_time, limit):
    interval = get_samples_interval(values)
    values_copy = deepcopy(values)

    for i in xrange(0, limit):

        if values:
            record = deepcopy(values[0])
        else:
            record = {
                "timestamp":None,
                "counter_unit":None,
                "counter_volume":None,
                "counter_name":None,
                "resource_id": None,
                "_id": None
            }
        record['timestamp'] = str2dt(datetime.datetime.strftime(cutting_time - datetime.timedelta(seconds=interval * i),
                                                      '%Y-%m-%dT%H:%M:%S'))
        record['counter_volume'] = None
        record['id'] = uuid_gen(24)
        index = get_index(values_copy, record)
        if _should_insert_an_item(values, record, interval):
            values_copy.insert(index, record)
    return values_copy


def add_missing_chart_data(counter_name, limit):
    rst = []
    unit_name = NAME_UNIT_MAP.get(counter_name, None)

    cutting_time = datetime.datetime.utcnow()
    for i in range(0, limit):
        tmp = dict()
        tmp["timestamp"] = str2dt(datetime.datetime.strftime(cutting_time - datetime.timedelta(seconds=5 * i),
                                          '%Y-%m-%dT%H:%M:%S'))
        tmp["counter_unit"] = unit_name
        tmp["counter_volume"] = None
        tmp["counter_name"] = counter_name
        tmp["resource_id"] = None
        tmp["_id"] = None
        rst.append(tmp)
    return rst


def sample_continuance_enhance_1(samples, limit):
    if limit <= 2:
        return samples

    length = max(len(samples), limit)
    utc_now = datetime.datetime.utcnow()
    if len(samples) > 0:
        last_sample_time = samples[0]['timestamp']
        interval = get_samples_interval(samples)
        # treat last sample time and now same time when interval between less than 3/2 intervals
        cutting_time = last_sample_time if (utc_now - last_sample_time).seconds < 3.0 / 2 * interval else utc_now
    else:
        cutting_time = utc_now

    def __group(sample, samples_dict=None):
        if samples_dict is None:
            samples_dict = {}
        if samples_dict.get(sample['resource_id']):
            samples_dict[sample['resource_id']].append(sample)
        else:
            samples_dict[sample['resource_id']] = [sample]
        return samples_dict

    samples_grouped = reduce(lambda samples_dict, sample: __group(sample, samples_dict),
                             samples, {})
    result = reduce(lambda s, e: s + add_missing_records(e, cutting_time, limit), samples_grouped.values(), [])
    # LOG.debug("continuance enhanced samples:  %s" % result)
    return result[:length]


def sample_continuance_enhance(counter_name, samples, limit):
    utc_now = time2epoch(datetime.datetime.utcnow())
    for s in samples:
        s["timestamp"] = time2epoch(s["timestamp"])
    if limit <= 2 and samples:
        return samples
    elif limit <= 2 and not samples:
        for i in range(0, limit):
            samples.append({
                "timestamp": utc_now,
                "counter_unit": None,
                "counter_volume": None,
                "counter_name": counter_name,
                "resource_id": None,
                "_id": None,
                "id": uuid_gen(24)
            })
        return samples
    result = []
    interval = METER_INTERVAL[counter_name]
    if len(samples) > 0:
        last_sample_time = samples[0]['timestamp']
        if (utc_now - last_sample_time) > (limit-1)*interval:
            cutting_time = utc_now
        elif (utc_now - last_sample_time) > 2*interval:
            cutting_time = last_sample_time + ((utc_now - last_sample_time)/interval)*interval
            cutting_time-=interval
        else:
            cutting_time = last_sample_time
    else:
        cutting_time = utc_now
    time_line = [cutting_time - i * interval for i in range(0, limit)]
    samples_dict = {}
    for sample_item in samples:
        if sample_item['resource_id'] in samples_dict:
            samples_dict[sample_item['resource_id']].append(sample_item)
        else:
            samples_dict[sample_item['resource_id']] = [sample_item]

    if samples_dict:
        d_vals = samples_dict.values()
        for time_item in time_line:
            for d_val in d_vals:
                t_flag = False
                t_resource_id = None
                for d_val_item in d_val:
                    if t_resource_id is None:
                        t_resource_id = d_val_item["resource_id"]
                    if abs(d_val_item["timestamp"]-time_item) < interval/2.0:
                        d_val_item["timestamp"] = time_item
                        result.append(d_val_item)
                        t_flag = True
                if not t_flag:
                    result.append({
                        "timestamp": time_item,
                        "counter_unit": None,
                        "counter_volume": None,
                        "counter_name": counter_name,
                        "resource_id": t_resource_id,
                        "_id": None,
                        "id": uuid_gen(24)
                    })
    else:
        for time_item_t in time_line:
            result.append({
                "timestamp": time_item_t,
                "counter_unit": None,
                "counter_volume": None,
                "counter_name": counter_name,
                "resource_id": None,
                "_id": None,
                "id": uuid_gen(24)
            })
    result=sorted(result, key=lambda m: m['timestamp'], reverse=True)
    return result

def gen_host_chart_rst(counter_name, samples):
    if counter_name.startswith("hardware.network."):
        result = {}
        for item in samples:
            resource_id = item['resource_id']
            tmp_val = {
                'unit': item['counter_unit'],
                'value': item['counter_volume'],
                'timestamp': item['timestamp']
            }
            if not resource_id:
                tmp_name = "-"
            else:
                tmp_name = resource_id.split(".")[-1]
            if tmp_name in result:
                result[tmp_name].append(tmp_val)
            else:
                result[tmp_name] = [tmp_val]
    elif counter_name.startswith("network."):
        result = {}
        for item in samples:
            resource_id = item['resource_metadata']["mac"]
            tmp_val = {
                'unit': item['counter_unit'],
                'value': item['counter_volume'],
                'timestamp': item['timestamp']
            }
            if not resource_id:
                tmp_name = "-"
            else:
                tmp_name = resource_id
            if tmp_name in result:
                result[tmp_name].append(tmp_val)
            else:
                result[tmp_name] = [tmp_val]
    else:
        result = []
        for sample in samples:
            result.append({
                'unit': sample['counter_unit'],
                'value': sample['counter_volume'],
                'timestamp': sample['timestamp']
            })
    return result

def map_to_json(samples, meter_type):
    result = []
    for sample in samples:
        result.append({
            'id': sample['resource_id'],
            'type': meter_type,
            'name': sample['counter_name'],
            'unit': sample['counter_unit'],
            'value': sample['counter_volume'],
            'sample_id': str(sample['_id']),
            'timestamp': sample['timestamp']
        })
    return result


def wrap_results_for_multi_links(samples):
    result = []
    for sample in samples:
        link_result = [item for item in result if item['link_name'] == str(sample['id']).split('.')[4]]
        if len(link_result) == 0:
            link_result = dict(link_name=str(sample['id']).split('.')[4], samples=[sample])
            result.append(link_result)
        else:
            link_result[0]['samples'].append(sample)
    return result
