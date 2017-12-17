# -*- coding: utf-8 -*-
import json
import logging
import os

import six
from tornado import gen
from tornado import ioloop
from tornado.httpclient import HTTPRequest, AsyncHTTPClient

from easted import config
from easted import log
from easted.core import dbpools
from easted.core import openstack
from easted.core import publisher
from easted.core.consumer import MessageExecuter
from easted.image.exception import ImageOperateFailed, ImageFileNotFound, ImageNotExsit
from easted.utils import trace
from easted.volume import volume_list, update_volume_image_metadata

CONF = config.CONF

LOG = logging.getLogger('system')

__all__ = ["list_images",
           "create_image",
           "delete_image",
           "get_image",
           "update_image",
           "download_image"
           ]

IMAGE_QUEUED_EVENT = "ecloud.image.queued"
# allowed max image size 100 GB
MAX_IMAGE_SIZE = 107374182400


@gen.coroutine
def list_images(name=None, os_name=None, image_type=None, status=None):
    request_url = '/v2/images?sort=created_at:asc&limit=100'
    if name:
        request_url += '&name=' + name
    if os_name:
        request_url += '&os=' + os_name
    if image_type is not None:
        request_url += '&ecloud_image_type=' + str(image_type)
    if status:
        request_url += '&status=' + status

    session = yield openstack.get_session()
    result = yield openstack.connect_request(session=session, type=openstack.TYPE_IMAGE,
                                             method=openstack.METHOD_GET, url=request_url,
                                             response_key='images')
    results = []
    if result and len(result) > 0:
        for item in result:
            results.append(__map_image_fields(item))
    raise gen.Return(results)


@gen.coroutine
def create_image(image):
    file_info = yield _guess_file_info(image['location'])
    params = {
        'name': image['name'],
        'visibility': 'public',
        'disk_format': image.get('disk_format', 'qcow2'),
        'container_format': image.get('container_format', 'bare'),
        'ecloud_image_type': str(image.get('type', 0)),
        'os': image['os'],
        'min_disk': image.get('min_disk', 0),
        'ecloud_source': str(image.get('source', 0)),
        'des': image.get('des', ''),
        'disk_bus': image.get('disk_bus', 'virtio'),
        'super_user': "",
        'super_user_pass': ""
    }
    try:
        session = yield openstack.get_session()
        img = yield openstack.connect_request(
            session=session,
            type=openstack.TYPE_IMAGE,
            url="/v2/images",
            method=openstack.METHOD_POST,
            body=params
        )
        img['file'] = file_info
        message = {
            "event": IMAGE_QUEUED_EVENT,
            "body": img
        }
        publisher.publish_message(message)
        img = __map_image_fields(img)
    except openstack.OpenStackException, e:
        LOG.error("create image '%s' failed: %s" % (image['name'], e.message))
        raise ImageOperateFailed()
    raise gen.Return(img)


@gen.coroutine
def delete_image(image_id):
    if image_id:
        request_url = u'/v2/images/%s' % image_id
        try:
            session = yield openstack.get_session()
            yield openstack.connect_request(session=session, type=openstack.TYPE_IMAGE,
                                            method=openstack.METHOD_DELETE, url=request_url)
        except openstack.OpenStackException, e:
            LOG.error("delete image '%s' failed: %s" % (image_id, e.message))
            raise ImageOperateFailed()


@gen.coroutine
def get_image(image_id):
    if image_id:
        request_url = u'/v2/images/%s' % image_id
        try:
            session = yield openstack.get_session()
            result = yield openstack.connect_request(session=session, type=openstack.TYPE_IMAGE,
                                                     method=openstack.METHOD_GET, url=request_url)
            if result:
                result = __map_image_fields(result)

        except BaseException as e:
            LOG.error("get image error:%s", e)
            LOG.error(trace())
            raise ImageNotExsit
        raise gen.Return(result if result else None)


@gen.coroutine
def update_image(image_id, **kwargs):
    image = yield get_image(image_id)
    res = {'id': image_id, 'name': image['name']}
    if 'active' <> image['status']:
        LOG.error("update image '%s' failed: %s" % (image_id, 'status is inactive.'))
        raise ImageOperateFailed()
    url = u'/v2/images/%s' % image_id
    keys = ['name', 'os', 'min_disk', 'super_user', 'disk_bus', 'super_user_pass', 'des']
    body = []
    update_fields = []
    for k, v in six.iteritems(kwargs):
        if k in keys:
            item = {
                'path': '/' + k,
                'value': v
            }
            if k in image and v != image[k]:
                item['op'] = 'replace'
            else:
                item['op'] = 'add'
            body.append(item)
            update_fields.append(k + ":" + str(v))
    if body:
        try:
            session = yield openstack.get_session()
            yield openstack.connect_request(session=session, type=openstack.TYPE_IMAGE,
                                            method=openstack.METHOD_PATCH, url=url, body=body,
                                            content_type="application/openstack-images-v2.1-json-patch")
            res['field'] = ','.join(update_fields)
            res["os"] = image['os']
        except openstack.OpenStackException, e:
            LOG.error("update image '%s' failed: %s" % (image_id, e.message))
            raise ImageOperateFailed()
        else:
            image_volumes = yield volume_list(name="ecloud-sys-volume-image-%s" % image_id,
                                              vd_type=3)
            for image_volume in image_volumes:
                for k, v in six.iteritems(kwargs):
                    yield update_volume_image_metadata(image_volume.get("id"), k, v)
    raise gen.Return(res)


