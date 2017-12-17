# -*- coding: utf-8 -*-
import inspect
import re
import functools
from ast import literal_eval
from easted.core.exception import RequiredParamNotExist

__author__ = 'yangkefeng@easted.com.cn'
__all__ = ["valid_param",
           "required",
           "accepts"]


class ValidateException(Exception):
    pass


def valid_param(*varargs, **keywords):
    """验证参数的装饰器。"""

    varargs = map(_to_standard_condition, varargs)
    keywords = dict((k, _to_standard_condition(keywords[k])) for k in keywords)

    def generator(func):
        args, vararg_name, kw_name = inspect.getargspec(func)[:3]
        dct_validator = _getcallargs(args, vararg_name, kw_name,
                                     varargs, keywords)

        def wrapper(*call_varargs, **call_keywords):
            dct_call_args = _getcallargs(args, vararg_name, kw_name,
                                         call_varargs, call_keywords)

            k, item = None, None
            try:
                for k in dct_validator:
                    if k == vararg_name:
                        for item in dct_call_args[k]:
                            assert dct_validator[k](item)
                    elif k == kw_name:
                        for item in dct_call_args[k].values():
                            assert dct_validator[k](item)
                    else:
                        item = dct_call_args[k]
                        assert dct_validator[k](item)
            except:
                raise ValidateException, \
                    ('%s() parameter validation fails, param: %s, value: %s(%s)'
                     % (func.func_name, k, item, item.__class__.__name__))

            return func(*call_varargs, **call_keywords)

        wrapper = _wraps(wrapper, func)
        return wrapper

    return generator


def _to_standard_condition(condition):
    """将各种格式的检查条件转换为检查函数"""

    if inspect.isclass(condition):
        return lambda x: isinstance(x, condition)

    if isinstance(condition, (tuple, list)):
        cls, condition = condition[:2]
        if condition is None:
            return _to_standard_condition(cls)

        if cls in (str, unicode) and condition[0] == condition[-1] == '/':
            return lambda x: (isinstance(x, cls)
                              and re.match(condition[1:-1], x) is not None)

        return lambda x: isinstance(x, cls) and literal_eval(condition)

    return condition


def null_ok(cls, condition=None):
    """这个函数指定的检查条件可以接受None值"""

    return lambda x: x is None or _to_standard_condition((cls, condition))(x)


def multi_type(*conditions):
    """这个函数指定的检查条件只需要有一个通过"""
    lst_validator = map(_to_standard_condition, conditions)

    def validate(x):
        for v in lst_validator:
            if v(x):
                return True

    return validate


def _getcallargs(args, vararg_name, kw_name, varargs, keywords):
    """获取调用时的各参数名-值的字典"""

    dct_args = {}
    varargs = tuple(varargs)
    keywords = dict(keywords)

    arg_count = len(args)
    var_count = len(varargs)

    if arg_count <= var_count:
        for n, arg_name in enumerate(args):
            dct_args[arg_name] = varargs[n]

        call_varargs = varargs[-(var_count - arg_count):]

    else:
        for n, var in enumerate(varargs):
            dct_args[args[n]] = var

        for arg_name in args[-(arg_count - var_count):]:
            if arg_name in keywords:
                dct_args[arg_name] = keywords.pop(arg_name)

        call_varargs = ()

    if vararg_name is not None:
        dct_args[vararg_name] = call_varargs

    if kw_name is not None:
        dct_args[kw_name] = keywords

    dct_args.update(keywords)
    return dct_args


def _wraps(wrapper, wrapped):
    """复制元数据"""

    for attr in ('__module__', '__name__', '__doc__'):
        setattr(wrapper, attr, getattr(wrapped, attr))
    for attr in ('__dict__',):
        getattr(wrapper, attr).update(getattr(wrapped, attr, {}))

    return wrapper


def accepts(**types):
    def check_accepts(func):
        assert len(types) == func.func_code.co_argcount, \
            'accept number of arguments not equal with function number of arguments in "%s"' \
            % func.func_name

        @functools.wraps(func)
        def check_params(*args, **kwargs):
            for i, v in enumerate(args):
                if func.func_code.co_varnames[i] in types.iterkeys() \
                        and not isinstance(v, types[func.func_code.co_varnames[i]]):
                    raise TypeError("arg '%s'=%r does not match %s"
                                    % (func.func_code.co_varnames[i], v,
                                       types[func.func_code.co_varnames[i]]))
                del types[func.func_code.co_varnames[i]]
            for k, v in kwargs.iteritems():
                if k in types.iterkeys() and not isinstance(v, types[k]):
                    raise TypeError("arg '%s'=%r does not match %s"
                                    % (k, v, types[k]))
            return func(*args, **kwargs)

        check_params.func_name = func.func_name
        return check_params

    return check_accepts


def required(*required_params):
    """ decorate check required params
    :param required_params: the required params of func
    """

    def check_required(func):
        @functools.wraps(func)
        def check_params(*args, **kwargs):
            miss_required_params = list(required_params)
            if miss_required_params:
                for i, v in enumerate(args):
                    if func.func_code.co_varnames[i] in required_params:
                        if v:
                            miss_required_params.remove(func.func_code.co_varnames[i])
                        else:
                            raise RequiredParamNotExist(args=[v])
                for k, v in kwargs.iteritems():
                    if k in required_params:
                        if v:
                            miss_required_params.remove(k)
                        else:
                            raise RequiredParamNotExist(args=[k])

            return func(*args, **kwargs)

        return check_params

    return check_required


@required("a")
def test(a, b=None, c=None):
    """

    :param a:
    :param b:
    :param c:
    :return:
    """
    print 'ok'


@accepts(a=int, b=str, c=(list, tuple))
def test1(a, b=None, c=None):
    """

    :param a:
    :param b:
    :param c:
    :return:
    """
    print 'ok'


if __name__ == "__main__":
    test(a=2, b=1, c="2")
    test1(a="1", c=[], b='df')
