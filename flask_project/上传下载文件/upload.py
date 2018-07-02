#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: upload.py
    @time: 2018/7/1 22:19
    @desc:
"""
import os
import time

import config


def allow_file(filename):
    return ("." in filename and filename.rsplit(".", 1)[1]
            in config.ALLOWED_EXTENSIONS)


def upload(request):
    file_dir = os.path.join(config.basedir, config.UPLOAD_DIR)

    if not os.path.isdir(file_dir):
        os.makedirs(file_dir)
    upload_file = request.files["myfile"]
    print(upload_file)
    if upload_file and allow_file(upload_file.filename):
        fname = upload_file.filename
        ext = fname.rsplit(".", 1)[1]
        unix_time = int(time.time())
        new_filename = str(unix_time) + "." + ext
        upload_file.save(os.path.join(file_dir, new_filename))
        return {"errno": 0, "errmsg": "上传成功"}
    else:
        return {"errno": 1001, "errmsg": "上传失败"}


if __name__ == '__main__':
    print(allow_file("1.xt"))
