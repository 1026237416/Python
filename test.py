# coding:gbk
'''
Created on 2016��10��21��

@author: li
'''

print("ssss")


def test1():
    ss = "12"
    dd = "33"

    print locals()

test1()


class Test(object):
    def __init__(self):
        self.sd = "dsd"
        self.df = "sfdddsv"
        self.pp = "erfe"
        print "***********"
        print locals()

    def show(self):
        print locals()


T = Test()
T.show()
