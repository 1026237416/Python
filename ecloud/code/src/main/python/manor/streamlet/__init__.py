# coding=utf-8
import logging
import os
import pyaml

from tornado import gen

from manor.screwdriver import compute_util,stack_util
from manor.util.db_utils import DBUtil
from manor.util import cfgutils,db_utils


class StreamletBase(object):
    def __init__(self,node_id,params,serial):
        self.stack_id=None
        self.node_id=node_id
        self.serial=serial
        logger=logging.getLogger('streamlet_'+serial+'_'+node_id)
        path='%s/%s'%(cfgutils.getval('log','path'),serial)
        if not os.path.exists(path):
            os.mkdir(path)
        formatter=logging.Formatter(
            '%(asctime)s - %(filename)s(line:%(lineno)d)'
            ' - [%(levelname)s] - %(message)s'
        )
        ch=logging.FileHandler(
            ('%s/%s/%s.log'%(cfgutils.getval('log','path'),serial,node_id))
        )
        logger.setLevel(logging.DEBUG)
        ch.setLevel(logging.DEBUG)
        ch.setFormatter(formatter)
        logger.addHandler(ch)
        logger.info('app serial: %s'%self.serial)
        logger.info('origin params:\n %s'%pyaml.dumps(params))
        self.log=logger
        self.params=self.merge_params(params)
        # 所有的步骤,都不应该被执行两次
        self.executed=False

    def get_result(self):
        """
        废弃

        流程不再负责结果参数的传递.
        结果由下一步的streamlet自己通过相应的API从缓存中(redis)中获取.

        与流程相关的资源通过查询数据库获取.
        :return:
        """
        pass

    def check_finish(self):
        raise NotImplementedError()

    def execute(self):
        raise NotImplementedError()

    def merge_params(self,params):
        p={}
        priority=[]
        for pp in params:
            for (k,v) in pp.items():
                if k=='script_params':
                    self.log.debug((k,v))
                    if len(pp['script_params'])>0 and 'value' in \
                        pp['script_params'][0]:
                        priority.append((k,v))

                p[k]=v

        for pri in priority:
            p[pri[0]]=pri[1]

        return p

    def update_status(self,state):
        sql=("update manor.manor_app_instance set state='%s' "
             "where app_serial='%s'")%(state,self.serial)
        db_utils.execute(sql)

    @gen.coroutine
    def get_stack_id_list(self):
        sql=("select stack_id from manor.manor_stacks where app_serial='%s'"
             %self.serial)
        rs=yield DBUtil().query(sql)
        raise gen.Return(rs)


@gen.coroutine
def get_stack_resources(stack_id):
    """
    此方法直接从heat保存的stack信息中获得实例中的参数,包括所有节点的IP地址,
    以及这些IP地址所对应的组名称.
    * 因此最终用户如果需要修改节点的IP地址需要小心,可能会对管理端造成损害.
    * 目前多线流程每个节点只支持一个组名,所以所有的组名都应该是一样的.
    :param stack_id: heat stack id.
    :return: 包含IP信息和组名的LIST.
    """
    stack_list=yield stack_util.list_stack_resources(stack_id)

    raise gen.Return(
        [
            {
                "ip":compute_util.get_info(
                    get_resource_id(_)).to_dict()[
                    'addresses'].values()[0][0]['addr'],
                "resource_id":get_resource_id(_),
                "character":
                    _.to_dict()['logical_resource_id'].split('_')[0]
            } for _ in stack_list]
    )


@gen.coroutine
def get_roles(stack_id):
    stack_list=yield stack_util.list_stack_resources(stack_id)
    raise gen.Return(
        [compute_util.get_info(get_resource_id(_)).to_dict()[
             'addresses'].values()[0][0]['addr']+'|'+_.to_dict()[
             'logical_resource_id'] for _ in stack_list]
    )


@gen.coroutine
def get_resources_info(stack_id):
    stack_list=yield stack_util.list_stack_resources(stack_id)
    raise gen.Return([compute_util.get_info(get_resource_id(_)).to_dict() for _ in
                      stack_list])


@gen.coroutine
def download_path(name):
    name=yield compute_util.get_image_os(name)
    logging.getLogger('manor').debug('image os name:%s'%name)
    if 'ubuntu' in name:
        raise gen.Return('ubuntu')
    if 'centos' in name:
        raise gen.Return('centos')


def get_resource_id(resource):
    return resource.to_dict()['physical_resource_id']
