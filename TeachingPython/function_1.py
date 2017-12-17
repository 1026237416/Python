# -*- coding:utf-8 -*-
'''
Created on 2016年4月11日

@author: liping
'''
def say_hi():
    print("hi!")
    
say_hi()
say_hi()

def print_sum_two(a,b):
    c = a + b
    print(c)
    
print_sum_two(3,5)

def hello_some(str):
    print("Hello " + str + "!")
    
hello_some("china")
hello_some("Python")

def repeat_str(str,times):
    repeat_strs = str * times
    return repeat_strs

repeat_strings = repeat_str("Happy Birthday!", 4)
print(repeat_strings)

x = 60
def foo():
    global x
    print("x is: " + str(x))
    x = 3
    print('change local x to ' + str(x))

foo()
print("x is still ",str(x))

