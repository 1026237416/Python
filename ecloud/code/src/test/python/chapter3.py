#coding: gbk
# ��Python Cookbook�������²�����Ŀ�������½ڲ���Ҫ��
#    3.5��������֮��Ĺ����� 116 
#    3.6�Զ���ѯ���� 118 
#    3.8�������ʱ�Ƿ�����ʵ�� 123 
#    3.9ʱ��ת�� 124 
#    3.13��ʮ���������ڻ��Ҵ��� 130 
#    3.14��Pythonʵ�ֵļ򵥼ӷ��� 133 
#    3.15������ÿ�У��� 136 
#    3.16�鿴���� 137 
#
from shangjie.conf import settings
settings.register( 'oaconf' )
from nose.tools import *
import calendar
import datetime
def get_yc_ym( day ):
    # ���ݴ�������ڣ���ȡ�������·ݵ��³�����ĩ
    pass

def get_jc_jm( day ):
    # ���ݴ�������ڣ���ȡ�����ڼ��ȵļ�������ĩ
    pass     

def get_weekday( day ):
    # ���ݴ�������ڣ���ȡ��ǰ���ܼ�
    pass

def days_between( begin, end ):
    # ���ݴ������ֹ���ڼ�������������֮������
    pass

def during( t, days=0, hours=0, minutes=0, seconds=0 ):
    """ ������ʼʱ��ͳ���ʱ�䣬�����ֹʱ��
        @param t        ��ʼʱ��
        @param days     ��������
        @param hours    ������Сʱ
        @param minutes  �����ķ���
        @param secodes  ��������
    """
    pass

def format( date ):
    # ���������dateת��Ϊdatetime.date���ͷ��ء���Ҫʹ��������dateutil
    pass    

	
def sched():
    """ ��ʱ����
    ÿʮ����ɨ��һ��ĳĿ¼�������ļ��������һ��txt�ļ���(��ʾ��DOS��tree����)���ļ���������ʽΪYYYYMMDDHHMISS�����浽�������·����
    """
    pass
		
# ----------------------------------------------------------
def test_get_yc_ym():
    eq_( get_yc_ym( datetime.date(2011, 3, 28) ), ( datetime.date(2011, 3, 1), datetime.date(2011, 3, 31) ) )
    eq_( get_yc_ym( datetime.date(2011, 2, 1) ), ( datetime.date(2011, 2, 1), datetime.date(2011, 2, 28) ) )
    eq_( get_yc_ym( datetime.date(2012, 2, 1) ), ( datetime.date(2012, 2, 1), datetime.date(2012, 2, 29) ) )
    eq_( get_yc_ym( datetime.date(2011, 12, 31) ), ( datetime.date(2011, 12, 1), datetime.date(2011, 12, 31) ) )

def test_get_jc_jm():
    eq_( get_jc_jm( datetime.date(2011, 3, 28) ), ( datetime.date(2011, 1, 1), datetime.date(2011, 3, 31) ) )
    eq_( get_jc_jm( datetime.date(2011, 4, 1) ), ( datetime.date(2011, 4, 1), datetime.date(2011, 6, 30) ) )
    eq_( get_jc_jm( datetime.date(2011, 8, 30) ), ( datetime.date(2011, 7, 1), datetime.date(2011, 9, 30) ) )
    eq_( get_jc_jm( datetime.date(2011, 12, 1) ), ( datetime.date(2011, 10, 1), datetime.date(2011, 12, 31) ) )

def test_get_weekday():
    eq_( get_weekday( datetime.date(2011, 3, 21) ), '��һ' )
    eq_( get_weekday( datetime.date(2011, 3, 22) ), '�ܶ�' )
    eq_( get_weekday( datetime.date(2011, 3, 23) ), '����' )
    eq_( get_weekday( datetime.date(2011, 3, 24) ), '����' )
    eq_( get_weekday( datetime.date(2011, 3, 25) ), '����' )
    eq_( get_weekday( datetime.date(2011, 3, 26) ), '����' )
    eq_( get_weekday( datetime.date(2011, 3, 27) ), '����' )

def test_weeks_between():
    eq_( days_between( datetime.date(2011, 2, 1), datetime.date(2011, 3, 1) ), 28 ) # ���·�����
    eq_( days_between( datetime.date(2011, 1, 1), datetime.date(2011, 4, 1) ), 90 ) # һ��������
    eq_( days_between( datetime.date(2000, 1, 1), datetime.date(2000, 4, 1) ), 91 ) # һ��������
    eq_( days_between( datetime.date(2011, 2, 1), datetime.date(2011, 2, 1) ), 0 ) # ����
    eq_( days_between( datetime.date(2011, 4, 1), datetime.date(2011, 1, 1) ), '��ȷ����ʼ�������ڽ�������' ) # �쳣����

def test_during():
    t = datetime.datetime( 2011, 3, 28, 17, 30, 0 )
    eq_( during( t ), t )
    eq_( during( t, days=1 ), datetime.datetime( 2011, 3, 29, 17, 30, 0 ) )
    eq_( during( t, days=1, hours=7 ), datetime.datetime( 2011, 3, 30, 0, 30, 0 ) )
    eq_( during( t, days=1, hours=7, minutes=-31 ), datetime.datetime( 2011, 3, 29, 23, 59, 0 ) )
    eq_( during( t, days=1, hours=7, minutes=-31, seconds=60 ), datetime.datetime( 2011, 3, 30, 0, 0, 0 ) )

def test_format():
    eq_( format( '2011-03-27' ), datetime.date(2011, 3, 27) ) # YYYY-MM-DD
    eq_( format( '27-3-2011' ), datetime.date(2011, 3, 27) ) # DD-MM-YYYY
    eq_( format( '3-27-2011' ), datetime.date(2011, 3, 27) ) # MM-DD-YYYY
    eq_( format( '2011/3/27' ), datetime.date(2011, 3, 27) ) # YYYY/MM/DD
    eq_( format( '3/27/2011' ), datetime.date(2011, 3, 27) ) # DD/MM/YYYY
    eq_( format( '27/03/2011' ), datetime.date(2011, 3, 27) ) # MM/DD/YYYY
    eq_( format( '20110327' ), '�޷�ʶ������ڸ�ʽ' )

