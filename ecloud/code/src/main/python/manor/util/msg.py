import json

from tornado import gen
from tornado.httpclient import HTTPRequest,AsyncHTTPClient

from manor.util import redis_tool,generals


@gen.coroutine
def send_message(logger,msg):
    try:
        target_ip=msg['target']['ip']
        r=redis_tool.get_it()
        farm_ips=r.keys('%s_$_%s_$_*_$_%s'%('mapup','*',target_ip))
        logger.debug('farm_ips : %s',farm_ips)

        for farm_ip in farm_ips:
            logger.debug('forward msg to ip: %s'%r.get(farm_ip))
            request=HTTPRequest('http://%s/msg'%r.get(farm_ip))
            request.method='POST'
            request.body=json.dumps(msg)

            response=yield AsyncHTTPClient().fetch(request)
            logger.debug('response is %s'%response.body)

            rs=json.loads(response.body)
            if not rs['success']:
                logger.error(rs['msg'])
                raise Exception('manor.error.send.command')
    except:
        logger.error(generals.trace())