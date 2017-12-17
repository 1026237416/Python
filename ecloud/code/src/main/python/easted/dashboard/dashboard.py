# -*- coding: utf-8 -*-
import logging
from tornado import gen
from easted.compute import list_server
from easted.volume import volume_state_count
from easted.host import count_host_state
from easted.network import count_ips
from manor.app_state_counter import get_state_count

LOG = logging.getLogger('system')

@gen.coroutine
def get_stat_data():
    """ get ecloud statistic data
    :param:
    :return:
    """
    stat_data = {}
    try:
        stat_vm_data = yield stat_server()
        stat_data.update(stat_vm_data)
        stat_volume_data = yield stat_volume_backup()
        stat_data.update(stat_volume_data)
        stat_network_data = yield stat_network()
        stat_data.update(stat_network_data)
        stat_host_data = yield stat_host()
        stat_data.update(stat_host_data)
        stat_vapp_data = yield stat_vapp()
        stat_data.update(stat_vapp_data)
    except Exception, e:
        LOG.error("statistic dashboard error: %s" % e)
        raise e
    raise gen.Return(stat_data)


@gen.coroutine
def stat_volume_backup():
    """ statistic volume to show dashboard, filter sys volume
    :return: volume statistic info={"volume_capacity_gb": 0, "volume_num": 0, "backup_num": 0, "backup_capacity_gb":0}
    """
    stat_data = {"volume_capacity_gb": 0, "volume_num": 0, "backup_num": 0, "backup_capacity_gb":0}
    try:
        rst = yield volume_state_count()
        for rst_item in rst:
            if int(rst_item["v_type"]) == 0:
                stat_data["volume_capacity_gb"] = int(rst_item["size"])
                stat_data["volume_num"] = rst_item["count"]
            elif int(rst_item["v_type"]) == 2:
                stat_data["backup_capacity_gb"] = int(rst_item["size"])
                stat_data["backup_num"] = rst_item["count"]
    except Exception, e:
        LOG.error("statistic volume error: %s" % e)
    raise gen.Return(stat_data)


@gen.coroutine
def stat_network():
    """ statistic network ip of used to show dashboard
    :return: ip statistic info={"ip_active": 1, "ip_idle": 1}
    """
    stat_data = {"ip_active": 0, "ip_idle": 0}
    try:
        count_rst = yield count_ips()
        stat_data["ip_active"] = count_rst["ip_used"]
        stat_data["ip_idle"] = count_rst["ip_all"] - count_rst["ip_used"]
    except Exception, e:
        LOG.error("statistic ip error: %s" % e)
        raise e
    raise gen.Return(stat_data)


@gen.coroutine
def stat_host():
    """ statistic host to show dashboard
    :return: host statistic info={"host_available": 1, "host_unavailable": 1}
    """
    stat_data = {
        "host_available": 0,
        "host_unavailable": 0
    }
    try:
        host_state_count = yield count_host_state()
        for item in host_state_count:
            if "available" == item["state"]:
                stat_data["host_available"] = item["count"]
            elif "unavailable" == item["state"]:
                stat_data["host_unavailable"] = item["count"]
    except Exception, e:
        LOG.error("statistic host error: %s" % e)
        raise e
    raise gen.Return(stat_data)

@gen.coroutine
def stat_server():
    """ statistic vm to show dashboard
    :return: vm statistic info={"vm_active": 1, "vm_stop": 1}
    """
    stat_data = {"vm_active":0, "vm_stop":0}
    try:
        rst = yield list_server(with_task=False)
        for rst_item in rst:
            if rst_item["state"] == "active":
                stat_data["vm_active"] += 1
            elif rst_item["state"] == "stopped":
                stat_data["vm_stop"]+=1
    except Exception, e:
        LOG.error("statistic vm error: %s" % e)
    raise gen.Return(stat_data)


@gen.coroutine
def stat_vapp():
    stat_data = {"vapp_available":0, "vapp_unavailable":0}
    try:
        vapp_count = yield get_state_count()
        stat_data["vapp_available"] = vapp_count["normal"]
        stat_data["vapp_unavailable"] = vapp_count["failure"]
    except Exception,e:
        LOG.error("Get Vapp Count Error. Msg : %s"%e)
    raise gen.Return(stat_data)

@gen.coroutine
def main():
    import time
    start = time.time()
    ips = yield stat_server()
    print "used time: %.3f ms" % ((time.time() - start) * 1000)
    print ips


if __name__ == "__main__":
    from tornado import ioloop
    from easted.core import dbpools

    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
