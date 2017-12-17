import redis

from manor.util import cfgutils

__pool=None


def get_it():
    global __pool
    if __pool is None:
        __pool=redis.ConnectionPool(
            host=cfgutils.getval('redis','host'),
            port=cfgutils.getval('redis','port'),db=0)

    return redis.Redis(connection_pool=__pool)
