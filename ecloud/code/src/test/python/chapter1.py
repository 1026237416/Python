# coding:gbk
# """
# ��Python Cookbook����һ�£������½ڲ���Ҫ��
#    1.9�����ַ�����translate������ʹ��
#    1.10�������ַ����в�����ָ�����ϵ��ַ�
#    1.11�����һ���ַ������ı����Ƕ�����
#    1.15����չ��ѹ���Ʊ��
#    1.17���滻�ַ����е��Ӵ�
#    1.22���ڱ�׼����д�ӡUnicode�ַ�
#    1.23����Unicode���ݱ��벢����XML��HTML
#    1.25����HTML�ĵ�ת��Ϊ�ı���ʾ��UNIX�ն���
# """
from nose.tools import *


def translate(s):
    """ ��Ӣ����ĸת�ɶ�Ӧ��ASCII���� """
    if s.isalpha():
        i = map(ord, s)
        b = ''.join(map(str, i))
        print b
    else:
        print '����ֻ����Ӣ����ĸ'


def hierarchy(inst, cls):
    """ �ж�������ϵ�ļ̳й�ϵ """
    if isinstance(inst, cls):
        return True
    else:
        return False


def align(s, length):
    """ �������str��ָ���ĳ��Ⱦ�����ʾ """
    pass


def format(s):
    """ ���������sǰ��������ַ�ȥ�� """
    a = s.replace('1', '')
    b = a.replace('2', '')
    c = b.replace('3', '')
    d = c.replace('4', '')
    e = d.replace('5', '')
    f = e.replace('6', '')
    g = f.replace('7', '')
    h = g.replace('8', '')
    i = h.replace('9', '')
    j = i.replace('0', '')
    k = j.strip()
    print k


def format2(s, sep):
    """ sΪԴ�����ָ���sepȥ�����������s���� """
    i = s.replace(sep, '')
    p = i.replace(' ', '')
    print p


def gencharacter():
    """ һ�д��뷴������26��Ӣ����ĸ """
    'abcdefghijklmnopqrstuvwxyz'[::-1]


def handle(s, sep):
    """ ���������s��ָ�������ӷ�sep��������  """
    r = s[::-1]
    p = ''
    for i in r:
        p = p + i + sep
    p = p[:-1]
    print p


def contains(s, items):
    """ sΪԴ����items��ÿһ�������s�У��򷵻�True��items��ֻҪ��һ�������s�У��ͷ���False """
    for item in items:
        if item not in s:
            return False
    return True


def case(s):
    """ ������������Ҫ�󣬽�s���д�Сд��ת�� """
    p = s.title()
    print p


def rep(s, d):
    """ sΪԴ��dΪ�滻�ֵ䣬��s�г�����d�е�key�滻Ϊvalue """
    p = s.split()
    w = ''
    for i in p:
        w += d[i] + ' '  ##  w += ''.join(d[i]) + ' '
    m = w.strip()
    print m


def search(s):
    """ sΪԴ�����ݲ�����������ʾ������s��ָ���У�����ȥ���ظ��Ľ����ע������ """
    pass


# ----------------------------------------------------------
def test_translate():
    eq_(translate('abc'), '979899')
    eq_(translate('12abc'), '����ֻ����Ӣ����ĸ')


def test_hierarchy():
    class A(object): pass

    class B(object): pass

    class C(A): pass

    eq_(hierarchy(A(), A), True)
    eq_(hierarchy(A(), B), False)
    eq_(hierarchy(C(), A), True)


def test_align():
    s1 = """
		*
		***
		*****
		***
		*
		"""
    s2 = """
		  *  
		 *** 
		*****
		 *** 
		  *  
		  """
    eq_(align(s1, 6), s2)


def test_format():
    eq_(format('123only letters321'), 'only letters')
    eq_(format('987 only letters654'), 'only letters')
    eq_(format(' 432   only letters  123 '), 'only letters')


def test_format2():
    eq_(format2('a b   c d     e', ' '), 'abcde')
    eq_(format2('a,b  , c ,   d,e', ','), 'abcde')


s = 'a b   c d     e'
s.strip()


def test_gencharacter():
    eq_(gencharacter(), 'zyxwvutsrqponmlkjihgfedcba')


def test_handle():
    eq_(handle('12345', '+'), '5+4+3+2+1')
    eq_(handle('abcde', '_'), 'e_d_c_b_a')


def test_contains():
    eq_(contains('This is a Simple Example Statement', ('is', 'Statement', 'a')), True)
    eq_(contains('This is a Simple Example Statement', ('is', 'Statement', 'a', 'an')), False)


def test_case():
    s = '''cmp( x, y)
compare the two objects x and y and return an integer according to the outcome. the return value is negative if x < y, zero if x == y and strictly positive if x > y.'''
    s2 = """Cmp( X, Y)
Compare The Two Objects X And Y And Return An Integer According To The Outcome. The Return Value Is Negative If X < Y, Zero If X == Y And Strictly Positive If X > Y."""
    eq_(case(s), s2)


def test_rep():
    d = {
        'one': 'һ',
        'two': '��',
        'three': '��',
    }
    eq_(rep('one two three', d), 'һ �� ��')


def test_search():
    s = """
		1|1048230100002752|05|2011-01-29T12:53:18|2011-01-29|1|ǩԼ����|01
		2|1048230100002753|03|2011-01-29 11:26:31||1|�û�ǩԼ|01
		3|1048230100002754|03|2011-01-29 11:28:48||1|�ӿ�|01
		4|1048230100002752|03|2011-01-28 17:05:24|2011-01-29|1|�û�ǩԼ|01
		31|1048230100002753|04|2011-02-22T10:20:01||1|�ѷ��͸���|01
		32|1048230100002754|04|2011-02-22T10:20:01||1|�ѷ��͸���|01#
		27|1048230100002753|04|2011-02-20T20:58:17||1|�ѷ��͸���|01
		28|1048230100002754|04|2011-02-20T20:58:17||1|�ѷ��͸���|01
		29|1048230100002753|04|2011-02-21T17:30:01||1|�ѷ��͸���|01
		30|1048230100002754|04|2011-02-21T17:30:01||1|�ѷ��͸���|01
		33|1048230100002753|04|2011-02-23T10:50:01||1|�ѷ��͸���|01
		34|1048230100002754|04|2011-02-23T10:50:01||1|�ѷ��͸���|01
		"""
    result = [
        '1048230100002754',
        '1048230100002753',
        '1048230100002752',
    ]
    eq_(search(s), result)


a = [{
    "nianji": "һ�꼶",
    "fuzeren": "",
    "banji": [
        {
            "name": "һ��",
            "num": 30,
            "students": [
                {
                    "name": "",
                    "age": 14
                }
            ]
        }
    ]
}]
for i in a:
    grade = i["nianji"]
    fuzenren = i["fuzeren"]
    banji = i["banji"]
    for j in banji:
        banjiming = j["name"]
        num = j["num"]
        student = j["students"]
        for k in student:
            name = k["name"]
            age = k["age"]
            if age > 18:
                print name, banjiming, grade

c = {
    "a": {
        "b": ""
    }
}

j = c["a"]["b"]