# -*- coding: utf-8 -*-

__all__ = ["duplicate_removal","dict_deep_convert"]


def duplicate_removal(lst):
    """ list(dict) duplicate removal
    :param lst:
    :return:
    """
    return [dict(t) for t in set([tuple(d.items()) for d in lst])]


def dict_deep_convert(dict_obj, merge=True):
    """
    From
        {"a":"b","1":{"3":{"5":4},"d":"d","f":"f"},"c":"0","f":"9"}
    Convert to
        merge=True {'a': 'b', 'c': '0', '5': 4, 'd': 'd', 'f': 'f'}
    or
        merge=False {'a': 'b', 'c': '0', '5': 4, 'd': 'd', '1_f': 'f', 'f':'9'}
    :param dict_obj:
    :param merge:
    :return:
    """
    result = {}
    special_keys=list()
    special_vals = list()
    special_vals.append(dict_obj)
    for special_item in special_vals:
        for k, v in special_item.iteritems():
            if isinstance(v, dict):
                special_keys.append(k)
                special_vals.append(v)
            else:
                if not merge and k in result:
                    list_index = special_vals.index(special_item)
                    special_key = special_keys[list_index-1]
                    result[special_key+"_"+k] = v
                else:
                    result[k] = v
    return result