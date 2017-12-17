# -*- coding: utf-8 -*-

import ConfigParser
import json
import logging

from oslo_config import cfg

from easted.core.exception import GlobalSettingOperationFailed

__author__ = 'litao@easted.com.cn'

__all__ = [
    "CONF",
    "register",
    "list_settings",
    "update",
    "TYPE_BOOL",
    "TYPE_FLOAT",
    "TYPE_INT",
    "TYPE_STR",
    "TYPE_LIST"
]

CONF = cfg.CONF
CONF()
LOG = logging.getLogger('system')

TYPE_INT = cfg.types.Integer()
TYPE_STR = cfg.types.String()
TYPE_FLOAT = cfg.types.Float()
TYPE_BOOL = cfg.types.Boolean()
TYPE_LIST = cfg.types.List()


def register(name, default=None, setting_type=TYPE_STR,
             setting_help=None, secret=False, readonly=False):
    """
    :param name:
    :param default:
    :param setting_type:
    :param setting_help:
    :param secret: 默认为false显示在全局参数。
    :param readonly:默认为false可修改
    :return:
    """
    try:
        group, name = __extract_group_name(name)
        opt = cfg.Opt(name, default=default, type=setting_type,
                      help=setting_help, secret=secret, required=readonly)
        CONF.register_opt(opt, group)
    except cfg.DuplicateOptError:
        pass


def list_settings():
    return_settings = []
    try:
        CONF.reload_config_files()
        for group in CONF._groups:
            setting = CONF[group].__dict__['_group'].__dict__['_opts']
            for k, setting in setting.items():
                if not setting.get('opt').secret:
                    var = {
                        "name": group + "." + k,
                        "value": CONF[group].get(k),
                        "type": str(setting.get('opt').type),
                        "default": setting.get('opt').default,
                        "help": setting.get('opt').help,
                        "readonly": setting.get('opt').required
                    }
                    if var.get("name") == 'storage.share_storage_access':
                        continue
                    return_settings.append(var)
    except Exception, e:
        LOG.error(e.message)
        raise GlobalSettingOperationFailed()
    return return_settings


def update(name, value):
    """update opt
    :param name:
    :param value:
    :return:
    """
    if name:
        group, name = __extract_group_name(name)
        config_file = CONF.get('config_file')
        setting = CONF[group].__dict__['_group'].__dict__['_opts']
        LOG.debug("update settings %s-%s : %s", group, name, value)
        if config_file:
            parser = ConfigParser.ConfigParser()
            parser.read(config_file[0])
            if not setting[name].get('opt').secret \
                    and not setting[name].get('opt').required:
                parser.set(group, name, value)
                with open(config_file[0], mode="w") as fp:
                    parser.write(fp)
                CONF.reload_config_files()


def __extract_group_name(name_with_group):
    """extract group name
    :param name_with_group:
    :return:
    """
    if name_with_group.find(".") != -1:
        opt = name_with_group.split(".")
        group = opt[0]
        name = ".".join(opt[1:])
    else:
        group = None
        name = name_with_group
    return group, name


if __name__ == '__main__':
    from easted import log

    log.init()
    register("database.db_nova")
    print json.dumps(list_settings())
    print TYPE_INT, TYPE_BOOL, TYPE_STR, TYPE_FLOAT, str(TYPE_LIST)
