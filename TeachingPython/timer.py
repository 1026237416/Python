#coding=gbk 
'''
Created on 2017��3��22��

@author: li
'''

import time


class MyTimer():
    def __init__(self):
        self.unit = ['��', '��', '��', 'ʱ', '��', '��']
        self.prompt = "δ��ʼ��ʱ��"
        self.lasted = []
        self.begin = 0
        self.end = 0
        
    def __str__(self):
        return self.prompt
    
    __repr__ = __str__
    
    def __add__(self, other):
        self.prompt = "�ܹ�������"
        result = []
        for index in range(6):
            result.append(self.lasted[index] + other.lasted[index])
            if result[index]:
                self.prompt += (str(result[index]) + self.unit[index])
        return self.prompt
    
    def start(self):
        self.begin = time.localtime()
        self.prompt = "��ʾ����ʱ�ѿ�ʼ�����ȵ��á�stop������ֹͣ��ʱ"
        print("Start timer......")
        
    def stop(self):
        if not self.begin:
            print("��ʾ����ʱδ��ʼ�����ȵ��á�start��������ʼ��ʱ��")
        else:
            self.end = time.localtime()
            self._calc()
            print("Stop timer!")
        
    def _calc(self):
        self.lasted = []
        self.prompt = "Timer running about "
        for index in range(6):
            self.lasted.append(self.end[index] - self.begin[index])
            if self.lasted[index]:
                self.prompt += str(self.lasted[index]) + self.unit[index]
                
        self.begin = 0
        self.end = 0       
