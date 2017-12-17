# -*- coding: utf-8 -*-
__author__ = 'litao@easted.com.cn'

# -*- coding: utf-8 -*-
import os
from easted import config
from easted.core.exception import ECloudException

config.register("download_dir", default="../etc/downloads", secret=True)

CONF = config.CONF
__author__ = 'litao@easted.com.cn'


class UploadFileException(ECloudException):
    msg = "error.file.upload.failed"


class DownloadFileException(ECloudException):
    msg = "error.file.download.failed"


def upload(self, filepath):
    try:
        file_metas = self.request.files['file']
        for meta in file_metas:
            filename = meta['filename']
            # filepath = os.path.join(CONF.download_dir, filename)
            with open(filepath, 'wb') as up:
                up.write(meta['body'])
    except Exception:
        raise UploadFileException


def download(self, filename):
    try:
        self.set_header('Content-Type', 'application/octet-stream')
        self.set_header('Content-Disposition', 'attachment; filename=' + os.path.basename(filename))
        with open(filename, 'rb') as f:
            while True:
                data = f.read(1024)
                if not data:
                    break
                self.write(data)
    except Exception:
        raise DownloadFileException
    finally:
        self.finish()
