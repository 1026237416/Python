#coding=gbk 
'''
Created on 2017年3月22日

@author: li
'''


class HasAttr():
    def __init__(self, x = 0):
        self.x = x
        
test = HasAttr()

print(hasattr(test, 'x'))
print(hasattr(test, 'y'))
print(getattr(test, 'x'))
print(getattr(test, 'y', "not exist"))
setattr(test, 'y', 'hello')
print(hasattr(test, 'y'))
delattr(test, "y")
print(hasattr(test, 'y'))