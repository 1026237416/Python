# -*- coding:utf-8 -*-
'''
Created on 2016年4月13日

@author: liping
'''
number = 59
guess_flag = False

while guess_flag == False:
    guess = int(input('enter an integer:'))
    if guess == number:
        guess_flag = True
    elif guess < number:
        print('no,the number is higher than that,keep guessing')
    else:
        print('no,the number is lower than that,keep guessing')
        
print("Bingo! you guess it right.")
print('(but you do not win any prizes)')
print('Done')