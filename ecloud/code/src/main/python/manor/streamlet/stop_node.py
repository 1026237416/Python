import time
from tornado import gen

from manor.screwdriver import compute_util
from manor.streamlet import StreamletBase,get_stack_resources,get_resources_info


def get_instance(params,node_id,serial):
    return StopNode(params,serial,node_id)


class StopNode(StreamletBase):
    def __init__(self,params,serial,node_id):
        super(StopNode,self).__init__(node_id,params,serial)
        self.serial=serial
        self.group_name=self.params['group_name']
        self.command_params=[]
        self.stack_ids=[]
        self.stack_resources=[]
        self.resource_id_list=[]

    @gen.coroutine
    def execute(self):
        if not self.executed:
            self.executed=True
            rs=yield self.get_stack_id_list()
            self.stack_ids=[_['stack_id'] for _ in rs]
            for stack_id in self.stack_ids:
                temp=yield get_stack_resources(stack_id)
                self.command_params=self.command_params+temp

            if self.group_name!='':
                self.command_params=[_ for _ in self.command_params if
                                     _['character']==self.group_name]
            self.resource_id_list=[_['resource_id'] for _ in self.command_params]

            for command in self.command_params:
                compute_util.stop_server(command['resource_id'])

    @gen.coroutine
    def get_resources_info(self,stack_id):
        info=yield get_resources_info(stack_id)
        info=[_ for _ in info if _['id'] in self.resource_id_list]
        self.log.debug(info)
        raise gen.Return(info)

    def check_finish(self):
        self.log.debug(self.resource_id_list)
        t=[]
        for stack_id in self.stack_ids:
            future=self.get_resources_info(stack_id)
            while not future.done():
                time.sleep(0.1)
            rs=future.result()
            self.log.debug(rs)
            if len(rs)>0:
                t=t+[_['status'] for _ in rs]
        self.log.debug('check finish: %s'%str(t))
        if len(self.command_params)>0 and len(self.command_params)==len(
            [_ for _ in t if _=='SHUTOFF']):
            for x in range(10):
                self.log.debug('finish count down:%s'%x)
                time.sleep(1)
            self.log.debug('finished ...')
            return True
