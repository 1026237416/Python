# coding: gbk
# 《Python Cookbook》第四章测试题目，以下章节不做要求：
#    4.18　搜集命名的子项 169 
#    4.19　用一条语句完成赋值和测试 171 
#    4.20　在Python中使用printf 174 
#    4.22　在表达式中处理异常 176 
#    4.23　确保名字已经在给定模块中被定义 178 
from nose.tools import *

import copy


def func_copy(obj):
    # 拷贝复杂对象
    pass


def list_comprehensions(seq):
    # 对序列seq的元素进行处理
    b = ''.join(map(str, seq))
    u = []
    for i in b:
        if i.isdigit():
            u.append(int(i) * 10)
        else:
            u.append(i)
    return u


def get_value_from_index(seq, index):
    try :
        p = seq[index]
        print p
    except:
        print '非法的下标'


def cycle(seq):
    for i in range(len(seq)):
        print seq[i], '', i


def multidimensional(col, row, default):
    p = []
    m = []
    for i in range(col):
        p.append(m)
    for y in range(row):
        m.append(default)
    print p


def expand(seq):
    # 不许允使用for
    pass


def sort(seq):
    l = []
    for i in seq:
        j = sorted(i, reverse=True)
        l.append(j)
    print l


def transposing(seq):
    q = []
    w = []
    e = []
    y = []
    for i in seq:
        q.append(i[0])
        w.append(i[1])
        e.append(i[2])
    y.append(q)
    y.append(w)
    y.append(e)
    print y


def revert(d):
    dict((value, key) for key, value in d.iteritems())


def create_dict(seq):
    i = range(0, 20, 5)
    p = {}
    k = 1
    t = 5
    for j in i:
        p[j] = range(k, t)
        k = k + 5
        t = t + 5
    print p


def subset(d, ks, default=None):
    pass


def union_intersection(d1, d2, type):
    pass


# ----------------------------------------------------------
def test_func_copy():
    class A:
        def __init__(self):
            self.name = 'A'
            self.age = 30
            self.sex = 'M'

    a = A()
    b = func_copy(a)
    eq_(b.name == 'A', True)
    eq_(b.age == 30, True)
    eq_(b.sex == 'M', True)
    eq_(id(a) != id(b), True)

    lst1 = [{1: ['a', 'b', 'c']}, {2: ['d', 'e', 'f']}, {3: ['g', 'h', 'i']}]
    lst2 = func_copy(lst1)
    eq_(lst1 == lst2, True)
    lst1[0][1][0] = 'abc'
    eq_(lst2[0][1][0] == 'a', True)


def test_list_comprehensions():
    lst1 = [1, 2, 'a', 3, 'b']
    eq_(list_comprehensions(lst1), [10, 20, 'a', 30, 'b'])


def test_get_value_from_index():
    eq_(get_value_from_index([1, 2, 3], 0), 1)
    eq_(get_value_from_index([1, 2, 3], 3), '非法的下标')
    eq_(get_value_from_index([1, 2, 3], -1), 3)
    eq_(get_value_from_index([1, 2, 3], -3), 1)


def test_cycle():
    s = """a 0
           b 1
           c 2"""
    eq_(cycle(['a', 'b', 'c']), s)


#
def test_multidimensional():
    lst = multidimensional(3, 3, 'a')
    eq_(lst, [['a', 'a', 'a'], ['a', 'a', 'a'], ['a', 'a', 'a']])
    lst[1][1] = 'b'
    eq_(lst, [['a', 'a', 'a'], ['a', 'b', 'a'], ['a', 'a', 'a']])


#
def test_expand():
    eq_(expand([['a', 'b', 'c'], ['d'], ['e', 'f']]), ['a', 'b', 'c', 'd', 'e', 'f'])


#
def test_sort():
    lst = [[1, 2], [3, 4], [5, 6]]
    eq_(sort(lst), [[2, 1], [4, 3], [6, 5]])


#
def test_transposing():
    lst = [['张三', '男', 32], ['李四', '女', 23], ['王五', '男', 28]]
    eq_(transposing(lst), [['张三', '李四', '王五'], ['男', '女', '男'], [32, 23, 28]])


#
def test_revert():
    d = {'a': 1, 'b': 2, 'c': 3}
    eq_(revert(d), {1: 'a', 2: 'b', 3: 'c'})


#
def test_create_dict():
    lst = range(20)
    eq_(create_dict(lst), {0: [1, 2, 3, 4], 10: [11, 12, 13, 14], 5: [6, 7, 8, 9], 15: [16, 17, 18, 19]})
    i = range(0, 20, 5)
    p = {}
    k = 1
    t = 5
    for j in i:
        p[j] = range(k, t)
        k = k + 5
        t = t + 5
    print p


#
def test_subset():
    d = {0: [1, 2, 3, 4], 5: [6, 7, 8, 9], 10: [11, 12, 13, 14], 15: [16, 17, 18, 19]}
    eq_(subset(d, [5, 10]), {10: [11, 12, 13, 14], 5: [6, 7, 8, 9]})
    eq_(subset(d, [1, 2]), {1: None, 2: None})


#
def test_union_intersection():
    d1 = {1: 'a', 2: 'b', 3: 'c'}
    d2 = {2: '2', 3: '3', 4: '4'}
    eq_(union_intersection(d1, d2, 'union'), {1: None, 2: None, 3: None, 4: None})
    eq_(union_intersection(d1, d2, 'intersection'), {2: None, 3: None})
