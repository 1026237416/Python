# coding=utf-8
import importlib
import json
import logging
import time

from manor.util import cfgutils
from tornado import gen
from tornado.concurrent import run_on_executor

from manor.util import generals,db_utils,redis_tool


@gen.coroutine
def execute(template,action_name,serial):
    logging.getLogger('manor').debug(template)
    stream=Stream(template,action_name,serial)
    yield stream.execute_action()


class C(object):
    SUCCESS_FLAG=cfgutils.getval('stream','stack_success_flag')
    CREATING_FLAG=cfgutils.getval('stream','stack_creating_flag')
    DOWNLOAD_PATH=cfgutils.getval('stream','client_download_path')
    TIME_OUT=cfgutils.getval('stream','streamlet_time_out')


class Stream(object):
    _thread_pool=None

    def __init__(self,template,stream_name,serial):
        """
        :param template:模板,python对象
        :param stream_name: 流程的名称.因为一个模板中有很多流程,但是只有一个安装流程.
                            其他的都是管理流程.
        :param serial: 任务的序列号,此序列号会返回给前台,前台用此序列号来追踪任务.
        """
        # 避免静态引入时导致的配置错误
        self._thread_pool=generals.get_thread_pool()
        self.action_name=stream_name
        self.serial=str(serial)
        # 保存所有的步骤,防止重复执行。
        self._streamlet_instance={}

        logger=logging.getLogger('stream')
        formatter=logging.Formatter('%(asctime)s - %(lineno)d - %(message)s')
        ch=logging.FileHandler(
            '%s/stream_%s.log'%(
                cfgutils.getval('log','path'),
                self.serial)
        )
        logger.setLevel(logging.DEBUG)
        ch.setLevel(logging.DEBUG)
        ch.setFormatter(formatter)
        logger.addHandler(ch)
        self.log=logger

        self.parser=TmpParser(template)
        # 中断线程的执行
        self.interrupt=False
        self.log.debug('execute action: %s'%stream_name)

    def update_status(self,state):
        sql=("update manor.manor_app_instance set state='%s' "
             "where app_serial='%s'")%(state,self.serial)
        db_utils.execute(sql)

    def get_instance(self,params,node_id,serial):
        self.log.debug('step %s instances %s'%(node_id,self._streamlet_instance))
        try:
            if node_id not in self._streamlet_instance:
                module_name='manor.streamlet.'+node_id.split('$')[0]
                self.log.debug('import %s'%module_name)
                module=importlib.import_module(module_name)
                self.log.debug('load module %s'%module)
                self._streamlet_instance[node_id]={
                    "instance":module.get_instance(params,node_id,serial),
                    "status":'init'
                }
        except Exception as e:
            self.log.error(generals.trace())
            raise e

        return self._streamlet_instance[node_id]

    @gen.coroutine
    def execute_action(self):
        # 流程的起点,可能会有多个
        action_tuple=self.parser.get_streams(self.action_name)
        origin=self.parser.get_origin_streamlet(action_tuple)
        action_type=self.parser.get_action_type(action_tuple)
        self.log.debug('action type : %s'%action_type)
        r=redis_tool.get_it()
        try:
            self.log.debug(len(origin))
            for node_id in origin:
                yield self.execute_multi_streamlet(node_id,action_tuple)
            if action_type=='deploy':
                self.update_status('normal')
        except Exception as e:
            self.log.error('stream execute error :\n %s'%generals.trace())
            self.interrupt=True
            if action_type=='deploy':
                self.update_status('failure')
            """
            使用redis来保证一致性。由于监控的线程是并行在多条的进程中的,
            而且它只会把状态报告给本进程。
            所以需要保证所以进程中的监控线程都能够拿到信息……
            """
            r.set("manage_error_$_%s"%self.serial,json.dumps({
                'action':self.action_name,'msg':str(e)
            }))

            raise e

    @gen.coroutine
    def execute_multi_streamlet(self,node_id,action_tuple):
        """
        注意事项:

        *:保证下一步执行的时候,上一步的所有实例已经创建出来.否则,在获取上一步操作的时候会出错

        *:由于步骤的执行是异步的,所以需要保证步骤不会被重复的调用.因为递归算法本质上会遍历所有
          的结点.此外由于我们算法的特殊性,结点一定会被重复的执行,因此必须进行控制.

        *:算法的特点是需要保证前面的步骤执行结束才进入后面的步骤.

        :param node_id: 结点的ID.流程结点.其名称与ID是一致的.
        :param action_tuple: 获取流程数据的一种中间数据结构.
        """
        try:
            self.log.debug('prepare to EXECUTE streamlet : %s'%node_id)
            p_s_list=self.parser.get_previous_streamlet(node_id,action_tuple)

            for p_node_name in p_s_list:
                if p_node_name!='start':
                    self.log.debug('check previous node : %s'%p_node_name)
                    params=self.parser.get_streamlet_params(p_node_name,
                                                            action_tuple)
                    p_s=self.get_instance(params,p_node_name,self.serial)
                    if p_s['status']!='executed':
                        p_s["status"]='executed'
                        yield self.run_streamlet(p_s["instance"])
                    self.log.debug('waiting previous node : %s'%p_node_name)
                    yield self.check_finish_streamlet(p_s['instance'])
                    self.log.debug('previous step %s finished '%p_node_name)

            params=self.parser.get_streamlet_params(node_id,action_tuple)
            self.log.debug('get streamlet instance ..')
            streamlet=self.get_instance(params,node_id,self.serial)
            self.log.debug('streamlet is %s'%streamlet)
            # 防止已经执行过的结点重复执行
            if streamlet["status"]!='executed':
                # 先设置属性再执行,防止出现并发问题.
                streamlet["status"]='executed'
                yield self.run_streamlet(streamlet["instance"])
                # 保证最后一步也要执行完成,才结束流程.
                if self.parser.is_last(node_id,action_tuple):
                    yield self.check_finish_streamlet(streamlet["instance"])
                    # self.update_status('normal')

            next_nodes=self.parser.get_next_streamlet(node_id,action_tuple)
            for next_node in next_nodes:
                self.log.debug('NEXT streamlet (node_id) is %s'%next_node)
                yield self.execute_multi_streamlet(next_node,action_tuple)
        except Exception as e:
            self.log.error(generals.trace())
            raise e

    @run_on_executor(executor='_thread_pool')
    def run_streamlet(self,instance):
        self.log.debug('execute streamlet %s start ...'%instance.node_id)
        future=instance.execute()
        self.log.debug(future)
        while True:
            self.log.debug(future.done())
            if future.done():
                try:
                    future.result()
                    break
                except Exception as e:
                    self.log.error(generals.trace())
                    raise e
            time.sleep(1)

    @run_on_executor(executor='_thread_pool')
    def check_parent(self,node_id):
        while True:
            if self.interrupt:
                break
            if node_id in self._streamlet_instance:
                return True
            time.sleep(1)

    @run_on_executor(executor='_thread_pool')
    def check_finish_streamlet(self,streamlet):
        self.log.debug('check streamlet state .. : %s '%streamlet.node_id)
        try:
            timer=0
            while True:
                timer+=1
                self.log.debug('time out: %s ...'%timer)
                if self.interrupt:
                    break
                if timer>=int(C.TIME_OUT):
                    self.log.error('streamlet running timeout.')
                    raise Exception('manor.error.execute.time.out')
                if streamlet.check_finish():
                    self.log.info('streamlet %s finished!'%streamlet.node_id)
                    break
                time.sleep(1)
        except Exception as e:
            self.log.error(generals.trace())
            raise e


