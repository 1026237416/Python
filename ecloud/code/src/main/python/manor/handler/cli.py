import json
import logging

from tornado import gen
from tornado.web import RequestHandler

from easted.core import sequence
from manor.util import generals
from manor.util.msg import send_message
from manor.util import redis_tool
from manor.util import template
from manor.services import app_service
from manor.screwdriver import stack_util
from manor.screwdriver.vendor_ecloud import _create


class ManorHandler(RequestHandler):
    def __init__(self,application,request,**kwargs):
        super(ManorHandler,self).__init__(application,request,**kwargs)
        self.log=logging.getLogger('manor')
        self.rs=''

    def initialize(self):
        sequence.register('CL')

    def prepare(self):
        self.log.debug('manor.cli : %s'%self.request.path)

    def data_received(self,chunk):
        pass

    @gen.coroutine
    def post(self,chunk):
        try:
            keys=self.get_key_params(self.request.path)
            if keys[0]=='create_instance':
                seq=yield sequence.number_seq('CL','')
                rs=template.create_instance(self.request,keys[1],keys[2],
                                            'CL-%s'%seq)
                self.write(json.dumps(rs))

            if keys[0]=='delete_instance':
                app_service.do_delete_app(keys[1])
                self.write('{"result":"ok"}')

            if keys[0]=='delete_stack':
                stack_util.delete_stack(keys[1])
                self.write('{"result":"ok"}')

            if keys[0]=='send_message':
                self.log.debug('send_message : \n %s'%self.request.body)
                msg=json.loads(self.request.body)
                send_message(self.log,msg)
                self.write('{"result":"ok"}')

            if keys[0]=='create_vm':
                tmp=json.loads(self.request.body)
                rs=yield _create(tmp)
                self.log.debug(rs)
                self.write(json.dumps(rs))

        except:
            self.log.error(generals.trace())
            self.write('{"result":"error"}')

    @gen.coroutine
    def get(self,chunk):
        try:
            keys=self.get_key_params(self.request.path)

            if keys[0]=='get_stack':
                from manor.screwdriver.vendor_ecloud import get_stack
                rs=yield get_stack(keys[1])
                self.write(json.dumps(rs.to_dict()))

            if keys[0]=='get_stack_resources':
                from manor.streamlet import get_stack_resources
                rs=yield get_stack_resources(keys[1])
                self.write(json.dumps(rs))

            if keys[0]=='get_roles':
                from manor.streamlet import get_roles
                rs=yield get_roles(keys[1])
                self.write(json.dumps(rs))

            if keys[0]=='get_resources_info':
                from manor.streamlet import get_resources_info
                rs=yield get_resources_info(keys[1])
                self.write(json.dumps(rs))

            if keys[0]=='redis':
                r=redis_tool.get_it()
                if keys[1]=='':
                    _keys=r.keys('*_$_*')
                else:
                    _keys=r.keys('%s_$_*'%keys[1])
                rs=[]
                for k in _keys:
                    rs.append({
                        "key":k,
                        'value':r.get(k)
                    })
                self.write(json.dumps(rs))

            if keys[0]=='download_path':
                from manor.streamlet import download_path
                rs=yield download_path(keys[1])
                self.write(json.dumps(rs))

            if keys[0]=='list_instances':
                from manor.services import app_service
                rs=yield app_service.do_list_instance()
                self.write(json.dumps(rs))

            if keys[0]=='list_app':
                from manor.screwdriver.vendor_ecloud import list_app_resources
                rs=yield list_app_resources(keys[1])
                self.write(json.dumps(rs))

            if keys[0]=='clear_redis_msg':
                r=redis_tool.get_it()
                _keys=r.keys('%s_*'%keys[1])
                for k in _keys:
                    r.delete(k)
                self.write(json.dumps({"result":'ok'}))

            if keys[0]=='rename':
                from manor.screwdriver.vendor_ecloud import update_vm_display_name
                yield update_vm_display_name(keys[1],keys[2])
                self.write(json.dumps({"result":'ok'}))

            if keys[0]=='app_count':
                from manor.app_state_counter import get_state_count
                rs=yield get_state_count()
                self.write(json.dumps(rs))


        except:
            self.log.error(generals.trace())
            self.write('error')

    def get_key_params(self,path):
        key=path.replace('/manor/cli/','')
        self.log.debug('manor.cli : request target: %s'%key)
        keys=key.split('/')
        return keys
