# -*- coding:utf-8 -*-
"""
Created on 2016年4月18日

@author: liping
"""


class Student:
    def __init__(self, name, grade):
        self.name = name
        self.grade = grade

    def introduce(self):
        print("hi! I'm " + self.name)
        print("my grade is:" + str(self.grade))

    def improve(self, amount):
        self.grade = self.grade + amount


jim = Student("jim", 86)
jim.introduce()

jim.improve(10)
jim.introduce()
