# coding=utf-8
import codecs
import json
import logging
import os
import shutil
import uuid

import yaml
from tornado.gen import coroutine

import easted.log as optLog
from easted.log import Operator
from easted.core import sequence
from easted.core.rest import RestHandler,get,post,put,delete
from manor.util import cfgutils,generals
from manor.util.template import check_template,load_template,create_instance, \
    get_script_ex_name
from manor.util.db_utils import DBUtil


class TemplateHandler(RestHandler):
    def __init__(self,application,request,**kwargs):
        super(TemplateHandler,self).__init__(application,request,**kwargs)
        self.log=logging.getLogger('manor')

    @coroutine
    def initialize(self):
        sequence.register('TM')
        sequence.register('SA')
        sequence.register('CL')

    @coroutine
    @get(_path='/manor/templates')
    def list_app_template_detail(self):
        rs=[]
        try:
            app_path=cfgutils.getval('app','template_path')
            self.log.debug('get templates path: %s'%app_path)
            for name in os.listdir(app_path):
                if not os.path.isdir(app_path+'/'+name) and name!='.yaml':
                    rs.append(load_template(app_path,name))
            self.log.debug('get templates: %s'%json.dumps(rs))
            rs=generals.gen_response(rs)
        except:
            self.log.error(generals.trace())
        self.response(rs)

    @coroutine
    @put(_path='/manor/template')
    def put_template(self,body):
        yield self.save_template('create')

    @coroutine
    @post(_path='/manor/template')
    def update_template(self,body):
        yield self.save_template('update')

    @coroutine
    def save_template(self,action):
        app_path=cfgutils.getval('app','template_path')
        body=json.loads(self.request.body)
        try:
            check_template(body)
            # 为流程生成ID
            for a in body['action']:
                if 'name' not in a or a['name']=='':
                    seq=yield sequence.number_seq('SA','')
                    a['name']='SA-%s'%seq
                    logging.getLogger('manor').debug(
                        'generate action name: %s'%a['name'])
                else:
                    logging.getLogger('manor').debug('action name: %s'%a['name'])

            if action=='create':
                operation_log_type=Operator.CREATE
                seq=yield sequence.number_seq('TM','')
                body['name']='TM-%s'%seq
                body['status']=0
            else:
                operation_log_type=Operator.UPDATE
                if 'name' not in body:
                    raise Exception('error.manor.template.no.name')
                if body['name']=='':
                    raise Exception('error.manor.template.name.is.empty')
                if not os.path.isfile('%s/%s.yaml'%(app_path,body['name'])):
                    raise Exception('error.manor.template.update.not.exist')
                for a in body['action']:
                    if 'deploy'==a['type']:
                        a['label']='install_stream'
                    if 'label' not in a:
                        raise Exception('error.manor.template.action.no.label')
                    if a['label']=='':
                        raise Exception(
                            'error.manor.template.action.label.is.empty')

            script_path='%s/_%s'%(app_path,body['name'])
            if not os.path.isdir(script_path):
                os.mkdir(script_path)

            for a in body['action']:
                for k in a['streamlet'].keys():
                    if k.split('$')[0]=='execute_script':
                        node_params=a['streamlet'][k]['params']
                        for p in node_params:
                            if 'execute_script_content' in p:
                                content=p['execute_script_content']
                                self.log.debug('get script content:\n%s'%content)
                                e_name=get_script_ex_name(p)
                                with codecs.open('%s/%s%s'%(script_path,k,e_name),
                                                 'w+',
                                                 'utf-8') as f:
                                    f.write(content)
                                del p['execute_script_content']

            tmp_f=str(uuid.uuid1())
            with codecs.open('%s/%s'%(app_path,tmp_f),"w+",'utf-8') as text_file:
                text_file.write(yaml.safe_dump(body))
            os.rename('%s/%s'%(app_path,tmp_f),
                      '%s/%s.yaml'%(app_path,body['name']))

            optLog.write(
                self.request,
                optLog.Type.APP_TEMPLATE,
                body['name'],
                operation_log_type,
                '%s'%body['label']
            )

            self.response(generals.gen_response("ok"))
        except Exception as e:
            logging.getLogger('manor').error(generals.trace())
            raise e

    @coroutine
    @delete(_path='/manor/template/{name}')
    def delete_template(self,name):
        template_path=cfgutils.getval('app','template_path')
        with open('%s/%s.yaml'%(template_path,name)) as f:
            tmp=f.read()
        t_content=yaml.safe_load(tmp)
        template='%s/%s.yaml'%(template_path,name)
        shutil.rmtree('%s/_%s'%(template_path,name))
        os.remove(template)
        optLog.write(
            self.request,
            optLog.Type.APP_TEMPLATE,
            name,
            Operator.DELETE,
            '%s'%t_content['label']
        )
        self.response(generals.gen_response('ok'))

    @coroutine
    @post(_path="/manor/templates/status/{name}")
    def change_status(self,name,body):
        t_path=cfgutils.getval('app','template_path')
        with open('%s/%s.yaml'%(t_path,name)) as f:
            tmp=f.read()
        t_content=yaml.safe_load(tmp)
        value=json.loads(self.request.body)['value']
        t_content['status']=value

        tmp_f=str(uuid.uuid1())
        with codecs.open('%s/%s'%(t_path,tmp_f),'w','utf-8') as f:
            f.write(yaml.safe_dump(t_content))
        os.rename('%s/%s'%(t_path,tmp_f),'%s/%s.yaml'%(t_path,name))
        optLog.write(
            self.request,
            optLog.Type.APP_TEMPLATE,
            name,
            Operator.ONLINE if value==1 else Operator.OFFLINE,
            '%s'%t_content['label']
        )
        self.response(generals.gen_response('ok'))

    @coroutine
    @post(_path='/manor/templates/execute/{name}/{action_name}')
    def execute_template(self,name,action_name,body):
        params=json.loads(self.request.body)

        app_name=params['app_name']

        if 'type' not in params or params['type']=='deploy':
            seq=yield sequence.number_seq('CL','')
            seq='CL-%s'%seq
        else:
            rs=yield DBUtil().query(
                ("select * from manor.manor_app_instance "
                 "where app_serial='%s'")%app_name)
            seq=rs[0]['app_id']

        info_serial,serial=create_instance(self.request,name,action_name,seq)

        self.response(generals.gen_response({
            'serial':str(serial),
            'info':info_serial
        }))
