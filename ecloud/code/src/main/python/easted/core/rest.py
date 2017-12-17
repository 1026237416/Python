# -*- coding: utf-8 -*-

import inspect
import json
import logging
import re
import time

import time
import tornado.web
from tornado import gen
from authen import Auth
from exception import ECloudException, RequiredParamNotExist

__author__ = 'Gavin'

LOG = logging.getLogger('system')


def config(func, method, **kwparams):
    """ Decorator config function """
    path = None
    required = None

    if len(kwparams):
        path = kwparams['_path']
        if '_required' in kwparams:
            required = kwparams['_required']

    def operation(*args, **kwargs):
        return func(*args, **kwargs)

    operation.func_name = func.__name__
    operation._func_params = inspect.getargspec(func).args[1:]
    operation._service_name = re.findall(r"(?<=/)\w+", path)
    operation._service_params = re.findall(r"(?<={)\w+", path)
    operation._method = method
    operation._query_params = re.findall(r"(?<=<)\w+", path)
    operation._path = path
    operation._required = required

    return operation


def get(*params, **kwparams):
    """ Decorator for config a python function like a Rest GET verb	"""

    def method(f):
        return config(f, 'GET', **kwparams)

    return method


def post(*params, **kwparams):
    """ Decorator for config a python function like a Rest POST verb	"""

    def method(f):
        return config(f, 'POST', **kwparams)

    return method


def put(*params, **kwparams):
    """ Decorator for config a python function like a Rest PUT verb	"""

    def method(f):
        return config(f, 'PUT', **kwparams)

    return method


def delete(*params, **kwparams):
    """ Decorator for config a python function like a Rest PUT verb	"""

    def method(f):
        return config(f, 'DELETE', **kwparams)

    return method


METHOD_ARG_NAME = 'Ecloud-Method'


def _check_required(required, body):
    for f in required:
        if f not in body:
            raise RequiredParamNotExist(args=[f])


