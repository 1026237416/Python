# coding=utf-8
import json
import logging
import os
import shutil

import yaml
from tornado.gen import coroutine,Return

import easted.log as optLog
from easted.core.rest import RestHandler
from easted.core.rest import get,delete,post
from easted.log import Operator
from manor.screwdriver import stack_util
from manor.screwdriver.vendor_ecloud import list_app_resources
from manor.screwdriver.vendor_ecloud import update_vm_display_name
from manor.util import cfgutils,generals
from manor.util.db_utils import DBUtil,execute,execute_query


class AppHandler(RestHandler):
    @coroutine
    @delete(_path='/manor/app/{app_serial}')
    def delete_app(self,app_serial):
        serial=app_serial

        def get_result(rows):
            app_name=rows[0]['app_name']
            app_id=rows[0]['app_id']
            optLog.write(
                self.request,
                optLog.Type.APP_INSTANCE,
                app_id,
                Operator.DELETE,
                '%s'%app_name
            )

        execute_query(
            "select * from manor.manor_app_instance where app_serial='%s'"%serial,
            get_result)

        do_delete_app(serial)

        self.response(generals.gen_response({'result':'ok'}))

    @coroutine
    @post(_path='/manor/app/{app_serial}')
    def update_app(self,app_serial,body):
        try:
            app_name=body['name']
            description=body['description']
            sql=("UPDATE manor.manor_app_instance "
                 "SET app_name='%s',app_description='%s' "
                 "WHERE app_serial='%s'")%(app_name,description,app_serial)
            execute(sql)
            vms=yield list_app_resources(app_serial)
            for vm in vms:
                yield update_vm_display_name(vm['vm_id'],app_name)

            rs=yield DBUtil().query(
                ("select * from manor.manor_app_instance "
                 "where app_serial='%s'")%app_serial)
            seq=rs[0]['app_id']

            optLog.write(
                self.request,
                optLog.Type.APP_INSTANCE,
                seq,
                Operator.UPDATE,
                '%s'%app_name
            )

            self.response(generals.gen_response({'result':'ok'}))

        except Exception as detail:
            logging.getLogger('manor').error(generals.trace())
            raise detail

    @coroutine
    @get(_path='/manor/app/resources/{serial}')
    def get_app_resources(self,serial,*args):
        rs=yield list_app_resources(serial)
        self.response(generals.gen_response(rs))

    @coroutine
    @get(_path='/manor/app/templates/{serial}')
    def get_app_template(self,serial,*args):
        instance_path=cfgutils.getval('app','instance_path')
        with open('%s/%s.yaml'%(instance_path,serial.replace(' ',''))) as f:
            rs=f.read()

        content=yaml.safe_load(rs)

        for a in content['action']:
            pk=a['streamlet'].keys()
            for k in pk:
                c_a_p=a['streamlet'][k]['params']
                s=[json.dumps(_) for _ in c_a_p]
                ss=set(s)

                a['streamlet'][k]['params']=[json.loads(_) for _ in list(ss)]

        self.response(generals.gen_response(content))

    @coroutine
    @get(_path='/manor/instances')
    def list_instance(self):
        rs=yield do_list_instance()
        self.response(generals.gen_response(rs))


@coroutine
def do_list_instance():
    sql="SELECT * FROM manor.manor_app_instance"
    rs=yield DBUtil().query(sql)
    raise Return(rs)


def do_delete_app(serial):
    log=logging.getLogger('manor')

    def do_delete(rows):
        for r in rows:
            log.debug('delete stack %s'%r['stack_id'])
            stack_util.delete_stack(r['stack_id'])

    execute_query(
        "SELECT * FROM manor.manor_stacks where app_serial='%s'"%serial,
        do_delete)
    execute("DELETE FROM manor.manor_app_instance WHERE app_serial=%s",serial)
    execute("DELETE FROM manor.manor_stacks WHERE app_serial=%s",serial)
    execute("DELETE FROM manor.manor_app_group_seq WHERE app_serial=%s",serial)

    log_file='%s/stream_%s.log'%(cfgutils.getval('log','path'),serial)
    if os.path.isfile(log_file):
        os.remove(log_file)
    if os.path.exists('%s/%s'%(cfgutils.getval('log','path'),serial)):
        shutil.rmtree('%s/%s'%(cfgutils.getval('log','path'),serial))

    path=cfgutils.getval('app','instance_path')
    if os.path.isfile('%s/%s.yaml'%(path,serial)):
        os.remove('%s/%s.yaml'%(path,serial))
