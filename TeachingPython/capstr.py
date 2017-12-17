#coding=gbk 
'''
Created on 2017年3月22日

@author: li
'''

class CapStr(str):
    def __new__(cls, string):
        string = string.upper()
        return str.__new__(cls, string)
    
var = CapStr("asdcASXBvhgHBHDHH")
print(var)