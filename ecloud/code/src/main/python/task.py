import logging
import tornado.ioloop
from tornado import gen
from easted import config
from apscheduler.schedulers.tornado import TornadoScheduler
from apscheduler.executors.pool import ThreadPoolExecutor, ProcessPoolExecutor

from easted.identify.authorize import del_expires_token
from easted.log import del_files
from easted.compute import computer_monitor, create_reboot_start_schedule, clear_task
from easted.core.clean import clean_rubbish
from easted.meter import db_clean
from easted.core import dbpools
import easted.log as log
from easted.log.conf import ECLOUD_TASK_LOG_CONF

"""
 RADE ME

 http://debugo.com/apscheduler/

 cron Params:
 year (int|str) - 4-digit year
 month (int|str) - month (1-12)
 day (int|str) - day of the (1-31)
 week (int|str) - ISO week (1-53)
 day_of_week (int|str) - number or name of weekday (0-6 or mon,tue,wed,thu,fri,sat,sun)
 hour (int|str) - hour (0-23)
 minute (int|str) - minute (0-59)
 second (int|str) - second (0-59)
 start_date (datetime|str) - earliest possible date/time to trigger on (inclusive)
 end_date (datetime|str) - latest possible date/time to trigger on (inclusive)
 timezone (datetime.tzinfo|str) - time zone to use for the date/time calculations (defaults to scheduler timezone)

 interval Parmas:
 weeks (int) - number of weeks to wait
 days (int) - number of days to wait
 hours (int) - number of hours to wait
 minutes (int) - number of minutes to wait
 seconds (int) - number of seconds to wait
 start_date (datetime|str) - starting point for the interval calculation
 end_date (datetime|str) - latest possible date/time to trigger on
 timezone (datetime.tzinfo|str) - time zone to use for the date/time calculations

"""

CONF = config.CONF
LOG = logging.getLogger("system")

try:
    executors = {
        'default': ThreadPoolExecutor(10),
        'processpool': ProcessPoolExecutor(5),
    }
    log.init(ECLOUD_TASK_LOG_CONF)
    sched = TornadoScheduler(logger=LOG,executors=executors)
    print "Scheduler start"

    @sched.scheduled_job("interval", minutes=30)
    @gen.coroutine
    def task_db_clean():
        yield db_clean()

    @sched.scheduled_job("cron", hour=1, minute=10)
    @gen.coroutine
    def task_del_files():
        yield del_files()

    @sched.scheduled_job("interval", minutes=10)
    @gen.coroutine
    def task_del_expires_token():
        yield del_expires_token()

    @sched.scheduled_job("interval", minutes=1)
    @gen.coroutine
    def task_computer_monitor():
        yield computer_monitor()

    @sched.scheduled_job("interval", seconds=10)
    @gen.coroutine
    def task_create_reboot_start_schedule():
        yield create_reboot_start_schedule()

    @sched.scheduled_job("interval", minutes=1)
    @gen.coroutine
    def task_clear_expires_task_flow():
        yield clear_task()

    # @sched.scheduled_job("interval", seconds=5)
    # @gen.coroutine
    # def task_clear_boot_task_flow():
    #     yield delete_expire_task()

    dbpools.init()
    clean_rubbish()
    sched.start()
    tornado.ioloop.IOLoop.instance().start()

except KeyboardInterrupt:
    print "Scheduler shutdown"
    sched.shutdown()

