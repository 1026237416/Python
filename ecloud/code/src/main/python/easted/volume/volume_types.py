# -*- coding: utf-8 -*-

import logging
from tornado import gen
from common import *
from exception import VolumeTypeOperationFailed

__all__ = ["list_volume_type"]

LOG = logging.getLogger("system")

@gen.coroutine
def list_volume_type():
    """ list volume types
    """
    try:
        volume_types = yield volume_type_list()
    except Exception, e:
        LOG.error("volume type list error: %s" % e)
        raise VolumeTypeOperationFailed()
    raise gen.Return(volume_types)

@gen.coroutine
def main():
    pass

if __name__ == "__main__":
    from tornado import ioloop
    ioloop.IOLoop.current().run_sync(main)
