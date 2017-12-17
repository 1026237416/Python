# coding=utf-8
import json
import logging
import sys
from types import IntType

from tornado import gen

from easted import compute
from easted.compute import server,common
from easted.image import image
from manor.util import generals
from manor.util.db_utils import DBUtil,execute

_template={
    "network":[{"vlan":"uuid"}],
    "memory":2048,
    "cores":4,
    "image":"uuid",
    "tenant":"uuid",
    "userdata":"userdata",
    "size":8,
    "num":5,
    "metadata":{
        "sys_volume":{
            "type":""
        },
        "order":"test-001",
        "extend":{
            "des":"",
            "displayname":"sys",
            "keepalive":1
        }
    }
}

path=sys.path[0]


@gen.coroutine
def update_vm_display_name(vm_id,display_name):
    logging.getLogger('manor').debug(vm_id)
    metadata_extend=_template['metadata']['extend']
    metadata_extend['displayname']=display_name
    yield common.update_server_meta(vm_id,'extend',metadata_extend)


@gen.coroutine
def create_stack(tmp,serial,group_name):
    try:
        logging.getLogger('manor').debug(tmp)
        script_path=path.replace(r'/python',r'/etc/script/centos.py')
        logging.getLogger('manor').debug(script_path)
        with open(script_path)as f:
            userdata=f.read()
        userdata=userdata.replace('_#url','ecloud-client-%s.tar.gz'%tmp['os'])
        request_body=_template.copy()
        request_body['network'] = [
            {
                "vlan": _['network'], 'subnet': _['subnet'],
                'mac': ''
            } for _ in tmp['network']]
        request_body['image']=tmp['image']
        request_body['tenant']=tmp['tenant']
        request_body['cores']=tmp['cores'] if type(
            tmp['cores'])==IntType else int(tmp['cores'])
        request_body['memory']=tmp['memory'] if type(
            tmp['memory'])==IntType else int(tmp['memory'])
        request_body['memory']*=1024
        request_body['num']=tmp['count'] if type(tmp['count'])==IntType else int(
            tmp['count'])
        request_body['size']=tmp['size'] if type(tmp['size'])==IntType else int(
            tmp['size'])
        request_body['userdata']=userdata
        app_name=yield DBUtil().query(
            "select app_name from manor.manor_app_instance where app_serial='%s'"%serial)
        app_name=app_name[0]['app_name']
        request_body['metadata']['extend']['displayname']=app_name
        stack_id=yield _create(request_body,serial,group_name)
    except Exception as e:
        logging.getLogger('manor').error(generals.trace())
        raise e
    raise gen.Return(stack_id)


@gen.coroutine
def _create(body,serial,group_name):
    logging.getLogger('manor').debug("create vm \n%s"%json.dumps(body,indent=4))
    try:
        body['metadata']=compute.Metadata(**body['metadata'])
        rs=yield server.create_server(compute.Server(**body))
        logging.getLogger('manor').debug('response : \n%s'%rs)

        seqs=yield DBUtil().query("SELECT * FROM manor.manor_app_group_seq WHERE "
                                  "app_serial='%s' AND group_name='%s'"%(
                                      serial,group_name))
        if len(seqs)==0:
            seq=0
        else:
            seq=max([int(_['seq']) for _ in seqs])
        for ip in rs['name_ips']:
            seq+=1
            execute(("INSERT INTO manor.manor_app_group_seq "
                     "(app_serial, group_name, seq, ip) "
                     "VALUES ('%s','%s',%s,'%s')")%(
                        serial,group_name,seq,ip['ips'][0]))

    except Exception as e:
        logging.getLogger('manor').error(generals.trace())
        raise e
    raise gen.Return(rs['name'])


class Rs:
    def __init__(self,rs):
        self.rs=rs

    def to_dict(self):
        return self.rs


