#coding=gbk 
'''
Created on 2017年3月22日

@author: li
'''

class A:
    pass

class B(A):
    pass

a = A()
b = B()

print(isinstance(a, A))
print(isinstance(a, B))
print(isinstance(b, B))
print(isinstance(b, A))