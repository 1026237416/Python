# -*- coding: utf-8 -*-
import uuid

__author__ = 'yangkefeng@easted.com.cn'

def generate_uuid(uuid_type=4, namespace=None, name=None):
    """Creates a random uuid string.

    :returns: string
    """
    if uuid_type == 1:
        return str(uuid.uuid1())
    if uuid_type == 3:
        return str(uuid.uuid3(namespace, name))
    if uuid_type == 4:
        return str(uuid.uuid4())
    if uuid_type == 5:
        return str(uuid.uuid5(namespace, name))
    else:
        return str(uuid.uuid4())


def _format_uuid_string(string):
    return (string.replace('urn:', '')
                  .replace('uuid:', '')
                  .strip('{}')
                  .replace('-', '')
                  .lower())


def is_uuid_like(val):
    """Returns validation of a value as a UUID.

    :param val: Value to verify
    :type val: string
    :returns: bool

    .. versionchanged:: 1.1.1
       Support non-lowercase UUIDs.
    """
    try:
        return str(uuid.UUID(val)).replace('-', '') == _format_uuid_string(val)
    except (TypeError, ValueError, AttributeError):
        return False