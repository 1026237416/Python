#coding: gbk
# 《Python Cookbook》第三章测试题目，以下章节不做要求：
#    3.5计算日期之间的工作日 116 
#    3.6自动查询节日 118 
#    3.8检查夏令时是否正在实行 123 
#    3.9时区转换 124 
#    3.13将十进制数用于货币处理 130 
#    3.14用Python实现的简单加法器 133 
#    3.15检查信用卡校验和 136 
#    3.16查看汇率 137 
#
from shangjie.conf import settings
settings.register( 'oaconf' )
from nose.tools import *
import calendar
import datetime
def get_yc_ym( day ):
    # 根据传入的日期，获取其所在月份的月初、月末
    pass

def get_jc_jm( day ):
    # 根据传入的日期，获取其所在季度的季初、季末
    pass     

def get_weekday( day ):
    # 根据传入的日期，获取当前是周几
    pass

def days_between( begin, end ):
    # 根据传入的起止日期计算这两个日期之间相差几天
    pass

def during( t, days=0, hours=0, minutes=0, seconds=0 ):
    """ 根据起始时间和持续时间，计算截止时间
        @param t        起始时间
        @param days     持续的天
        @param hours    持续的小时
        @param minutes  持续的分钟
        @param secodes  持续的秒
    """
    pass

def format( date ):
    # 将输入参数date转换为datetime.date类型返回。不要使用三方库dateutil
    pass    

	
def sched():
    """ 定时任务
    每十分钟扫描一次某目录的所有文件，输出到一个txt文件中(提示：DOS的tree命令)，文件名命名格式为YYYYMMDDHHMISS，保存到本程序的路径下
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
    eq_( get_weekday( datetime.date(2011, 3, 21) ), '周一' )
    eq_( get_weekday( datetime.date(2011, 3, 22) ), '周二' )
    eq_( get_weekday( datetime.date(2011, 3, 23) ), '周三' )
    eq_( get_weekday( datetime.date(2011, 3, 24) ), '周四' )
    eq_( get_weekday( datetime.date(2011, 3, 25) ), '周五' )
    eq_( get_weekday( datetime.date(2011, 3, 26) ), '周六' )
    eq_( get_weekday( datetime.date(2011, 3, 27) ), '周日' )

def test_weeks_between():
    eq_( days_between( datetime.date(2011, 2, 1), datetime.date(2011, 3, 1) ), 28 ) # 二月份天数
    eq_( days_between( datetime.date(2011, 1, 1), datetime.date(2011, 4, 1) ), 90 ) # 一季度天数
    eq_( days_between( datetime.date(2000, 1, 1), datetime.date(2000, 4, 1) ), 91 ) # 一季度天数
    eq_( days_between( datetime.date(2011, 2, 1), datetime.date(2011, 2, 1) ), 0 ) # 当天
    eq_( days_between( datetime.date(2011, 4, 1), datetime.date(2011, 1, 1) ), '请确保开始日期早于结束日期' ) # 异常输入

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
    eq_( format( '20110327' ), '无法识别的日期格式' )

