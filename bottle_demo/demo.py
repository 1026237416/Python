#!/usr/bin/env python
# -*- coding: utf-8 -*-

from bottle import route, run, template, request

upload_path = "."
#
#
# @route('/hello')
# def upload():
#     return template('upload')


@route('/hello2', method="POST")
def do_upload():
    print("***************")
    uploadfile = request.files.get('data')
    uploadfile.save(upload_path, overwrite=True)
    return u"上传成功,文件名为：%s，文件类型为：%s" % (uploadfile.filename, uploadfile.content_type)


run(host='0.0.0.0', port=8008, debug=True)
