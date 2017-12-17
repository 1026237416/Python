#coding=gbk 
'''
Created on 2017年3月22日

@author: li
'''

class Rectangle():
    def __init__(self, x, y):
        self.x = x
        self.y = y
    
    def setPeri(self):
        return ((self.x + self.y) * 2)
    
    def getArea(self):
        return (self.x * self.y)
    
rect = Rectangle(3, 7)
print(rect.getArea())