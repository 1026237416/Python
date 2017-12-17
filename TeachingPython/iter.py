#coding=gbk 
'''
Created on 2017年3月23日

@author: li
'''

# import

string = "FishC.com"

for each in string:
    print(each)
print("********************************")

it = iter(string)   
while True:
    try:
        each = next(it)
    except StopIteration:
        break
    print(each)