# coding=utf-8
import codecs
import json
import logging
import os
import uuid

import yaml
import pyaml

from manor.stream import stream
from manor.stream.stream_checker import check_structure,is_acyclic
from manor.util import cfgutils,generals
from manor.util.db_utils import execute,execute_query
import easted.log as optLog
from easted.log import Operator


def check_template(body):
    if len(body['action'])==0:
        raise Exception('error.manor.template.no.action')
    for a in body['action']:
        check_structure(a)
        is_acyclic(a)


def load_template(app_path,name):
    body={}
    with open(app_path+'/'+name) as streamlet:
        content=streamlet.read()
    if len(content)>0:
        body=yaml.safe_load(content)
        for a in body['action']:
            ec=''
            for k in a['streamlet'].keys():
                if k.split('$')[0]=='execute_script':
                    node_params=a['streamlet'][k]['params']
                    for p in node_params:
                        e_name=get_script_ex_name(p)
                        with open('%s/_%s/%s%s'%(
                            app_path,body['name'],k,e_name))as f:
                            ec=f.read()
                a['streamlet'][k]['params'].append({
                    'execute_script_content':ec
                })
    return body


def create_instance(request,name,action_name,seq):
    log=logging.getLogger('manor')
    try:
        log.debug(request.body)
        instance_path=cfgutils.getval('app','instance_path')
        template_path=cfgutils.getval('app','template_path')

        params=json.loads(request.body)

        app_name=params['app_name']

        if 'type' in params:
            action_type=params['type']
        else:
            action_type='deploy'

        if action_type=='deploy':
            if not os.path.isfile('%s/%s.yaml'%(template_path,name)):
                raise Exception('error.manor.template.not.exist')
            content=load_template(template_path,name.replace(' ','')+'.yaml')
        else:
            with open('%s/%s.yaml'%(
                instance_path,params['app_name'].replace(' ',''))) as f:
                rs=f.read()
            content=yaml.safe_load(rs)

        if action_name not in [_['name'] for _ in content['action']]:
            raise Exception('error.manor.action.not.exist')
        if 'app_description' not in content:
            content['app_description']=''

        if params['app_description']:
            content['app_description']=params['app_description']

        # 合并参数
        merge_params(action_name,content,log,params)

        check_template(content)
        info_token_list=[]
        if action_type=='deploy':
            serial=uuid.uuid1()
            execute(("INSERT INTO manor.manor_app_instance"
                     "(template_name,app_name,app_serial,state,app_description,app_id)"
                     "VALUES(%s,%s,%s,%s,%s,%s)"),
                    (name,app_name,serial,'building',content['app_description'],
                     seq))

            # save origin template.
            log.debug('save app template : %s'%str(serial))
            with codecs.open(
                    '%s/%s.yaml'%(instance_path,str(serial).replace(' ','')),'w+',
                'utf-8') as f:
                f.write(yaml.safe_dump(content))
        else:
            # 执行管理流程
            serial=params['app_name']
            streamlet_key=params['params'].keys()
            for k in streamlet_key:
                s_ps=params['params'][k]['params']
                for s_p in s_ps:
                    if 'info_return' in s_p and s_p['info_return']:
                        token=str(uuid.uuid1())
                        s_ps.append({'info_token':token})
                        info_token_list.append(token)

        # 为了token
        merge_params(action_name,content,log,params)

        logging.getLogger('manor').debug(pyaml.dumps(content))
        stream.execute(content,action_name,str(serial))
        if action_type=='deploy':
            optLog.write(
                request,
                optLog.Type.APP_INSTANCE,
                seq,
                Operator.CREATE,
                '%s'%app_name
            )
        else:
            action_label=[_ for _ in content['action']
                          if _['name']==action_name][0]['label']

            def get_result(rows):
                app_name=rows[0]['app_name']
                optLog.write(
                    request,
                    optLog.Type.APP_INSTANCE,
                    seq,
                    Operator.EXECUTE_ACTION,
                    '%s %s'%(app_name,action_label)
                )

            execute_query(
                "select * from manor.manor_app_instance where app_serial='%s'"%serial,
                get_result)

        return info_token_list,serial
    except Exception as e:
        log.error(generals.trace())
        raise e


def merge_params(action_name,content,log,params):
    try:
        for a in content['action']:
            if a['name']==action_name:
                pk=params['params'].keys()
                for k in pk:
                    p_a_p=params['params'][k]['params']
                    c_a_p=a['streamlet'][k]['params']
                    new_c_a_p=[]
                    for p_a_p_p in p_a_p:
                        if len(p_a_p_p)>0:
                            new_c_a_p.append(p_a_p_p)
                    if len(new_c_a_p)==0:
                        for c_a_p_p in c_a_p:
                            if len(c_a_p_p)>0:
                                new_c_a_p.append(c_a_p_p)
                    else:
                        for c_a_p_p in c_a_p:
                            if set(c_a_p_p.keys()) not in [set(_.keys()) for _ in
                                                           p_a_p]:
                                if len(c_a_p_p)>0:
                                    new_c_a_p.append(c_a_p_p)

                    a['streamlet'][k]['params']=new_c_a_p

        for a in content['action']:
            pk=a['streamlet'].keys()
            for k in pk:
                c_a_p=a['streamlet'][k]['params']
                s=[json.dumps(_) for _ in c_a_p]
                ss=set(s)

                a['streamlet'][k]['params']=[json.loads(_) for _ in list(ss)]

    except Exception as e:
        log.error(e)
        log.error(generals.trace())
        raise e


def get_script_ex_name(p):
    return ''
    # e_name=''
    # if 'script_type' in p:
    #     s_type=p['script_type']
    #     if s_type=='python':
    #         e_name='.py'
    #     if s_type=='shell':
    #         e_name='.sh'
    # return e_name
