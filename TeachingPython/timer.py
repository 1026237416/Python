#coding=gbk 
'''
Created on 2017年3月22日

@author: li
'''

import time


class MyTimer():
    def __init__(self):
        self.unit = ['年', '月', '天', '时', '分', '秒']
        self.prompt = "未开始计时！"
        self.lasted = []
        self.begin = 0
        self.end = 0
        
    def __str__(self):
        return self.prompt
    
    __repr__ = __str__
    
    def __add__(self, other):
        self.prompt = "总共运行了"
        result = []
        for index in range(6):
            result.append(self.lasted[index] + other.lasted[index])
            if result[index]:
                self.prompt += (str(result[index]) + self.unit[index])
        return self.prompt
    
    def start(self):
        self.begin = time.localtime()
        self.prompt = "提示：计时已开始，请先调用‘stop（）’停止计时"
        print("Start timer......")
        
    def stop(self):
        if not self.begin:
            print("提示：计时未开始，请先调用‘start（）’开始计时！")
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
