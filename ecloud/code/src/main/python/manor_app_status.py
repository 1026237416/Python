#!/usr/bin/env python
import argparse
import json

from tornado import gen,ioloop
from tornado.httpclient import HTTPRequest
from tornado.websocket import websocket_connect
from manor.util import generals

url='wss://%s:8443/manor/socket/app/status'%generals.get_ip()
pars=argparse.ArgumentParser()
pars.add_argument('-serial',
                  required=True,
                  help='the serial number of application.',
                  nargs='?',
                  const=True,
                  default=False)
args=pars.parse_args()
serial=args.serial


@gen.coroutine
def main():
    request=HTTPRequest(url=url,validate_cert=False)
    conn=yield websocket_connect(request)
    conn.write_message(json.dumps({
        "app_serial":serial
    }))
    while True:
        msg=yield conn.read_message()
        print '------------------------------------------------------------'
        print '-msg-',msg
        if msg is None:
            break

        yield gen.sleep(1)


ioloop.IOLoop.current().run_sync(main)
