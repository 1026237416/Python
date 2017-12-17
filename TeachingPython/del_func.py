#coding=gbk 
'''
Created on 2017年3月22日

@author: li
'''

class C():
    def __init__(self):
        print("I'm '__init__' function")
    
    def __del__(self):
        print("I'm '__del__' function")

print("**************")        
c1 = C()
print("**************")
c2 = c1
print("**************")
c3 = c2
print("**************")
del c3
print("**************")
del c2
print("**************")
del c1
print("**************")
c4 = C()
print("**************")