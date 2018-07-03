# coding=utf-8
import copy
import logging

import yaml
from heatclient.client import Client
from keystoneclient import session
from keystoneclient.auth.identity import v2

from manor.util import cfgutils

heat_base={
    'heat_template_version':'2015-04-30',
    'description':''
}

heat_resource={
    'type':'OS::Nova::Server',
    'properties':{
        'image':'image',
        'flavor':'flavor',
    }
}


def log_manor():
    return logging.getLogger('manor')


def create_client():
    auth=v2.Password(
        auth_url=cfgutils.getval('heat','auth_url'),
        username=cfgutils.getval('heat','username'),
        password=cfgutils.getval('heat','password'),
        tenant_name=cfgutils.getval('heat','tenant_name')
    )

    sess=session.Session(auth=auth)

    return Client(
        '1',
        endpoint=cfgutils.getval('heat','end_point')+'/'+sess.get_project_id(),
        token=sess.get_token()
    )


def get_client():
    return create_client()


def append_user_data(os):
    """
    为heat template中增加userdata部分数据.
    userdata中的脚本将会在虚拟机启动的时候运行.

    对cowbell的认证也有一部分工作可能需要在这里做.

    :return: 返回userdata部分的数据
    """

    # todo get init cowbell script ...
    userdata=open('../script/'+os+'.py').read()
    return {
        'str_replace':{
            'templates':userdata,
            'params':{'_#url':'ecloud-client-'+os+'.tar.gz'}
        }
    }


def generate_heat_template(app_tmp_instance):
    base=heat_base.copy()
    resource=heat_resource.copy()

    log_manor().debug('init flavor ...')
    # resource['properties']['flavor'] = create_flavor(app_tmp_instance)
    base['resources']={}
    res_t=app_tmp_instance['resources']

    for r in res_t.keys():
        for c in range(1,int(res_t[r]['count'])+1):
            rr=copy.deepcopy(resource)
            rr['properties']['image']=res_t[r]['image']
            rr['properties']['networks']=res_t[r]['networks']
            rr['properties']['flavor']=res_t[r]['flavor']
            userdata=append_user_data(res_t[r]['os'])
            if userdata:
                rr['properties']['user_data']=userdata
            base['resources'][r+'_'+str(c)]=copy.deepcopy(rr)

    template=yaml.safe_dump(base)

    log_manor().debug(template)

    return template


def list_stacks():
    client=get_client()
    return client.stacks.list()


def delete_stack(stack_id):
    client=get_client()
    return client.stacks.delete(stack_id)


def get_stack(stack_id):
    client=get_client()
    return client.stacks.get(stack_id)


def list_stack_resources(stack_id):
    client=get_client()
    return client.resources.list(stack_id)


def roll_back(recode_id):
    """
    创建失败后,根据记录回滚:
    回收创建的资源.

    :param recode_id:
    :return:
    """
    # todo rollback resources ...
    pass


def get_stack_template(stack_id):
    """
    获取APP实例的heat模板

    :param stack_id:
    :return:
    """
    client=get_client()
    return client.stacks.template(stack_id)
