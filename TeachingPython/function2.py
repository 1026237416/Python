# -*- coding:utf-8 -*-
'''
Created on 2016��4��12��

@author: liping
'''
def repeat_str(s, times = 1):
    repeated_strs = s * times
    return repeated_strs
repeated_strings = repeat_str("Happy Brithday!")
print(repeated_strings)

repeated_strings = repeat_str("Happy Brithday!", 4)
print(repeated_strings)

def func(a, b = 4, c = 8):
    print('a is ', a, 'and b is ', b, 'and c is ',c)
    
func(13, 17)
func(125, c= 60)
func(c = 50, a = 51)

def print_pares(fpara, *nums, **words):
    print("fpara:" + str(fpara))
    print("nums:" + str(nums))
    print("words:" + str(words))
    
print_pares("hello", 5, 4, 5, 214, 22, word = "python", aa= "cc")