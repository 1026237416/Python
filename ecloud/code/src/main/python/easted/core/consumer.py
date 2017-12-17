# -*- coding: utf-8 -*-
import importlib
from pika import adapters
import pika
import logging
import abc
import time

from tornado import gen

from easted.core.threadpool import GlobalThreadPool

__author__ = 'litao@easted.com.cn'

LOG = logging.getLogger("system")


class Connection(object):
    CONNECT_INTERVAL = 10

    def __init__(self, amqp_url, channels):
        self._connection = None
        self._closing = False
        self._url = amqp_url
        self._channels = channels

    def connect(self):
        LOG.info('Connecting to %s', self._url)
        return adapters.TornadoConnection(pika.URLParameters(self._url), self.on_connection_open,
                                          self.on_connection_open_error)

    def on_connection_open_error(self, a, b):
        try:
            time.sleep(self.CONNECT_INTERVAL)
        except:
            pass
        else:
            self.reconnect()

    def close_connection(self):
        LOG.info('Closing connection')
        self._connection.close()

    def add_on_connection_close_callback(self):
        self._connection.add_on_close_callback(self.on_connection_closed)

    def on_connection_closed(self, connection, reply_code, reply_text):
        if self._closing:
            self._connection.ioloop.stop()
        else:
            if self._connection:
                self.close_connection()
            LOG.warning('Connection closed, reopening in 5 seconds: (%s) %s', reply_code, reply_text)
            self._connection.add_timeout(5, self.reconnect)

    def on_connection_open(self, unused_connection):
        LOG.info('Connection opened')
        self.add_on_connection_close_callback()
        for chan in self._channels:
            channel = Channel(self._connection, chan)
            channel.open_channel()

    def reconnect(self):
        if not self._closing:
            self._connection = self.connect()
            self._connection.ioloop.start()

    def run(self):
        self._connection = self.connect()
        self._connection.ioloop.start()

    def stop(self):
        LOG.info('Stopping')
        self._closing = True
        if self._connection and self._connection.ioloop:
            self._connection.ioloop.stop()
        LOG.info('Stopped')


class Channel(object):
    def __init__(self, connection, binding):
        self._connection = connection
        self.channel = None
        self.consumer_tag = None
        self._binding = binding
        self._adapter = None

    def add_on_channel_close_callback(self):
        LOG.info('Adding channel close callback')
        self.channel.add_on_close_callback(self.on_channel_closed)

    def on_channel_closed(self, channel, reply_code, reply_text):
        LOG.warning('Channel %i was closed: (%s) %s', channel, reply_code, reply_text)
        self.channel.close()

    def on_channel_open(self, channel):
        LOG.info('Channel opened')
        self.channel = channel
        self.add_on_channel_close_callback()
        self._adapter = importlib.import_module(self._binding["adapter_declare"])
        if self._binding["exchange_declare"]:
            for exchange in self._binding["exchange_declare"]:
                self.channel.exchange_declare(None, exchange[0], exchange[1])
        self.on_exchange_declareok()

    def on_exchange_declareok(self):
        LOG.info('Exchange declared')
        if self._binding['queue_declare']:
            queue = self._binding['queue_declare']['name']
            self.setup_queue(queue)

    def setup_queue(self, queue_name):
        LOG.info('Declaring queue %s', queue_name)
        self.channel.queue_declare(self.on_queue_declareok, queue_name)

    def on_queue_declareok(self, method_frame):
        if self._binding['queue_declare']:
            queue = self._binding['queue_declare']['name']
            if self._binding['queue_declare']['bind']:
                for exchange, routing_key in self._binding['queue_declare']['bind'].items():
                    LOG.info('Binding %s to %s with %s', exchange, queue, routing_key)
                    self.channel.queue_bind(self.on_bindok, queue, exchange, routing_key)

    def add_on_cancel_callback(self):
        LOG.info('Adding consumer cancellation callback')
        self.channel.add_on_cancel_callback(self.on_consumer_cancelled)

    def on_consumer_cancelled(self, method_frame):
        LOG.info('Consumer was cancelled remotely, shutting down: %r', method_frame)
        if self.channel:
            self.channel.close()

    def acknowledge_message(self, delivery_tag):
        self.channel.basic_ack(delivery_tag)

    def on_message(self, unused_channel, basic_deliver, properties, body):
        # LOG.debug("queue %s message %s" % (self._binding['queue_declare']['name'], body))
        threadpool = GlobalThreadPool()
        threadpool.instance.add_task(self._binding['queue_declare']['name'], self.execute, [basic_deliver, body])

    def execute(self, basic_deliver, body):
        self._adapter.Adapter(self._binding['queue_declare'].get("listeners"), body).dispatch()
        self.acknowledge_message(basic_deliver.delivery_tag)

    def start_consuming(self):
        LOG.info('Issuing consumer related RPC commands')
        self.add_on_cancel_callback()
        queue = self._binding['queue_declare']['name']
        self.consumer_tag = self.channel.basic_consume(self.on_message, queue)

    def on_bindok(self, unused_frame):
        LOG.info('Queue bound')
        self.start_consuming()

    def open_channel(self):
        LOG.info('Creating a new channel')
        return self._connection.channel(on_open_callback=self.on_channel_open)


class BaseAdapter(object):
    def __init__(self, listeners, message={}):
        self._listeners = listeners
        self._message = message
        self._event = None
        self._body = None

    @abc.abstractmethod
    @gen.coroutine
    def execute(self):
        pass

    def dispatch(self):
        self.execute()
        if self._listeners and self._event and self._body and self._listeners.get(self._event):
            LOG.debug("execute event %s " % self._event)
            for listener in self._listeners.get(self._event):
                listener(self._body).run()


class MessageExecuter(object):
    def __init__(self, message={}):
        self._message = message
        self._task = None

    @abc.abstractmethod
    def event(self):
        return NotImplemented

    @abc.abstractmethod
    def queue(self):
        return NotImplemented

    @abc.abstractmethod
    @gen.coroutine
    def prepare(self):
        return NotImplemented

    @abc.abstractmethod
    @gen.coroutine
    def execute(self):
        return NotImplemented

    @gen.coroutine
    def run(self):
        prepared = yield self.prepare()
        if not prepared:
            return
        LOG.debug("execute message %s " % self._message)
        yield self.execute()
