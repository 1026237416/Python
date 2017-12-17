from easted import config
from easted.utils import singleton


import threading
from concurrent.futures import ThreadPoolExecutor

__author__ = 'litao@easted.com.cn'

config.register('thread_pool_size', default=10, setting_type=config.TYPE_INT, secret=True, readonly=True)


class WorkerTask(object):
    """A task to be performed by the ThreadPool."""

    def __init__(self, function, args=(), kwargs={}):
        self.function = function
        self.args = args
        self.kwargs = kwargs

    def __call__(self):
        self.function(*self.args, **self.kwargs)


class WorkerThread(threading.Thread):
    """A thread managed by a thread pool."""

    def __init__(self, name, pool):
        threading.Thread.__init__(self, name=name)
        self.setDaemon(True)
        self.pool = pool
        self.busy = False
        self._started = False
        self._event = None

    def work(self):
        if self._started is True:
            if self._event is not None and not self._event.isSet():
                self._event.set()
        else:
            self._started = True
            self.start()

    def run(self):
        while True:
            self.busy = True
            while len(self.pool._tasks) > 0:
                try:
                    task = self.pool._tasks.pop()
                    task()
                except Exception, e:
                    # Just in case another thread grabbed the task 1st.
                    print  "threadpool run error ! thread is %s  error is %s" % (self.name, e)
                    pass
                    # Sleep until needed again
            self.busy = False
            if self._event is None:
                self._event = threading.Event()
            else:
                self._event.clear()
            self._event.wait()


class ThreadPool(object):
    """Executes queued tasks in the background."""

    def __init__(self, max_pool_size=10):
        self.max_pool_size = max_pool_size
        self._threads = []
        self._tasks = []

    def _addTask(self,name, task):
        self._tasks.append(task)

        worker_thread = None
        for thread in self._threads:
            if thread.busy is False:
                worker_thread = thread
                break

        if worker_thread is None and len(self._threads) <= self.max_pool_size:
            worker_thread = WorkerThread(name,self)
            self._threads.append(worker_thread)

        if worker_thread is not None:
            worker_thread.work()

    def add_task(self, name, function, args=(), kwargs={}):
        self._addTask(name,WorkerTask(function, args, kwargs))


class GlobalThreadPool(object):
    """ThreadPool Singleton class."""
    instance = None

    def __init__(self):
        """Create singleton instance """
        if GlobalThreadPool.instance is None:
            GlobalThreadPool.instance = ThreadPool(config.CONF.thread_pool_size)


@singleton
class FutureThreadPool(ThreadPoolExecutor):
    """used in future class."""
    def __init__(self):
        ThreadPoolExecutor.__init__(self, config.CONF.thread_pool_size)
