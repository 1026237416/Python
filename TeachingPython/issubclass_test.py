#coding=gbk 
'''
Created on 2017��3��22��

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