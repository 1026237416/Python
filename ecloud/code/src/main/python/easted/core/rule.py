import logging

from easted.core import policy

__author__ = 'litao@easted.com.cn'

LOG = logging.getLogger('system')

_ENFORCER = None


def reset():
    global _ENFORCER
    if _ENFORCER:
        _ENFORCER.clear()
        _ENFORCER = None


def init(policy_file=None, rules=None, default_rule=None, use_conf=True):
    """Init an Enforcer class.

       :param policy_file: Custom policy file to use, if none is specified,
                           `CONF.policy_file` will be used.
       :param rules: Default dictionary / Rules to use. It will be
                     considered just in the first instantiation.
       :param default_rule: Default rule to use, CONF.default_rule will
                            be used if none is specified.
       :param use_conf: Whether to load rules from config file.
    """
    # policy.CONF(default_config_files=['./../etc/ecloud.conf'])
    global _ENFORCER
    if not _ENFORCER:
        _ENFORCER = policy.Enforcer(policy_file=policy_file,
                                    rules=rules,
                                    default_rule=default_rule,
                                    use_conf=use_conf)


def check_is_admin(context):
    """Whether or not roles contains 'admin' role according to policy setting.

    """
    init()
    # the target is user-self
    credentials = context.to_dict()
    target = credentials
    return _ENFORCER.enforce('context_is_admin', target, credentials)


def enforce(context, action, target, do_raise=True, exc=None):
    """Verifies that the action is valid on the target in this context.

       :param context: nova context
       :param action: string representing the action to be checked
           this should be colon separated for clarity.
           i.e. ``compute:create_instance``,
           ``compute:attach_volume``,
           ``volume:attach_volume``
       :param target: dictionary representing the object of the action
           for object creation this should be a dictionary representing the
           location of the object e.g. ``{'project_id': context.project_id}``
       :param do_raise: if True (the default), raises PolicyNotAuthorized;
           if False, returns False

       :raises nova.exception.PolicyNotAuthorized: if verification fails
           and do_raise is True.

       :return: returns a non-False value (not necessarily "True") if
           authorized, and the exact value False if not authorized and
           do_raise is False.
    """

    init()
    _ENFORCER.load_rules()

    rule_keys = []
    for key, value in _ENFORCER.rules.items():
        rule_keys.append(key)

    rule = ""
    actions = action.split(':')
    for key in rule_keys:
        keys = key.split(':')
        if len(actions) == len(keys) and actions[0] == keys[0]:
            flag = True
            for i in range(1, len(actions)):
                if keys[i] == '%s' or actions[i] == keys[i]:
                    continue
                else:
                    flag = False
                    break
            if flag:
                rule = key
                break
    if rule == "":
        return False
    try:
        result = _ENFORCER.enforce(rule, target, context,
                                   do_raise=do_raise, exc=exc, action=rule)
    except Exception, e:
        return False
    return result
