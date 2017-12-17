#coding=gbk 
'''
Created on 2017年3月22日

@author: li
'''

class MyDecriptor:
    def __get__(self, instance, owner):
        print("getting......", self, instance, owner)
    
    def __set__(self, instance, value):
        print("setting......", self, instance, value)
        
    def __delete__(self, instance):
        print("deleting......", instance)
        
class Test:
    x = MyDecriptor()
    
test = Test()
test