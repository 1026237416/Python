#!/usr/bin/env python 
# -*- coding: utf-8 -*- 
# filename: fib.py

import itertools

def fib():
    first=0
    second=1
    yield first
    yield second

    while 1:
        next=first+second
        yield next
        first=second
        second=next
    
print list(itertools.islice(fib(), 10))

for (i, num) in zip(range(10),fib()):
    print num
    
def fib1():
    first, second=0, 1
    while 1:
        yield second
        first, second= second, first+second
        
for (i, num) in zip(range(10),fib1()):
    print num