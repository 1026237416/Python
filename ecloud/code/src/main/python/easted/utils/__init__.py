# -*- coding: utf-8 -*-
import sys
import traceback

from cacheUtils import *
from calcUtils import *
from datetimeUtils import *
from encryptUtils import *
from pingUtils import *
from stringUtils import *
from validParamUtils import *
from dictAndListUtils import *

def trace():
    exc_type,exc_value,exc_traceback=sys.exc_info()
    error_str=""
    for e in traceback.format_exception(exc_type,exc_value,exc_traceback):
        error_str+=e
    return error_str



def singleton(cls):
    instances = {}

    def _singleton():
        if cls not in instances:
            instances[cls] = cls()
        return instances[cls]

    return _singleton
