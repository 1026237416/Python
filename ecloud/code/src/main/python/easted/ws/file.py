# -*- coding: utf-8 -*-
import os
from tornado import gen
from easted.core.rest import RestHandler, post,get, Response
from easted import config

config.register("download_dir", default="../etc/downloads", secret=True)
CONF = config.CONF
__author__ = 'litao@easted.com.cn'


class Service(RestHandler):
    @gen.coroutine
    @get(_path="/file")
    def getfile(self):
        self.write('''
        <html>
          <head><title>Upload File</title></head>
          <body>
            <form action='upload' enctype="multipart/form-data" method='post'>
            <input type='file' name='file'/><br/>
            <input type='submit' value='submit'/>
            </form>
          </body>
        </html>
        ''')


    @gen.coroutine
    @get(_path="/downloadfile")
    def downloadfile(self):
        self.write('''
        <html>
          <head><title>Upload File</title></head>
          <body>
            <form action='/download' method='GET'>
            <input id="filename" name="filename" value="/template/car.xls">
            <input type='submit' value='submit'/>
            </form>
          </body>
        </html>
        ''')


    @gen.coroutine
    @post(_path="/upload")
    def upload(self):
        file_metas = self.request.files['file']
        for meta in file_metas:
            filename = meta['filename']
            filepath = os.path.join(CONF.download_dir, filename)
            try:
                with open(filepath, 'wb') as up:
                    up.write(meta['body'])
            except Exception, e:
                print e
        self.response(Response())

    @gen.coroutine
    @get(_path="/download")
    def download(self, filename):
        self.set_header('Content-Type', 'application/octet-stream')
        self.set_header('Content-Disposition', 'attachment; filename=' + os.path.basename(filename))
        with open(filename, 'rb') as f:
            while True:
                data = f.read(1024)
                if not data:
                    break
                self.write(data)
        self.finish()
