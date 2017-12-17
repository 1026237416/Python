import logging
from easted.compute.server import list_server
from tornado import gen

from manor.util import redis_tool


@gen.coroutine
def check_mapup():
    log=logging.getLogger('manor')
    log.debug('clean mapup .......start')
    rs=yield list_server(with_task=False)
    ips=[_['network_info'][0]['ip'] for _ in rs]
    log.debug(ips)
    r=redis_tool.get_it()
    _keys=r.keys('mapup_$_*')
    for k in _keys:
        ip=k.split('_$_')[3]
        log.debug(ip)
        if ip not in ips:
            log.debug('delete %s'%k)
            r.delete(k)
    log.debug('clean mapup .......finish')