class TmpParser(object):
    def __init__(self,data):
        self.data=data

    def get_streams(self,stream_name):
        index=0
        for a in self.data['action']:
            if a['name']==stream_name:
                return index,a['name'],'implementation'
            index+=1

    def get_action(self,action_tuple):
        return self.data['action'][action_tuple[0]]

    def get_origin_streamlet(self,action_tuple):
        """
        获取起始的streamlet
        :param action_tuple:
        :return: []
        """
        return self.get_next_streamlet('start',action_tuple)

    @staticmethod
    def get_action_edges(action):
        return action['stream_module']['edges']['_data']

    @staticmethod
    def map_to_list(map_in):
        rs=[]
        for key in map_in.keys():
            map_map=map_in[key]
            map_map['key']=key
            rs.append(map_map)
        return rs

    def get_action_type(self,action_tuple):
        action=self.get_action(action_tuple)
        return action['type']

    def get_streamlet_params(self,node_id,action_tuple):
        action=self.get_action(action_tuple)
        return action['streamlet'][node_id]['params']

    def get_next_streamlet(self,node_id,action_tuple):
        action=self.get_action(action_tuple)
        edges=self.map_to_list(self.get_action_edges(action))
        return [_['to'] for _ in edges if _['from']==node_id]

    def get_previous_streamlet(self,node_id,action_tuple):
        action=self.get_action(action_tuple)
        edges=self.map_to_list(self.get_action_edges(action))
        return [_['from'] for _ in edges if _['to']==node_id]

    def is_last(self,node_id,action_tuple):
        action=self.get_action(action_tuple)
        edges=self.map_to_list(self.get_action_edges(action))
        return node_id not in [_['from'] for _ in edges] and node_id!='start'
