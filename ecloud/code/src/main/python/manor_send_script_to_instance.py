#!/usr/bin/env python
# coding=utf-8
import cmd
import json
import os
import tempfile
from subprocess import call

import pyaml
from tornado import httpclient

from manor.util import generals


def get_client(method,url):
    ip=generals.get_ip()
    url='https://%s:8443/manor/cli/%s'%(ip,url)
    request=httpclient.HTTPRequest(
        url=url,
        method=method,
        validate_cert=False)
    client=httpclient.HTTPClient()
    return client,request


class Manor(cmd.Cmd):
    prompt='manor >'
    intro="""
        __  ______    _   ______  ____
       /  |/  /   |  / | / / __ \/ __ \\
      / /|_/ / /| | /  |/ / / / / /_/ /
     / /  / / ___ |/ /|  / /_/ / _, _/
    /_/  /_/_/  |_/_/ |_/\____/_/ |_|

===========================================

manor 管理工具。
发送脚本到一个应用中的所有节点。
"""

    def __init__(self):
        cmd.Cmd.__init__(self,completekey='tab',stdin=None,stdout=None)
        self.app_serial=""
        self.script=""

    def do_exit(self,line):
        return True

    def self_complete(self,ids,text):
        if not text:
            completions=ids
        else:
            completions=[f for f in ids if f.startswith(text)]
        return completions

    def do_list_instances(self,line):
        method='GET'
        url='list_instances'
        client,request=get_client(method,url)
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def do_list_app(self,line):
        response=self.self_get_app_detail(line)
        print pyaml.dumps(json.loads(response.body))

    def self_get_app_detail(self,line):
        method='GET'
        params=line.replace(' ','/')
        url='list_app/%s'%params
        client,request=get_client(method,url)
        response=client.fetch(request)
        return response

    def complete_list_app(self,text,line,begidx,endidx):
        return self.self_complate_app_serial(text)

    def do_add_app(self,line):
        self.app_serial=line
        print line,'added.'

    def complete_add_app(self,text,line,begidx,endidx):
        return self.self_complate_app_serial(text)

    def do_show_added_app(self,line):
        print self.app_serial

    def self_complate_app_serial(self,text):
        method='GET'
        url='list_instances'
        client,request=get_client(method,url)
        response=client.fetch(request)
        ids=[_['app_serial'] for _ in json.loads(response.body)]
        return self.self_complete(ids,text)

    def do_edit_script(self,line):
        EDITOR=os.environ.get('EDITOR','vim')  # that easy!

        initial_message=self.script  # if you want to set up the file somehow

        with tempfile.NamedTemporaryFile(suffix=".py") as tf:
            tf.write(initial_message)
            tf.flush()
            call([EDITOR,tf.name])

            # do the parsing with `tf` using regular File operations.
            # for instance:
            tf.seek(0)

            self.script=tf.read()

    def do_show_script(self,line):
        print self.script

    def do_save_scritp(self,line):
        with open(line,'w+') as f:
            f.write(self.script)
        print 'saved ..'

    def do_load_script(self,line):
        with open(line) as f:
            self.script=f.read()
        print 'loaded ..'

    def self_send_msg(self,msg):
        print pyaml.dumps(msg)
        print '------------------------------------------'
        method='POST'
        client,request=get_client(method,'send_message')
        request.body=json.dumps(msg)
        response=client.fetch(request)
        print 'response: ++++++++++++++++++++++++++++++++'
        print pyaml.dumps(json.loads(response.body))

    def do_send(self,line):
        script_id='000-test-000'
        detail=json.loads(self.self_get_app_detail(self.app_serial).body)
        ips=[_['ip'] for _ in detail]

        for ip in ips:
            # calculate HOSTS
            group={}
            HOSTS=[]
            for _d in detail:
                if _d['group_name'] not in group:
                    group[_d['group_name']]=1
                else:
                    group[_d['group_name']]+=1

                token='@' if ip==_d['ip'] else ''

                HOSTS.append(
                    _d['ip']+'|'+_d['group_name']+'_'+str(
                        group[_d['group_name']])+token
                )

            HOSTS=json.dumps(HOSTS)[1:-1].replace('\"','')

            msg={
                "id":script_id,
                "cmd":"execute_script",
                "target":{"name":"cowbell","ip":ip},
                "params":{
                    "script_name":"manor_execute_script_"+script_id,
                    "serial":'test_serial',
                    "script_content":self.script,
                    "character":'test_character',
                    "params":{
                        "HOSTS":HOSTS
                    }
                }
            }
            self.self_send_msg(msg)


Manor().cmdloop()
