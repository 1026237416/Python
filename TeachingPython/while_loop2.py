# -*- coding:utf-8 -*-
'''
Created on 2016��4��13��

@author: liping
'''

number = 55
number_chances = 3
print('you have only 3 chances to guess')

for i in range(1,number_chances + 1):
    print("chance "+str(i))
    guess = int(input('enter n number:'))
    
    if guess == number:
        print("Bingo! you guess it right.")
        print('(but you do not win any prizes)')
        break
    elif guess < number:
        print('no,the number is higher than that,keep guessing,you have ' + str(number_chances - i) + 'chance lift.')
    else:
        print('no,the number is lower than that,keep guessing,you have ' + str(number_chances - i) + 'chance lift.')
        
print('Done')