@gen.coroutine
def list_app_resources(serial):
    log=logging.getLogger('manor')
    result=[]
    sql="SELECT * FROM manor.manor_stacks where app_serial='%s'"%serial
    rows=yield DBUtil().query(sql)
    for r in rows:
        rs=yield server.list_server(batch=r['stack_id'])
        log.debug(rs)
        result=result+[
            {
                'group_name':r['group_name'],
                'vm_id':_['id'],
                'name':_['name'],
                'display_name':_['displayname'],
                'network_name':_['network'].keys()[0],
                'ip':_['network'][_['network'].keys()[0]][0],
                'app_serial':serial,
                'tenant':_['tenant']['id'],
                'des':_['des']
            } for _ in rs]

        for rss in rs:
            if type(rss['user'])==type({}) and len(rss['user'].keys())>0:
                vm_id=rss['id']
                for r in result:
                    if r['vm_id']==vm_id:
                        r['user_id']=rss['user']['id']

    raise gen.Return(result)


@gen.coroutine
def list_stack_resources(stack_id):
    log=logging.getLogger('manor')
    rs={'rows':[]}

    rs['rows']=yield DBUtil().query(
        ("select group_name from manor.manor_stacks "
         "WHERE  stack_id= '%s'"%stack_id))
    if len(rs['rows'])>0:
        group_name=rs['rows'][0]['group_name']
    else:
        group_name=None

    log.debug('stack_id:%s'%stack_id)
    rs=yield server.list_server(batch=stack_id)
    rs=[_ for _ in rs if stack_id in _['name']]
    result=[]
    log.debug(rs)
    app_serial=yield DBUtil().query(
        "select * from manor.manor_stacks where stack_id='%s'"%stack_id)
    app_serial=app_serial[0]['app_serial']
    log.debug(app_serial)

    for r in rs:
        if len(r['network_info'])>0:
            #虚拟机的网络信息无法获得。
            seq=yield DBUtil().query(
                ("SELECT * FROM manor.manor_app_group_seq WHERE"
                 " group_name='%s' "
                 "AND app_serial='%s' "
                 "AND ip='%s'")%(group_name,app_serial,r['network_info'][0]['ip']))
            seq=seq[0]['seq']
            result.append(
                {
                    'logical_resource_id': '%s_%s' % (group_name, seq),
                    'physical_resource_id': r['id']
                })
        else:
            result.append(
                {
                    'logical_resource_id': '%s_%s' % (group_name, 'unknown'),
                    'physical_resource_id': r['id']
                })

    raise gen.Return([Rs(_) for _ in result])


@gen.coroutine
def get_stack(stack_id):
    rs_obj={
        'stack_status':'CREATE_IN_PROGRESS'
    }
    try:
        rs=yield server.list_server(batch=stack_id)
        rs=[_ for _ in rs if stack_id in _['name']]

        if len(rs)>0 and len(rs)==len([_ for _ in rs if _['state']=='active']):
            rs_obj['stack_status']='CREATE_COMPLETE'

        if len(rs)>0 and len(rs)==len([_ for _ in rs if _['state']=='stopped']):
            rs_obj['stack_status']='CREATE_COMPLETE'
    except:
        print generals.trace()
        logging.getLogger('manor').error(generals.trace())

    raise gen.Return(Rs(rs_obj))


def get_info(resource_id):
    import vendor_nova
    return vendor_nova.get_info(resource_id)


def start_server(resource_id):
    import vendor_nova
    try:
        vendor_nova.start_server(resource_id)
    except BaseException as e:
        logging.getLogger('manor').debug('start %s error : %s',resource_id,e)


def stop_server(resource_id):
    import vendor_nova
    try:
        vendor_nova.stop_server(resource_id)
    except BaseException as e:
            logging.getLogger('manor').debug('stop %s error : %s',resource_id,e)


@gen.coroutine
def get_image_os(image_id):
    rs=yield image.get_image(image_id)
    raise gen.Return(rs['os'])


def delete_server(resource_id):
    server.del_server(resource_id)


def delete_stack(stack_id):
    server.del_server_batch(stack_id)


def force_delete(resource_id):
    raise NotImplemented('not provide')


def list():
    raise NotImplemented('not provide')


def get_images():
    raise NotImplemented('not provide')


def get_flavors():
    raise NotImplemented('not provide')


def get_nets():
    raise NotImplemented('not provide')


def get_networks():
    raise NotImplemented('not provide')
