# -*- coding: utf-8 -*-
import importlib
import os

from easted.core.consumer import MessageExecuter

__author__ = 'litao@easted.com.cn'


def scandir(root, target="", listeners={}, moudle_set=[]):
    os.chdir(root)
    target = target + root + "/"
    for obj in os.listdir(os.curdir):
        if os.path.isdir(obj):
            scandir(obj, target=target)
            os.chdir(os.pardir)
        else:
            moudle = obj.split(".")[0]
            if moudle != "__init__" and moudle not in moudle_set:
                path = (target + moudle).replace("/", ".")
                m = importlib.import_module(path)
                all_items = dir(m)
                for item in all_items:
                    a = getattr(m, item)
                    try:
                        if True in map(item.endswith, ["Executer"]) and item != "MessageExecuter" and isinstance(a(),
                                                                                                                 MessageExecuter):
                            moudle_set.append(moudle)
                            event = a().event()
                            queue = a().queue()
                            if listeners.get(queue):
                                if listeners[queue].get(event):
                                    listeners[queue][event].append(a)
                                else:
                                    listeners[queue][event] = [a]
                            else:
                                listeners[queue] = {
                                    event: [a]
                                }
                    except:
                        pass
    return listeners
