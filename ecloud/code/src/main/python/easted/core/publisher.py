# -*- coding: utf-8 -*-
import pika
import json
from easted import config

__author__ = 'litao@easted.com.cn'

CONF = config.CONF

__EXCHANGE = 'ecloud'
__QUEUE = "ecloud-task"
__ROUTING_KEY = 'ecloud-ruote'

config.register('message.url', setting_type=config.TYPE_STR,
                default='amqp://guest:guest@10.10.130.56:5672/%2F', secret=True)


def publish_message(message):
    connection = pika.BlockingConnection(pika.URLParameters(CONF.message.url))
    channel = connection.channel()
    channel.queue_bind(exchange=__EXCHANGE,
                       queue=__QUEUE,
                       routing_key=__ROUTING_KEY)
    properties = pika.BasicProperties(app_id='ecloud-publisher',
                                      content_type='application/json')

    channel.basic_publish(__EXCHANGE, __ROUTING_KEY,
                          json.dumps(message, ensure_ascii=False),
                          properties)
    connection.close()


if __name__ == '__main__':
    for i in range(1,11):
        print i
        # message = {
        #     "event": "litao",
        #     "body":{
        #         "key":"value"
        #     }
        # }
        #
        # publish_message(message)
