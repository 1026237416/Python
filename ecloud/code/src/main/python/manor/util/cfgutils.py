# coding=utf-8

import ConfigParser
import logging
import sys

__author__='sean'

_config_path=''
_config_dict={}


def get_config_path():
    return _config_path


def init(path):
    global _config_path
    if path and path.strip():
        _config_path=path
    else:
        logging.error('expected configure file path.')
        sys.exit(-1)


def getval(section,name):
    global _config_path,_config_dict
    key=section+'_'+name
    if _config_dict.has_key(key):
        return _config_dict[key]
    cf=ConfigParser.ConfigParser()
    cf.read(_config_path)
    val=cf.get(section,name)
    _config_dict[key]=val
    return val


def setval(section,name,value,persistence=False):
    key=section+'_'+name
    _config_dict[key]=value
    if persistence:
        cf=ConfigParser.ConfigParser()
        cf.set(section,name,value)
        cf.write(_config_path)
