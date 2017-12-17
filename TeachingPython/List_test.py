# -*- coding:utf-8 -*-
'''
Created on 2016-3-29

@author: mu
'''
print("你好")

print("What's your name? \nTome")

#创建list

number_list = [1, 2, 3, 4, 5, 6]
print("number_list:" + str(number_list))

String_list = ["abc", "bbc", "ccc"]
print("String_list:" + str(String_list))

mixed_list = ["python", "Java", 1, 2]
print(" mixed_list:" + str(mixed_list))

second_num = number_list[1]
third_string = String_list[2]
fourth_mixed = mixed_list[3]

print("second_num :{0} third_string : {1} fourth_mixed : {2}".format(second_num, third_string, fourth_mixed))

print(len([1, 2, 3]))
print([1, 2, 3] + [4, 5, 6])
print(['Hello'] * 4)
print(3 in [1, 2, 3])

abcd_list = ['a', 'b', 'c', 'd']
print(abcd_list[1])
print(abcd_list[-2])
print(abcd_list[1:])