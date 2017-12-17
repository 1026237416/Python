# coding=utf-8
import os

from tornado.gen import coroutine

from easted.core.rest import RestHandler,get
from manor.util import cfgutils,generals


class StreamHandler(RestHandler):
    @coroutine
    @get(_path='/manor/streamlet/script/default')
    def get_script_default_params(self):
        self.response(generals.gen_response([
            {
                "type":"system_default",
                "name":"HOSTS",
                "display":False,
                "description":("集群中所有节点的信息,由系统发送给所有的脚本,其值为:"
                               "结点的ip|结点的组名称_组中的顺序@"
                               "结尾处的@表示当前机器。"
                               "例如:10.10.1.123|master_1@,10.10.1.124|server_1")
            },
            # {
            #     "type":"system_default",
            #     "name":"ON_GROUP",
            #     "display":True,
            #     "description":("在特定的组上执行。值为有效的组名称。"
            #                    "如果为空则在整个应用上执行。")
            # },
            {
                "type":"system_default",
                "name":"ON_IP",
                "display":False,
                "description":("在特定IP的结点上执行。值为有效的结点IP。"
                               "如果为空则在整个应用上执行。")
            }

        ]))

    @coroutine
    @get(_path='/manor/streamlet/list/{type}')
    def streamlet_list(self,step_type,*resgs):
        app_path=cfgutils.getval('app','streamlet_path')
        files=[f.replace('.yaml','') for f in os.listdir(app_path)]
        if step_type=='deploy':
            del files[files.index('delete_node')]
            del files[files.index('start_node')]
            del files[files.index('stop_node')]
        self.response(generals.gen_response(files))
