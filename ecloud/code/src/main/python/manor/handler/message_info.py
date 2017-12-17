# coding=utf-8
import datetime
import json
import logging
import time
import uuid
import pyaml
import thread

from tornado.websocket import WebSocketHandler

from manor.util import redis_tool,generals


class MessageInfoHandler(WebSocketHandler):
    """
    响应前端获取脚本消息的websocket接口。
    """

    def __init__(self,application,request,**kwargs):
        super(MessageInfoHandler,self).__init__(application,request,**kwargs)
        self.log=logging.getLogger('manor')
        self.id=str(uuid.uuid1())

    def data_received(self,chunk):
        pass

    def open(self):
        self.log.debug('get connection %s:'%self.id)

    def info_watcher(self,msg):
        while True:
            self.log.debug(msg)
            r=redis_tool.get_it()
            _keys=r.keys('script_info_$_%s_$_*'%msg['message_token'])
            for k in _keys:
                token=k.split('_$_')[1]
                date=k.split('_$_')[2]
                if token==msg['message_token']:
                    self.write_message(json.dumps({'msg':r.get(k),'date':date}))
                    self.close()
                    break
            time.sleep(1)

    def on_message(self,message):
        try:
            msg=json.loads(message)
            thread.start_new(self.info_watcher,(msg,))
        except:
            self.log.error(generals.trace())

    def on_close(self):
        self.log.debug('close connection %s:'%self.id)


def message_watcher():
    log=logging.getLogger('manor')
    r=redis_tool.get_it()
    _keys=r.keys('script_info*')

    for k in _keys:
        date=k.split('_$_')[2]

        tp=time.strptime(date,"%Y-%m-%d %H:%M:%S")
        now=time.localtime()
        tpd=datetime.datetime(*tp[:6])
        nowd=datetime.datetime(*now[:6])
        poor=(nowd-tpd).days

        if poor>=1:
            log.debug('delete %s'%k)
            r.delete(k)

    _keys=r.keys('execute_script*')

    for k in _keys:
        date=k.split('_$_')[4]
        tp=time.strptime(date,"%Y-%m-%d %H:%M:%S")
        tpd=datetime.datetime(*tp[:6])

        now=time.localtime()
        nowd=datetime.datetime(*now[:6])

        poor=(nowd-tpd).days

        if poor>=1:
            log.debug('delete %s'%k)
            r.delete(k)
