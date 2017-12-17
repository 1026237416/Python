# coding=utf-8
import yaml
from tornado import gen

from manor.screwdriver import stack_util
from manor.screwdriver.vendor_ecloud import list_app_resources
from manor.streamlet import StreamletBase,get_stack_resources
from manor.streamlet import download_path
from manor.util import generals
from manor.util import redis_tool

SUCCESS_FLAG='CREATE_COMPLETE'
CREATING_FLAG='CREATE_IN_PROGRESS'


def get_instance(params,node_id,serial):
    return CreateNodes(params,serial,node_id)


class CreateNodes(StreamletBase):
    def __init__(self,params,serial,node_id):
        super(CreateNodes,self).__init__(node_id,params,serial)
        self.result=None
        self.created_resources=[]
        self.stack_status=''
        self.ips=[]

    @gen.coroutine
    def execute(self):
        if not self.executed:
            self.executed=True
            # todo: check input parameters...
            self.log.debug('params:')
            self.log.debug(self.params)

            data_module={
                'name':'create node',
                'resources':{},
                'group_name':self.get_resource('group_name')
            }

            self.log.debug('calculate data module ..')

            try:
                if self.get_resource('group_name')=='':
                    raise Exception('group name is empty.')

                if self.get_resource('max')!='':
                    _max=int(self.get_resource('max'))
                    group_name=self.get_resource('group_name')
                    rs=yield list_app_resources(self.serial)
                    rs=[_ for _ in rs if _['group_name']==group_name]
                    if len(rs)>=_max:
                        raise Exception('manor.create.node.upper.limited')

                os_name=yield download_path(self.get_resource('image'))

                data_module['resources'][self.get_resource('group_name')]={
                    "count":self.get_resource('amount'),
                    "group_name":self.get_resource('group_name'),
                    "image":self.get_resource('image'),
                    'flavor':self.get_resource('flavors'),
                    "memory":self.get_resource('memory'),
                    "cores":self.get_resource('cores'),
                    'tenant':self.get_resource('tenant'),
                    'size':self.get_resource('disk_capacity'),
                    "os":os_name,
                    "network":[
                        {
                            "network":self.get_resource('network'),
                            "subnet":self.get_resource('subnet')
                        }
                    ]
                }

                self.log.debug(data_module)

                self.stack_id=yield stack_util.create_action(data_module,
                                                             self.serial)

            except Exception as e:
                self.log.error(generals.trace())
                raise e

    @gen.coroutine
    def calculate_created_resources(self):
        resources=yield get_stack_resources(self.stack_id)
        self.log.debug('calculate created:\n %s'%yaml.safe_dump(resources))
        self.created_resources=resources

    @gen.coroutine
    def get_stack_status(self):
        future=yield stack_util.get_stack(self.stack_id)
        self.stack_status=future.to_dict()['stack_status']

    def get_resource(self,key):
        if key in self.params:
            return self.params[key]
        else:
            return ''

    def __ips_not_in_road_map(self,ips):
        return [_ for _ in ips if _ not in self.__get_road_map()]

    def __get_road_map(self):
        r=redis_tool.get_it()
        road_map=r.keys('mapup*')
        return [_.split('_$_')[3] for _ in road_map]

    def check_finish(self):
        """
        注意，此方法运行在一个线程中，每秒会执行一次。
        """
        try:
            self.log.debug('create_nodes step. check finish. stack_id %s'%
                           self.stack_id)
            if self.stack_id is None:
                return False

            if self.stack_status!=CREATING_FLAG:
                if self.stack_status==SUCCESS_FLAG:
                    if len(self.created_resources)==0:
                        self.calculate_created_resources()
                    if len(self.ips)==0:
                        self.ips=[_['ip'] for _ in self.created_resources]
                    checked=[_ for _ in self.ips if _ in self.__get_road_map()]
                    self.log.debug('%s - %s'%(self.ips,checked))
                    if len(self.ips)>0 and self.ips==checked:
                        return True
                    else:
                        return False
                else:
                    self.get_stack_status()
            else:
                self.log.debug('the stack stack_status is %s'%self.stack_status)
                self.get_stack_status()
                return False
        except:
            self.log.error(generals.trace())
            raise Exception('error.manor.stream.check.create.node.finish')