@gen.coroutine
def download_image(image_id, on_data):
    url = u'/v2/images/%s/file' % image_id
    try:
        session = yield openstack.get_session()
        yield openstack.connect_request(session=session, type=openstack.TYPE_IMAGE,
                                        method=openstack.METHOD_GET, url=url,
                                        streaming_callback=on_data,
                                        request_timeout=1800,
                                        max_body_size=MAX_IMAGE_SIZE,
                                        content_type="application/octet-stream")
    except openstack.OpenStackException, e:
        LOG.error("download image '%s' failed: %s" % (image_id, e.message))
        raise ImageOperateFailed()


def __map_image_fields(item):
    img = {
        'id': item['id'],
        'name': item['name'],
        'type': int(item.get('ecloud_image_type', '0')),
        'container_format': item['container_format'],
        'disk_format': item['disk_format'],
        'size': item['size'],
        'min_disk_size': int(item.get('min_disk_size', '0')),
        'min_disk': item.get('min_disk') if item.get('min_disk', 0) else int(
            item.get('min_disk_size', '0')),
        'status': item['status'],
        'source': int(item.get('ecloud_source', '0')),
        'created_at': item['created_at'],
        'updated_at': item['updated_at'],
    }
    # update function will check the key if exists.
    os_name = item.get('os')
    if os_name is not None:
        img['os'] = os_name
    des = item.get('des')
    if des is not None:
        img['des'] = des
    super_user = item.get('super_user')
    if super_user is not None:
        img['super_user'] = super_user
    super_user_pass = item.get('super_user_pass')
    if super_user_pass is not None:
        img['super_user_pass'] = super_user_pass
    img['disk_bus'] = item.get("disk_bus", '')
    return img


@gen.coroutine
def _upload_glance(image_id, file_info):
    if file_info['local']:
        @gen.coroutine
        def body_producer(write):
            with open(file_info['path'], 'rb') as fh:
                while True:
                    chunk = fh.read(1024)
                    if chunk:
                        write(chunk)
                    else:
                        break
    else:
        @gen.coroutine
        def body_producer(write):
            def on_data(data):
                write(data)

            req = HTTPRequest(url=file_info['path'],
                              method="GET",
                              connect_timeout=60,
                              request_timeout=1800,
                              streaming_callback=on_data,
                              validate_cert=False)
            cli = AsyncHTTPClient()
            cli.max_body_size = MAX_IMAGE_SIZE
            yield cli.fetch(req)

    session = yield openstack.get_session()
    url = u'/v2/images/%s/file' % image_id
    yield openstack.connect_request(session=session, type=openstack.TYPE_IMAGE,
                                    method=openstack.METHOD_PUT, url=url,
                                    body_producer=body_producer,
                                    content_length=file_info['size'],
                                    request_timeout=1800,
                                    content_type="application/octet-stream")
    if file_info['local']:
        os.remove(file_info['path'])


@gen.coroutine
def _guess_file_info(location):
    if not location:
        LOG.error("missing 'location' field.")
        raise ImageOperateFailed()
    file_info = {
        'local': "file://" == location[:7],
    }
    if file_info['local']:
        file_info['path'] = location[7:]
        if not os.path.exists(file_info['path']):
            LOG.error("location '%s' is not found." % file_info['path'])
            raise ImageFileNotFound()
        file_info['size'] = os.path.getsize(file_info['path'])
    else:
        file_info['path'] = location
        try:
            cli = AsyncHTTPClient()

            def handler_head_response(resp):
                file_info['size'] = resp.headers.get("Content-Length", 0)

            head_req = HTTPRequest(url=location,
                                   method="HEAD",
                                   validate_cert=False,
                                   connect_timeout=30,
                                   request_timeout=30)
            yield cli.fetch(head_req, handler_head_response)
        except Exception, e:
            LOG.error("location '%s' is not found. %s" % (location, e.message))
            raise ImageFileNotFound()
    raise gen.Return(file_info)


class ImageCreateEndExecuter(MessageExecuter):
    def event(self):
        return IMAGE_QUEUED_EVENT

    def queue(self):
        return "ecloud-task"

    @gen.coroutine
    def prepare(self):
        raise gen.Return(True)

    @gen.coroutine
    def execute(self):
        image_id = self._message.get("id")
        file_info = self._message.get("file")
        try:
            yield _upload_glance(image_id, file_info)
        except Exception, e:
            LOG.error("upload image '%s' failed: %s" % (image_id, e.message))


@gen.coroutine
def main():
    params = {
        'name': 'test image upload',
        'os': 'fedora',
        'disk_format': 'qcow2',
        'min_disk': 10,
        'des': 'testing, does not work.',
        # 'location': 'file:///home/sean/Downloads/image/fedora.qcow2'
        # 'location': 'http://10.10.199.14/image/redhat62.qcow2'
        'location': 'http://10.10.199.14/image/cirros.qcow2'
    }
    img = yield create_image(params)
    print json.dumps(img)
    file_info = yield _guess_file_info(params['location'])
    yield _upload_glance(img.get('id'), file_info)
    # img = yield get_image(img.get('id'))
    # print json.dumps(img)
    # params = {
    #     'min_disk': 3,
    #     'super_user': 'root',
    #     'super_user_pass': 'password'
    # }
    # params = {'disk_format': 'iso'}
    # ret = yield update_image('d8981cf3-016f-425c-8a3f-e9edacf16ba4', **params)
    # print json.dumps(ret)
    # yield delete_image('998eef64-c232-4fb6-b763-6d9c7d753263')

    # images = yield list_images()
    # print json.dumps(images)
    # print "images size: %d" % len(images)


if __name__ == "__main__":
    os.chdir("../../")
    log.init()
    openstack.init()
    dbpools.init()

    ioloop.IOLoop.current().run_sync(main)
