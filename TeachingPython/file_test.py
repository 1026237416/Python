#!/usr/bin/env python
# -*- coding:utf-8 -*-
'''
Created on 2017��3��27��

@author: li
'''

my_str = []

file_obj = file('file_test.txt', 'r+')

for line in file_obj.readlines():
    value_list = line.strip().split(';')
    
    value_list[-1] = str(int(value_list[-1]) + 1)
    print(value_list)
    
    my_str.append(';'.join(value_list))
    
my_str = '\n'.join(my_str)
   
file_obj.write(my_str)

file_obj.close()