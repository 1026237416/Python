# -*- coding:utf-8 -*-
'''
Created on 2016-3-29

@author: mu
'''

#创建tuple

number_tuple = [1, 2, 3, 4, 5, 6]
print("number_tuple:" + str(number_tuple))

String_tuple = ["abc", "bbc", "ccc"]
print("String_tuple:" + str(String_tuple))

mixed_tuple = ["python", "Java", 1, 2]
print(" mixed_tuple:" + str(mixed_tuple))

second_num = number_tuple[1]
third_string = String_tuple[2]
fourth_mixed = mixed_tuple[3]

print("second_num :{0} third_string : {1} fourth_mixed : {2}".format(second_num, third_string, fourth_mixed))

print(len((1, 2, 3)))
print((1, 2, 3) + (4, 5, 6))
print(('Hello') * 4)
print(3 in (1, 2, 3))

abcd_list = ('a', 'b', 'c', 'd')
print(abcd_list[1])
print(abcd_list[-2])
print(abcd_list[1:])