import json
import logging

from tornado import gen
from tornado import ioloop
from tornado.httpclient import HTTPRequest
from tornado.websocket import websocket_connect

from manor.util import cfgutils,generals
from manor.util.db_utils import DBUtil


@gen.coroutine
def get_state_count():
    url='wss://%s:8443/manor/socket/app/status'%generals.get_ip()
    request=HTTPRequest(url=url,validate_cert=False)
    conn=yield websocket_connect(request)
    try:
        normal=0
        failure=0
        apps=yield DBUtil().query("SELECT * FROM manor.manor_app_instance")
        for app in apps:
            if app['state']=='normal':
                print app
                conn.write_message(json.dumps({
                    "app_serial":app['app_serial']
                }))
                msg=yield conn.read_message()
                status=json.loads(msg)['status']
                while status=='working':
                    yield gen.sleep(1)
                    msg=yield conn.read_message()
                    status=json.loads(msg)['status']
                if status in ['normal','part','offline']:
                    normal+=1
                else:
                    failure+=1
            else:
                failure+=1
        conn.close()

        logging.getLogger('manor').debug({'normal':normal,'failure':failure})
    except:
        logging.getLogger('manor').error(generals.trace())
        conn.close()

    raise gen.Return({'normal':normal,'failure':failure})


if __name__=='__main__':

    cfgutils.init('/opt/ecloud/etc/manor.conf')

    ioloop.IOLoop.current().run_sync(get_state_count)
