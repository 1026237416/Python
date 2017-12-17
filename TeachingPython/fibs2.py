#coding=gbk 
'''
Created on 2017年3月23日

@author: li
'''
def fibs2():
    a = 0
    b = 1
    while True:
        a, b = b, a + b
        yield a
        
for each in fibs2():
    if each > 100:
        break
    print(each)
    
a = [i for i in range(100) if not (i % 2) and i % 3]
print(a)

b = {i:i % 2 == 0 for i in range(10)}
print(b)

c = {i for i in [1, 2, 1, 5, 5, 3, 4, 1, 3, 6]}
print(c)