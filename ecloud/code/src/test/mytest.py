from tornado import gen
import tornado

class DBCommit(object):

    def __init__(self):
        pass

    def __enter__(self):
        return self

    @gen.coroutine
    def __exit__(self, exc_type, exc_value, exc_tb):
        yield gen.sleep(10)
        print 1111



with DBCommit() as db:
    i=1
print 1

if __name__ == "__main__":
    tornado.ioloop.IOLoop.current().start()
