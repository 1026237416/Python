# coding=utf-8
import json
import time
import pyaml
from uuid import uuid1

from manor.util import redis_tool
from manor.util.msg import send_message
from tornado import gen

from manor.streamlet import StreamletBase,get_stack_resources,get_roles
from manor.util import generals


def get_instance(params,node_id,serial):
    return ExecuteScript(params,serial,node_id)


class ExecuteScript(StreamletBase):
    def __init__(self,params,serial,node_id):
        super(ExecuteScript,self).__init__(node_id,params,serial)
        self.roles=[]
        self.old=None
        self.command_params=[]
        self.command_ids=[]
        self.ips=[]
        self.info_token=''

    @gen.coroutine
    def execute(self):
        try:
            if not self.executed:
                self.executed=True
                self.log.debug('params:')
                self.log.debug(pyaml.dumps(self.params))

                script_content=self.params['execute_script_content']
                script_params=self.params['script_params']
                if 'info_token' in self.params:
                    self.info_token=self.params['info_token']

                rs=yield self.get_stack_id_list()

                self.log.debug('stack id: %s'%str(rs))

                for stack_id in [_['stack_id'] for _ in rs]:
                    temp=yield get_stack_resources(stack_id)
                    self.command_params=self.command_params+temp
                    roles=yield get_roles(stack_id)
                    self.roles=self.roles+roles

                # 根据脚本参数判断发送的目标
                self.filter_by_group(script_params)
                self.filter_by_ip(script_params)

                self.log.debug(self.command_params)

                self.ips=[_['ip'] for _ in self.command_params]

                for command_p in self.command_params:
                    self._send_msg(command_p,script_content,script_params)

        except:
            self.log.error(generals.trace())

    def filter_by_ip(self,script_params):
        on_group=[_ for _ in script_params if _['name']=='ON_IP']
        if len(on_group)>0 and 'value' in on_group[0]:
            target=on_group[0]['value']
        else:
            target=None
        if target is not None and target!='':
            self.command_params=[_ for _ in self.command_params if
                                 _['ip']==target]

    def filter_by_group(self,script_params):
        on_group=[_ for _ in script_params if _['name']=='ON_GROUP']
        if len(on_group)>0:
            target=on_group[0]['value']
        else:
            target=None
        if target is not None and target!='':
            self.command_params=[_ for _ in self.command_params if
                                 _['character']==target]

    def _send_msg(self,command_p,script_content,script_params):
        script_id=str(uuid1())
        self.command_ids.append(script_id)
        hosts=[]
        for n in self.roles:
            if n.find(command_p['ip'])!=-1:
                hosts.append(n+'@')
            else:
                hosts.append(n)
        msg={
            "id":script_id,
            "cmd":"execute_script",
            "target":{"name":"cowbell","ip":command_p['ip']},
            "params":{
                "script_name":"manor_execute_script_"+script_id,
                "serial":self.serial,
                "script_content":script_content,
                "character":command_p['character'],
                "params":{
                    "HOSTS":self.get_string_from_data(hosts),
                }
            }
        }

        if self.info_token:
            msg['params']['params']['info_token']=self.info_token


        for pp in [_ for _ in script_params if _['type']!='system_default']:
            msg['params']['params'][pp['name']]=pp['value']

        self.log.debug(json.dumps(msg))

        send_message(self.log,msg)

    @staticmethod
    def get_string_from_data(data):
        return json.dumps(data)[1:-1].replace('"','').replace(" ","")

    def __get_messages(self):
        r=redis_tool.get_it()
        rs=[]
        messages=r.keys('execute_script_$_%s_$_*'%self.serial)
        rs=rs+[_.split('_$_')[2] for _ in messages if
               _.split('_$_')[3] in self.command_ids]
        return rs

    def check_finish(self):
        self.log.debug('check finish .. ')
        self.log.debug('%s -- %s'%(self.__get_messages(),self.ips))
        if len(self.ips)>0 and self.ips==[_ for _ in self.ips if
                                          _ in self.__get_messages()]:
            for x in range(10):
                self.log.debug('finish count down:%s'%x)
                time.sleep(1)
            self.log.debug('finished ...')
            return True
        return False