class RestHandler(tornado.web.RequestHandler):
    def data_received(self, chunk):
        pass

    def prepare(self):
        if METHOD_ARG_NAME in self.request.headers.keys():
            method = self.request.headers[METHOD_ARG_NAME]
            if method:
                self.request.method = method

    @gen.coroutine
    def get(self):
        """ Executes get method """
        yield self._exe('GET')

    @gen.coroutine
    def post(self):
        """ Executes post method """
        yield self._exe('POST')

    @gen.coroutine
    def put(self):
        """ Executes put method"""
        yield self._exe('PUT')

    @gen.coroutine
    def delete(self):
        """ Executes put method"""
        yield self._exe('DELETE')

    @gen.coroutine
    def _exe(self, method):
        try:
            yield Auth(self.request).execute()
        except Exception, e:
            self.response(Response(success=False, msg=e.message))
            raise

        """ Executes the python function for the Rest Service """
        request_path = self.request.path
        path = request_path.split('/')
        services_and_params = list(filter(lambda x: x != '', path))

        # Get all funcion names configured in the class RestHandler
        functions = list(filter(lambda op: hasattr(getattr(self, op), '_service_name') == True and inspect.ismethod(
                getattr(self, op)) == True, dir(self)))
        # Get all http methods configured in the class RestHandler
        http_methods = list(map(lambda op: getattr(getattr(self, op), '_method'), functions))

        if method not in http_methods:
            raise tornado.web.HTTPError(405, 'The service not have %s verb' % method)

        for operation in list(map(lambda op: getattr(self, op), functions)):
            service_name = getattr(operation, "_service_name")
            service_params = getattr(operation, "_service_params")
            required = getattr(operation, "_required")
            # If the _types is not specified, assumes str types for the params
            services_from_request = list(filter(lambda x: x in path, service_name))

            if operation._method == self.request.method and service_name == services_from_request and len(
                    service_params) + len(service_name) == len(services_and_params):
                try:
                    params_values = self._find_params_value_of_url(
                            service_name, request_path) + self._find_params_value_of_arguments(operation)
                    p_values = params_values

                    if self.request.body:
                        try:
                            body = json.loads(self.request.body)
                        except Exception:
                            LOG.debug("body is not json")
                        else:
                            p_values.append(body)
                            if required and len(required):
                                _check_required(required, body)

                    yield operation(*p_values)
                except ECloudException as detail:
                    LOG.debug("rest frame detail=%s" % detail)
                    self.response(Response(success=False, msg=detail.msg, result=detail.args))
                except Exception as detail:
                    LOG.debug("rest frame detail=%s" % detail)
                    self.response(Response(success=False, msg=detail.message))

    def response(self, response):
        self.set_header("Content-Type", 'application/json')
        self.write(response.__dict__)
        self.finish()

    def _find_params_value_of_url(self, services, url):
        """ Find the values of path params """
        values_of_query = list()
        i = 0
        url_split = url.split("/")
        values = [item for item in url_split if item not in services and item != '']
        for v in values:
            if v is not None:
                values_of_query.append(v)
                i += 1
        return values_of_query

    def _find_params_value_of_arguments(self, operation):
        values = []
        if len(self.request.arguments) > 0:
            a = operation._service_params
            b = operation._func_params
            params = [item for item in b if item not in a]
            for p in params:
                if p in self.request.arguments.keys():
                    v = self.request.arguments[p]
                    values.append(v[0])
                else:
                    values.append(None)
        elif len(self.request.arguments) == 0 and len(operation._query_params) > 0:
            values = [None] * (len(operation._func_params) - len(operation._service_params))
        return values

    def gen_http_error(self, status, msg):
        """ Generates the custom HTTP error """
        self.clear()
        self.set_status(status)
        self.write("<html><body>" + str(msg) + "</body></html>")
        self.finish()

    @classmethod
    def get_services(self):
        """ Generates the resources (uri) to deploy the Rest Services """
        services = []
        for f in dir(self):
            o = getattr(self, f)
            if callable(o) and hasattr(o, '_service_name'):
                services.append(getattr(o, '_service_name'))
        return services

    @classmethod
    def get_paths(self):
        """ Generates the resources from path (uri) to deploy the Rest Services """
        paths = []
        for f in dir(self):
            o = getattr(self, f)
            if callable(o) and hasattr(o, '_path'):
                paths.append(getattr(o, '_path'))
        return paths

    @classmethod
    def get_handlers(self):
        """ Gets a list with (path, handler) """
        svs = []
        paths = self.get_paths()
        for p in paths:
            s = re.sub(r"(?<={)\w+}", ".*", p).replace("{", "")
            o = re.sub(r"(?<=<)\w+", "", s).replace("<", "").replace(">", "").replace("&", "").replace("?", "")
            svs.append((o, self))

        return svs


class RestService(tornado.web.Application):
    """ Class to create Rest services in tornado web server """
    resource = None

    def __init__(self, rest_handlers, resource=None, handlers=None, default_host="", transforms=None, **settings):
        restservices = []
        self.resource = resource
        for r in rest_handlers:
            svs = self._generateRestServices(r)
            restservices += svs
        if handlers != None:
            restservices += handlers
        tornado.web.Application.__init__(self, restservices, default_host, transforms, **settings)

    def _generateRestServices(self, rest):
        svs = []
        paths = rest.get_paths()
        for p in paths:
            s = re.sub(r"(?<={)\w+}", ".*", p).replace("{", "")
            o = re.sub(r"(?<=<)\w+", "", s).replace("<", "").replace(">", "").replace("&", "").replace("?", "")
            svs.append((o, rest, self.resource))

        return svs


class Response(object):
    success = bool
    msg = str
    code = int
    records = object
    total = long

    def __init__(self, **kwargs):
        self.success = kwargs.get('success', True)
        self.msg = kwargs.get('msg', 'success')
        self.result = kwargs.get('result', {})
        self.total = kwargs.get('total', 0)
        self.code = kwargs.get('code', 200)
