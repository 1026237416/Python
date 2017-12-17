# -*- coding: utf-8 -*-
from __future__ import print_function

import cProfile
from functools import wraps
from tornado import gen
from easted.core import dbpools
from ast import literal_eval

__author__ = 'yangkefeng@easted.com.cn'
__all__ = [
    "memoize",
    "arg",
    "add_arg",
    "ManualCache",
    "RedisCache",
    "eval_val"
]


def do_c_profile(func):
    def profiled_func(*args, **kwargs):
        profile = cProfile.Profile()
        try:
            profile.enable()
            result = func(*args, **kwargs)
            profile.disable()
            return result
        finally:
            profile.print_stats()

    return profiled_func


try:
    from line_profiler import LineProfiler


    def do_profile(follow=[]):
        def inner(func):
            def profiled_func(*args, **kwargs):
                try:
                    profiler = LineProfiler()
                    profiler.add_function(func)
                    for f in follow:
                        profiler.add_function(f)
                    profiler.enable_by_count()
                    return func(*args, **kwargs)
                finally:
                    profiler.print_stats()

            return profiled_func

        return inner

except ImportError:
    def do_profile(follow=[]):
        "Helpful if you accidentally leave in production!"

        def inner(func):
            def nothing(*args, **kwargs):
                return func(*args, **kwargs)

            return nothing

        return inner


def memoize(func):
    """ cache exec result of function
    :param func:
    :return:
    """
    cache = {}
    miss = object()

    @wraps(func)
    def wrapper(*args, **kwargs):
        key = str(args) + str(kwargs)
        result = cache.get(key, miss)
        if result is miss:
            result = func(*args, **kwargs)
            cache[key] = result
        return result

    return wrapper


def arg(*args, **kwargs):
    def _decorator(func):
        add_arg(func, *args, **kwargs)
        return func

    return _decorator


def add_arg(func, *args, **kwargs):
    if not hasattr(func, 'arguments'):
        func.arguments = []

    # NOTE(sirp): avoid dups that can occur when the module is shared across
    # tests.
    if (args, kwargs) not in func.arguments:
        # Because of the semantics of decorator composition if we just append
        # to the options list positional options will appear to be backwards.
        func.arguments.insert(0, (args, kwargs))


class ManualCache(object):
    def __init__(self):
        self.__cache = {}

    def set(self, key, dct):
        self.__cache[key] = dct

    def remove(self, key):
        if key in self.__cache:
            del self.__cache[key]

    @gen.coroutine
    def get(self, key, func):
        if key not in self.__cache:
            self.__cache[key] = yield func()
        raise gen.Return(self.__cache[key])

    def get_by_id(self, key):
        if key in self.__cache:
            return self.__cache[key]
        return None

    def get_by_unique(self, unq_name, unq_value):
        for k in self.__cache:
            if unq_name in self.__cache[k] and self.__cache[k][unq_name] == unq_value:
                return self.__cache[k]
        return None

    def clear(self):
        self.__cache.clear()


def eval_val(result):
    try:
        result = literal_eval(result)
    except (ValueError, Exception):
        result = result
    return result


class RedisCache(object):
    def __init__(self, cache_name):
        self.__cache_prefix = cache_name + ":"

    def set(self, key, dct):
        redis = dbpools.get_redis()
        redis_key = self.__cache_prefix + key
        if dct:
            if isinstance(dct, (list, tuple)):
                redis.sadd(redis_key, *[str(item) for item in dct])
            elif isinstance(dct, dict):
                redis.hmset(redis_key, dct)
            else:
                # if isinstance(dct, dict):
                #     dct = str(dct)
                redis.set(redis_key, dct)

    def remove(self, key):
        redis = dbpools.get_redis()
        redis.delete(self.__cache_prefix + key)

    @gen.coroutine
    def get(self, key, func):
        redis = dbpools.get_redis()
        redis_key = self.__cache_prefix + key
        if not redis.exists(redis_key):
            dct = yield func()
            self.set(key, dct)
            raise gen.Return(dct)

        raise gen.Return(self.get_by_id(key))

    def get_by_id(self, key):
        redis = dbpools.get_redis()
        redis_key = self.__cache_prefix + key
        redis_key_type = redis.type(redis_key)
        if redis_key_type == "set":
            lst = redis.smembers(redis_key)
            result = []
            for item in lst:
                result.append(eval_val(item))
            return result
        elif redis_key_type == "hash":
            result = redis.hgetall(redis_key)
            return result
        else:
            result = eval_val(redis.get(redis_key))
            return result

    def get_by_unique(self, unq_name, unq_value):
        redis = dbpools.get_redis()
        for k in redis.keys(self.__cache_prefix + "*"):
            if unq_name in redis.hkeys(k) and unq_value in redis.hvals(k):
                return redis.hgetall(k)
        return None

    def clear(self):
        redis = dbpools.get_redis()
        dels = redis.keys(self.__cache_prefix + "*")
        if dels:
            redis.delete(*dels)


@gen.coroutine
def main():
    c = ManualCache()
    key = 'test'

    @gen.coroutine
    def f():
        print('get object from db...')
        c.set('another', {'name': 'manual set', 'id': '2'})
        raise gen.Return({'test': key})

    o = yield c.get(key, f)
    print(o)
    o = yield c.get(key, f)
    print(o)
    o = yield c.get('another', f)
    print(o)
    c.remove(key)
    o = yield c.get(key, f)
    print(o)
    print(c.get_by_unique('name', 'manual set'))


if __name__ == '__main__':
    from tornado import ioloop

    ioloop.IOLoop.current().run_sync(main)
