import logging
from manor.util import cfgutils
from tornado import ioloop

cfgutils.init('../etc/manor.conf')

from manor.services.app_service import AppHandler
from manor.services.template_service import TemplateHandler
from manor.services.stream_service import StreamHandler
from manor.handler.message_info import message_watcher
from manor.mapup_checker import check_mapup


def init():
    log_formatter=('%(asctime)s %(filename)s(line:%(lineno)d) - '
                   '[%(levelname)s] - %(message)s')
    log_date_format='%Y-%m-%d %H:%M:%S'

    log_handler=logging.FileHandler(cfgutils.getval('log','manor'))
    log_handler.setFormatter(
        logging.Formatter(log_formatter,datefmt=log_date_format)
    )
    logger_manor=logging.getLogger('manor')
    logger_manor.setLevel(cfgutils.getval('log','level'))
    logger_manor.addHandler(log_handler)


def add_periodic():
    periodic=ioloop.PeriodicCallback(message_watcher,2000,ioloop.IOLoop.current())
    periodic.start()

    periodic1=ioloop.PeriodicCallback(check_mapup,60*1000,ioloop.IOLoop.current())
    periodic1.start()


def add_handler(modules):
    modules=modules+[
        TemplateHandler,
        StreamHandler,
        AppHandler
    ]
    logging.getLogger('manor').debug('start manor ...')
    return modules
