# -*- coding: utf-8 -*-
import random
import logging
from tornado import gen
from easted import config
from exception import HostUnAvailable

POLICY_RANDOM, POLICY_LOAD, POLICY_PACKING = 1, 2, 3
__author__ = 'litao@easted.com.cn'

__all__ = [
    "get_host_by_stategy",
]

CONF = config.CONF
LOG = logging.getLogger('system')


@gen.coroutine
def get_host_by_stategy(hosts, migrate_policy):
    """
    :param hosts:
    :param migrate_policy:
    :return:
    """
    if not hosts:
        raise HostUnAvailable()
    if migrate_policy == POLICY_LOAD:
        destination_host = hosts[-1]
    elif migrate_policy == POLICY_PACKING:
        destination_host = hosts[0]
    else:
        random_host_index = random.randint(0, len(hosts) - 1)
        destination_host = hosts[random_host_index]
    LOG.debug("all avilable hosts %s policy is %s select host is %s", hosts, migrate_policy, destination_host)
    raise gen.Return(destination_host)


@gen.coroutine
def main():
    pass


if __name__ == "__main__":
    from tornado import ioloop
    from easted.core import dbpools

    dbpools.init()
    ioloop.IOLoop.current().run_sync(main)
