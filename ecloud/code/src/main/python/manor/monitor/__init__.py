# coding=utf-8
import json
import logging
import thread
import time
import uuid

from tornado.websocket import WebSocketHandler

from manor.streamlet import get_resources_info
from manor.util import redis_tool,generals
from manor.util.db_utils import execute_query
from manor.screwdriver.vendor_ecloud import list_app_resources

_clients={}
_monitors={}

"""
此模块负责对应用状态的监控。

只有创建完成的应用才能正确的获取所有节点的信息。
"""


class MonitorHandler(WebSocketHandler):
    def __init__(self,application,request,**kwargs):
        super(MonitorHandler,self).__init__(application,request,**kwargs)
        self.log=logging.getLogger('manor')
        self.id=str(uuid.uuid1())

    def data_received(self,chunk):
        pass

    def on_message(self,message):
        try:
            self.log.debug(_monitors)
            msg=json.loads(message)
            self.log.debug('receive message:%s'%msg)
            app_serial=msg['app_serial']
            _clients[self.id]['serial'].append(app_serial)

            self.log.debug(app_serial)
            self.log.debug(_monitors.keys())
            if app_serial not in _monitors.keys():
                _monitors[app_serial]=Monitor(app_serial)
            self.write_message(_monitors[app_serial].msg)

        except:
            msg=generals.trace()
            self.log.error(msg)
            self.write_message('error')

    def open(self):
        _clients[self.id]={'client':self,'serial':[]}

    def on_close(self):
        ip=self.request.remote_ip
        self.log.debug('conn %s closed'%ip)
        del _clients[self.id]


class Monitor(object):
    def __init__(self,app_serial):
        self.log=logging.getLogger('manor')
        self.serial=app_serial
        self.status='building'
        self.msg=json.dumps({'serial':app_serial,'status':'working','msg':[]})
        self.current_msg=self.msg
        thread.start_new(self.working,())
        thread.start_new(self.message_sending,())

    def message_sending(self):
        while True:
            time.sleep(0.5)
            if self.msg!=self.current_msg:
                self.msg=self.current_msg
                send_msg=json.loads(self.msg)
                info=list_app_resources(self.serial)
                while not info.done():
                    pass
                send_msg['info']=info.result()
                send_msg=json.dumps(send_msg)
                clients=[]
                for c in _clients.values():
                    if self.serial in set(c['serial']):
                        c['client'].write_message(send_msg)
                        clients.append(1)

            if len(
                [_ for _ in _clients.values() if self.serial in _['serial']])==0:
                self.status='interrupt'
            # 这段代码的位置很重要。
            if self.status=='interrupt':
                del _monitors[self.serial]
                break

            if self.status=='building':
                def do_result(rows):
                    if len(rows)>0:
                        self.status=rows[0]['state']
                        self.log.debug('check state from db : %s'%self.status)

                execute_query(
                    ("SELECT * FROM manor.manor_app_instance "
                     "where app_serial='%s'")%self.serial,do_result)

            if self.status=='failure':
                try:
                    r=redis_tool.get_it()
                    error=r.get('manage_error_$_%s'%self.serial)
                    if error is None:
                        error='""'
                    error=json.loads(error)
                    self.current_msg='{"serial":"%s","status":"failure","msg":[],"error":%s}'%(
                        self.serial,json.dumps(error))
                    thread.start_new(self.delete_error_msg,(r,))
                except:
                    self.log.error(generals.trace())
                self.status='interrupt'

            if self.status=='thread_error':
                self.current_msg='{"serial":"%s","status":"error","msg":[]}'%self.serial
                self.status='interrupt'

    def working(self):
        while True:
            if self.status=='interrupt':
                break
            if self.status=='failure':
                break
            if self.status=='normal':
                try:
                    def set_rs(rows):
                        resources=[]
                        for r in rows:
                            stack_id=r['stack_id']
                            group_name=r['group_name']
                            res=get_resources_info(stack_id)

                            while True:
                                if res.done():
                                    break
                                time.sleep(0.1)

                            for info in res.result():
                                info['group_id']=group_name

                            resources=resources+res.result()

                        for r in resources:
                            redis=redis_tool.get_it()
                            road_map=redis.keys('mapup*')
                            ip=r['addresses'].values()[0][0]['addr']
                            ips=[_.split('_$_')[3] for _ in road_map]
                            if ip in ips:
                                r['agent_state']='online'
                            else:
                                r['agent_state']='offline'

                        if len(resources)==len(
                            [_ for _ in resources if _['status']=='ACTIVE']):
                            self.current_msg=json.dumps({
                                'serial':self.serial,
                                'status':'normal',
                                'msg':self.return_msg(resources)
                            })
                            if 'offline' in [_['agent_state'] for _ in resources
                                             if
                                             _['status']=='ACTIVE']:
                                self.current_msg=json.dumps({
                                    'serial':self.serial,
                                    'status':'offline',
                                    'msg':self.return_msg(resources)
                                })
                        elif len(
                            [_ for _ in resources if _['status']=='ACTIVE'])!=0:
                            group_ids=[_['group_id'] for _ in resources]
                            down=False
                            for g in group_ids:
                                if len([_ for _ in resources if
                                        _['status']=='ACTIVE' and _[
                                            'group_id']==g])==0:
                                    down=True

                            if not down:
                                self.current_msg=json.dumps({
                                    'serial':self.serial,
                                    'status':'part',
                                    'msg':self.return_msg(resources)
                                })
                            else:
                                self.current_msg=json.dumps({
                                    'serial':self.serial,
                                    'status':'down',
                                    'msg':self.return_msg(resources)
                                })
                        else:
                            self.current_msg=json.dumps({
                                'serial':self.serial,
                                'status':'stop',
                                'msg':self.return_msg(resources)
                            })

                        r=redis_tool.get_it()
                        error=r.get('manage_error_$_%s'%self.serial)
                        if error:
                            self.log.debug(error)
                            current_msg=json.loads(self.current_msg)
                            current_msg['error']=json.loads(error)
                            self.current_msg=json.dumps(current_msg)
                            thread.start_new(self.delete_error_msg,(r,))

                    execute_query(
                        ("select stack_id,group_name from manor.manor_stacks "
                         "WHERE  app_serial= '%s'"%self.serial),set_rs)

                except:
                    self.log.error('work thread error ..')
                    self.log.error(generals.trace())
                    self.status='thread_error'

            time.sleep(1)

    def delete_error_msg(self,r):
        time.sleep(3)
        r.delete('manage_error_$_%s'%self.serial)

    @staticmethod
    def return_msg(resources):
        return [{
                    "status":_['status'],
                    "ip":_['addresses'].values()[0][0]['addr'],
                    "agent_state":_['agent_state'],
                    'group_id':_['group_id']
                } for _ in resources]
