# -*- coding: utf-8 -*-
import logging
import os

from tornado import gen

from easted import config
from easted.core.rest import Response
from easted.core.rest import RestHandler
from easted.core.rest import get, post, put, delete
from easted.image import *

from easted.log import log

CONF = config.CONF

LOG = logging.getLogger('system')


class Service(RestHandler):

    @gen.coroutine
    @get(_path="/images")
    def list_images_ws(self, name=None, os=None, type=None, status=None):
        images = yield list_images(name=name, os_name=os, image_type=type, status=status)
        self.response(Response(result=images, total=len(images)))

    @gen.coroutine
    @get(_path="/image/{image_id}")
    def get_image_by_id(self, image_id):
        img = yield get_image(image_id)
        self.response(Response(result=img))

    @gen.coroutine
    @post(_path="/images/upload")
    def upload_image_ws(self):
        filename = self.request.arguments.get("filename")[0]
        if not filename:
            raise ImageOperateFailed()
        file_metas = self.request.files['data']
        for meta in file_metas:
            file_path = os.path.join('/tmp', filename)
            with open(file_path, 'ab') as fh:
                fh.write(meta['body'])
        self.response(Response(result={"filename": filename}))

    @gen.coroutine
    @get(_path="/download/image/{image_id}")
    def download_image_ws(self, image_id):
        img = yield get_image(image_id)
        if not img or (img and img.get("status") != "active"):
            raise ImageNotExsit
        file_name = img.get("name").replace(' ', '_') + "." + img.get("disk_format")
        self.set_header("Content-Type", "application/octet-stream")
        self.set_header("Content-Disposition", "attachment; filename=" + file_name)

        def on_data(chunk):
            self.write(chunk)
        yield download_image(image_id, on_data)
        self.finish()

    @gen.coroutine
    @put(_path="/image", _required=['name', 'type', 'disk_format', 'os', 'min_disk'])
    def create_image_ws(self, img):
        location = img.get('url', None)
        if not location:
            filename = img.get('filename', None)
            if not filename:
                raise Exception("neither 'url' nor 'filename' found.")
            location = 'file:///tmp/' + filename
        img['location'] = location
        result = yield create_image(img)
        log.write(self.request, log.Type.IMAGE, img['name'], log.Operator.CREATE, img['os'])
        self.response(Response(result=result))

    @gen.coroutine
    @post(_path="/image/{image_id}")
    def update_image_ws(self, image_id, params):
        img = yield get_image(image_id)
        if not img:
            raise ImageNotExsit
        ret = yield update_image(image_id, **params)
        log.write(self.request, log.Type.IMAGE, ret['name'], log.Operator.UPDATE, ret['os'])
        self.response(Response())

    @gen.coroutine
    @delete(_path="/image/{image_id}")
    def delete_image_ws(self, image_id):
        try:
            img = yield get_image(image_id)
            if not img or (img and img.get("status") != "active"):
                raise ImageNotExsit
            yield delete_image(image_id)
            log.write(self.request, log.Type.IMAGE, img['name'], log.Operator.DELETE, img['os'])
        except BaseException as e:
            LOG.error("delete_image_ws error : %s" % e)
            raise e
        self.response(Response())
