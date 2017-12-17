#coding=gbk 
'''
Created on 2017年3月22日

@author: li
'''
class A:
    pass

class B(A):
    pass

print(issubclass(A, B))
print(issubclass(B, A))
print(issubclass(B, object))
print(issubclass(A, object))