#!/usr/bin/env python
import argparse
import codecs
import json
import os
import sys
import traceback

import pyaml
import yaml


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
                        e_name=''
                        with open('%s/_%s/%s%s'%(
                            app_path,body['name'],k,e_name))as f:
                            ec=f.read()
                a['streamlet'][k]['params'].append({
                    'execute_script_content':ec
                })
    return body


def trace():
    exc_type,exc_value,exc_traceback=sys.exc_info()
    error_str=""
    for e in traceback.format_exception(exc_type,exc_value,exc_traceback):
        error_str+=e
    return error_str


pars=argparse.ArgumentParser()
pars.add_argument('-serial',
                  required=True,
                  help='app serial ...'
                  )
pars.add_argument('-tmp_name',
                  required=True,
                  help='template name'
                  )
pars.add_argument('-action_name',required=True)

args=pars.parse_args()

try:
    os.chdir(sys.path[0])
    sys.path.append('../common')
    from manor.util import generals

    from manor.util import cfgutils

    cfgutils.init('../etc/manor.conf')

    instance_path=cfgutils.getval('app','instance_path')
    template_path=cfgutils.getval('app','template_path')

    serial=args.serial
    template=args.tmp_name
    action_name=args.action_name

    content=load_template(template_path,template+'.yaml')

    with open('%s/%s'%(instance_path,serial+'.yaml'))as f:
        i_c=f.read()
    i_c=yaml.safe_load(i_c)

    pp={}

    for a in content['action']:
        if a['name']==action_name:
            ex_keys=[_ for _ in a['streamlet'] if _.find('execute_script')!=-1]
            for k in ex_keys:
                for p in a['streamlet'][k]['params']:
                    if 'execute_script_content' in json.dumps(p.keys()):
                        print p['execute_script_content']
                        pp=p

    for a in i_c['action']:
        if a['name']==action_name:
            ex_keys=[_ for _ in a['streamlet'] if _.find('execute_script')!=-1]
            for k in ex_keys:
                for p in a['streamlet'][k]['params']:
                    if 'execute_script_content' in json.dumps(p.keys()):
                        p['execute_script_content']=pp['execute_script_content']

    print pyaml.dumps(pp)

    print '----------------------------------------'

    for a in i_c['action']:
        if a['name']==action_name:
            ex_keys=[_ for _ in a['streamlet'] if _.find('execute_script')!=-1]
            for k in ex_keys:
                for p in a['streamlet'][k]['params']:
                    if 'execute_script_content' in json.dumps(p.keys()):
                        print p['execute_script_content']

    with codecs.open('%s/%s.yaml'%(instance_path,str(serial)),'w+',
                     'utf-8') as f:
        f.write(yaml.safe_dump(i_c))



except:
    print trace()

print 'DONE..'
