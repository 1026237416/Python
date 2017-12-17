#coding=gbk 
'''
Created on 2017年3月22日

@author: li
'''


class Test:
    def __init__(self, size = 10):
        self.size = size
    def getSize(self):
        return self.size
    
    def setSize(self, value):
        self.size = value
        
    def delSize(self):
        del self.size
    
    x = property(getSize, setSize, delSize)
    
test = Test()

print(test.getSize())
print(test.size)
print(test.x)

test.setSize(18)
print(test.size)

test.size = 28
print(test.size)

test.x = 30
print(test.size)