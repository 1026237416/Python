# -*- coding: utf-8 -*-
import json

__author__ = 'litao@easted.com.cn'

import encodeutils
def loads(s, encoding='utf-8', **kwargs):
    """Deserialize ``s`` (a ``str`` or ``unicode`` instance containing a JSON

    :param s: string to deserialize
    :param encoding: encoding used to interpret the string
    :param kwargs: extra named parameters, please see documentation \
    of `json.loads <https://docs.python.org/2/library/json.html#basic-usage>`_
    :returns: python object
    """
    return json.loads(encodeutils.safe_decode(s, encoding), **kwargs)


def dumps(obj, **kwargs):
    """Serialize ``obj`` to a JSON formatted ``str``.

    :param obj: object to be serialized
    :param default: function that returns a serializable version of an object
    :param kwargs: extra named parameters, please see documentation \
    of `json.dumps <https://docs.python.org/2/library/json.html#basic-usage>`_
    :returns: json formatted string
    """
    return json.dumps(obj, **kwargs)
