import time

from tornado import gen

from manor.screwdriver import compute_util
from manor.streamlet import StreamletBase


def get_instance(params,node_id,serial):
    return DeleteNode(params,serial,node_id)


class DeleteNode(StreamletBase):
    def __init__(self,params,serial,node_id):
        super(DeleteNode,self).__init__(node_id,params,serial)
        self.serial=serial
        self.server_id=self.params['server_id']
        self.command_params=[]
        self.stack_ids=[]

    @gen.coroutine
    def execute(self):
        info=compute_util.get_info(self.server_id).to_dict()
        self.log.debug(info)
        if info['status']!='SHUTOFF':
            compute_util.stop_server(self.server_id)

    def check_finish(self):
        info=compute_util.get_info(self.server_id).to_dict()
        if info['status']=='SHUTOFF':
            compute_util.delete_server(self.server_id)
            for x in range(10):
                self.log.debug('finish count down:%s'%x)
                time.sleep(1)
            self.log.debug('finished ...')
            return True
