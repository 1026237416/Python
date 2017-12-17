#!/usr/bin/env python
import argparse
import json
import os
import sys
import uuid

import pyaml
from tornado import httpclient

os.chdir(sys.path[0])
sys.path.append('../common')
from manor.util import generals

from manor.util import cfgutils

cfgutils.init('../etc/conf')


def get_client(method,url):
    url = 'https://%s:8443/manor/cli/%s'%(generals.get_ip(),url)
    request=httpclient.HTTPRequest(
        url=url,
        method=method,
        validate_cert=False)
    client=httpclient.HTTPClient()
    return client,request


pars=argparse.ArgumentParser()
pars.add_argument('-ip',
                  required=True,
                  help='the target ip.',
                  default=False)
pars.add_argument('-content',
                  required=True,
                  help='the content of script.',
                  default=False)
pars.add_argument('-params',
                  required=True,
                  help='the params of script.',
                  default=False)
args=pars.parse_args()

script_id=str(uuid.uuid1())

msg={
    "id":script_id,
    "cmd":"execute_script",
    "target":{"name":"cowbell","ip":args.ip},
    "params":{
        "script_name":"manor_execute_script_"+script_id,
        "serial":'test_serial',
        "script_content":args.content,
        "character":'test_character',
        "params":json.loads(args.params)
    }
}

print 'msg:\n',pyaml.dumps(msg)

method='POST'
client,request=get_client(method,'send_message')
request.body=json.dumps(msg)
response=client.fetch(request)
print pyaml.dumps(json.loads(response.body))
