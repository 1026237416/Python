import os

system_log_format = '%(asctime)s %(filename)s(line:%(lineno)d)\
- [%(levelname)s] - %(message)s'
system_log_level = 'INFO'

LOG_CONF = {
    'version': 1,

    'formatters': {
        'system_format': {'format': system_log_format},
        'operation_format': {'format': '%(message)s'}
    },

    'handlers': {
        'ecloud_handler': {
            'level': system_log_level,
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'formatter': 'system_format',
            'filename': "./ecloud.log",
            'when': 'M',
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
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'formatter': 'system_format',
            'filename': "./error.log",
            'when': 'm',
            'interval': 1,
            'backupCount': 3650
        },

        'operation_handler': {
            'level': 'INFO',
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'formatter': 'operation_format',
            'filename': "./operation.log",
            'when': 'midnight',
            'interval': 1,
            'backupCount': 3650
        }
    },
    'root':{
        'level': system_log_level,
        'handlers': ['error_handler', 'ecloud_handler', 'console_handler'],
        'propagate': False
    },
    'loggers': {
        'system': {
            'level': system_log_level,
            'handlers': ['error_handler', 'ecloud_handler', 'console_handler'],
            'propagate': False
        },

        'operation': {
            'level': 'INFO',
            'handlers': ['operation_handler', 'console_handler'],
            'propagate': False
        }
    }
}

import logging
import logging.config
logging.config.dictConfig(LOG_CONF)
LOG = logging.getLogger("efe")
LOG.error("error %s %s %s a=%s %s %s","test","test1","test2",{"a":"b"},1,[1])
LOG.error("*************************************************")
LOG.error("***********  COMPUTER CONTROL START  ************")
LOG.error("*************************************************")

print os.stat("/var/log/ecloud/error-ecloud-server_Region_60_0512180651.log.2016-07-15")