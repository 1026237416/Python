# -*- coding: utf-8 -*-

from easted import config

CONF = config.CONF

config.register('log.operation_log_format', default='%(user)s %(role)s %(type)s %(operation)s %(object)s', secret=True)
config.register('log.system_log_level', default='DEBUG', secret=True)
config.register('log.file_path', default='/var/log/ecloud/', readonly=True)
config.register('log.files_max_size', setting_type=config.TYPE_INT, default=1)
config.register('log.file_ttl', setting_type=config.TYPE_INT, default=10)
config.register('log.syslog_server_ip', default='')
config.register('log.syslog_server_port', setting_type=config.TYPE_INT, default=514)
config.register("keystone.region_name", default="RegionOne", secret=True)

operation_log_format = CONF.log.operation_log_format
system_log_level = CONF.log.system_log_level

syslog_server_ip = CONF.log.syslog_server_ip
syslog_server_port = CONF.log.syslog_server_port

__ESCHED = "ecloud-task_" + CONF.keystone.region_name + ".log"
__EWORKER = "ecloud-message_" + CONF.keystone.region_name + ".log"
__ECLOUD = "ecloud-server_" + CONF.keystone.region_name + ".log"
__ESCHED_ERROR_PATH = "error-ecloud-task_" + CONF.keystone.region_name + ".log"
__EWORKER_ERROR_PATH = "error-ecloud-message_" + CONF.keystone.region_name + ".log"
__ECLOUD_ERROR_PATH = "error-ecloud-server_" + CONF.keystone.region_name + ".log"
__OPERATION = "operation_" + CONF.keystone.region_name + ".log"
__CLASS = "easted.log.handler.TimedRotatingFileHandler"
max_stay_time = CONF.log.file_ttl
max_size = CONF.log.files_max_size
ecloud_log_dir = CONF.log.file_path
haveSyslog = syslog_server_ip is not ''

system_log_format = '%(asctime)s %(filename)s(line:%(lineno)d)\
- [%(levelname)s] - %(message)s'
if system_log_level == 'INFO':
    system_log_format = '%(asctime)s  - [%(levelname)s] - %(message)s'

ECLOUD_SERVER_LOG_CONF = {
    'version': 1,

    'formatters': {
        'system_format': {'format': system_log_format},
        'operation_format': {'format': '%(message)s'}
    },

    'handlers': {
        'ecloud_handler': {
            'level': system_log_level,
            'class': __CLASS,
            'formatter': 'system_format',
            'filename': ecloud_log_dir + '/' + __ECLOUD,
            'when': 'midnight',
            'interval': 1,
            'backupCount': 3650
        },

        'console_handler': {
            'level': system_log_level,
            'class': 'logging.StreamHandler',
            'formatter': 'system_format'
        },

        'error_handler': {
            'level': 'ERROR',
            'class': __CLASS,
            'formatter': 'system_format',
            'filename': ecloud_log_dir + '/' + __ECLOUD_ERROR_PATH,
            'when': 'midnight',
            'interval': 1,
            'backupCount': 3650
        },

        'syslog_handler': {
            'level': 'INFO',
            'class': 'logging.handlers.SysLogHandler',
            'formatter': 'operation_format',
            'address': (syslog_server_ip, syslog_server_port),
        },

        'operation_handler': {
            'level': 'INFO',
            'class': __CLASS,
            'formatter': 'operation_format',
            'filename': ecloud_log_dir + '/' + __OPERATION,
            'when': 'midnight',
            'interval': 1,
            'backupCount': 3650
        }
    },

    'loggers': {
        'system': {
            'level': system_log_level,
            'handlers': ['error_handler', 'ecloud_handler'],
            'propagate': False
        },
        'syslog': {
            'level': 'INFO',
            'handlers': ['syslog_handler'],
            'propagate': False
        },
        'operation': {
            'level': 'INFO',
            'handlers': ['operation_handler'],
            'propagate': False
        }
    }
}

ECLOUD_TASK_LOG_CONF = {
    'version': 1,

    'formatters': {
        'system_format': {'format': system_log_format},
        'operation_format': {'format': '%(message)s'}
    },

    'handlers': {

        'esched_handler': {
            'level': system_log_level,
            'class': __CLASS,
            'formatter': 'system_format',
            'filename': ecloud_log_dir + "/" + __ESCHED,
            'when': 'midnight',
            'interval': 1,
            'backupCount': 3650
        },

        'console_handler': {
            'level': system_log_level,
            'class': 'logging.StreamHandler',
            'formatter': 'system_format'
        },

        'syslog_handler': {
            'level': 'INFO',
            'class': 'logging.handlers.SysLogHandler',
            'formatter': 'operation_format',
            'address': (syslog_server_ip, syslog_server_port),
        },

        'error_handler': {
            'level': 'ERROR',
            'class': __CLASS,
            'formatter': 'system_format',
            'filename': ecloud_log_dir + '/' + __ESCHED_ERROR_PATH,
            'when': 'midnight',
            'interval': 1,
            'backupCount': 3650
        }

    },

    'loggers': {
        'system': {
            'level': system_log_level,
            'handlers': ['error_handler', "esched_handler"],
            'propagate': False
        },
        'syslog': {
            'level': 'INFO',
            'handlers': ['syslog_handler'],
            'propagate': False
        },
    }
}

ECLOUD_MESSAGE_LOG_CONF = {
    'version': 1,

    'formatters': {
        'system_format': {'format': system_log_format},
        'operation_format': {'format': '%(message)s'}
    },

    'handlers': {

        'eworker_handler': {
            'level': system_log_level,
            'class': __CLASS,
            'formatter': 'system_format',
            'filename': ecloud_log_dir + "/" + __EWORKER,
            'when': 'midnight',
            'interval': 1,
            'backupCount': 3650
        },

        'console_handler': {
            'level': system_log_level,
            'class': 'logging.StreamHandler',
            'formatter': 'system_format'
        },

        'error_handler': {
            'level': 'ERROR',
            'class': __CLASS,
            'formatter': 'system_format',
            'filename': ecloud_log_dir + '/' + __EWORKER_ERROR_PATH,
            'when': 'midnight',
            'interval': 1,
            'backupCount': 3650
        },

        'syslog_handler': {
            'level': 'INFO',
            'class': 'logging.handlers.SysLogHandler',
            'formatter': 'operation_format',
            'address': (syslog_server_ip, syslog_server_port),
        }
    },

    'loggers': {
        'system': {
            'level': system_log_level,
            'handlers': ['error_handler', 'eworker_handler'],
            'propagate': False
        },
        'syslog': {
            'level': 'INFO',
            'handlers': ['syslog_handler'],
            'propagate': False
        }
    }
}
