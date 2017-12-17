#!/usr/bin/env python
import argparse
import json

from tornado import gen,ioloop
from tornado.httpclient import HTTPRequest
from tornado.websocket import websocket_connect
from manor.util import generals

url='wss://%s:8443/manor/socket/app/message'%generals.get_ip()
pars=argparse.ArgumentParser()
pars.add_argument('-token',
                  required=True,
                  help='the token of message.',
                  nargs='?',
                  const=True,
                  default=False)
args=pars.parse_args()
token=args.token


@gen.coroutine
def main():
    request=HTTPRequest(url=url,validate_cert=False)
    conn=yield websocket_connect(request)
    conn.write_message(json.dumps({
        "message_token":token
    }))
    while True:
        msg=yield conn.read_message()
        print '-msg-',msg

        yield gen.sleep(1)


ioloop.IOLoop.current().run_sync(main)
