import time

from manor.util import redis_tool
from tornado import gen

from manor.screwdriver import compute_util
from manor.streamlet import StreamletBase,get_stack_resources
from manor.util import generals


def get_instance(params,node_id,serial):
    return StartNode(params,serial,node_id)


class StartNode(StreamletBase):
    def __init__(self,params,serial,node_id):
        super(StartNode,self).__init__(node_id,params,serial)
        self.serial=serial
        self.group_name=self.params['group_name']
        self.command_params=[]
        self.stack_ids=[]
        self.ips=[]

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

            self.ips=[_['ip'] for _ in self.command_params]
            for command in self.command_params:
                compute_util.start_server(command['resource_id'])

    def __get_road_map(self):
        r=redis_tool.get_it()
        road_map=r.keys('mapup*')
        return [_.split('_$_')[3] for _ in road_map]

    def check_finish(self):
        try:
            checked=[_ for _ in self.ips if _ in self.__get_road_map()]
            self.log.debug('check finish: %s - %s'%(checked,self.ips))
            if len(self.ips)>0 and self.ips==checked:
                for x in range(10):
                    self.log.debug('finish count down:%s'%x)
                    time.sleep(1)
                self.log.debug('finished ...')
                return True
            return False
        except:
            self.log.error(generals.trace())
            return False
