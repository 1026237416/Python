#coding=utf-8
#!/usr/bin/python
__author__ = 'tao'
class Parent:        # 定义父类
   parentAttr = 100
   def __init__(self):

      print "Parent init"

   def parentMethod(self):
      print 'Parent method'

   def setAttr(self, attr):
      Parent.parentAttr = attr

   def getAttr(self):
      print "Parent attr :", Parent.parentAttr

class Child(Parent): # 定义子类
   def __init__(self):
      print "Child init"

   def childMethod(self):
      print 'childMethod'
if __name__ == '__main__':
   c = Child()          # 实例化子类
   c.childMethod()      # 调用子类的方法
   c.parentMethod()     # 调用父类方法
   c.setAttr(200)       # 再次调用父类的方法
   c.getAttr()          # 再次调用父类的方法