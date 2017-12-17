# #!/usr/bin/env python
# # -*- coding: utf-8 -*-
# # @Time    : 2017/8/14 18:48
# # @Author  : liping
# # @File    : process_bar.py
# # @Software: PyCharm
#
# # from __future__ import division
# # import math
# # import sys
# # import time
# #
# #
# # def progressbar(cur, total):
# #     percent = '{:.2%}'.format(cur / total)
# #     sys.stdout.write('\r')
# #     sys.stdout.write('[%-50s] %s' % ('=' * int(math.floor(cur * 50 / total)), percent))
# #     sys.stdout.flush()
# #     if cur == total:
# #         sys.stdout.write('\n')
# #
# #
# # if __name__ == '__main__':
# #     # file_size = 102400000
# #     # size = 1024
# #     # while file_size > 0:
# #     #     progressbar(size * 10 / file_size, 10)
# #     #     file_size -= 1024
# #
# #     sys.stdout.write('******')
# #     # time.sleep(3)
# #     sys.stdout.flush()
#
# # import sys
# #
# #
# # class ProgressBar(object):
# #     def __init__(self, finalcount, block_char='.'):
# #         self.finalcount = finalcount
# #         self.blockcount = 0
# #         self.block = block_char
# #         self.f = sys.stdout
# #         if not self.finalcount:
# #             return
# #         # self.f.write('\n------------------ % Progress -------------------1\n')
# #         # self.f.write('    1    2    3    4    5    6    7    8    9    0\n')
# #         # self.f.write('----0----0----0----0----0----0----0----0----0----0\n')
# #
# #     def progress(self, count):
# #         count = min(count, self.finalcount)
# #         if self.finalcount:
# #             percentcomplete = int(round(100.0 * count / self.finalcount))
# #             if percentcomplete < 1: percentcomplete = 1
# #         else:
# #             percentcomplete = 100
# #         blockcount = int(percentcomplete // 2)
# #         if blockcount <= self.blockcount:
# #             return
# #         for i in range(self.blockcount, blockcount):
# #             self.f.write(self.block)
# #         self.f.flush()
# #         self.blockcount = blockcount
# #         if percentcomplete == 100:
# #             self.f.write("\n")
# #
# #
# # if __name__ == "__main__":
# #     from time import sleep
# #
# #     pb = ProgressBar(8, "*")
# #     for count in range(1, 9):
# #         pb.progress(count)
# #         sleep(0.2)
# #         # pb = progressbar(100)
# #         # pb.progress(20)
# #         # sleep(0.3)
# #         # pb.progress(47)
# #         # sleep(0.3)
# #         # pb.progress(90)
# #         # sleep(0.3)
# #         # pb.progress(100)
# #         # print "testing 1:"
# #         # pb = progressbar(1)
# #         # pb.progress(1)
#
# import sys, time
#
# class ShowProcess():
#     """
#     显示处理进度的类
#     调用该类相关函数即可实现处理进度的显示
#     """
#     i = 1 # 当前的处理进度
#     max_steps = 0 # 总共需要处理的次数
#     max_arrow = 50 #进度条的长度
#
#     # 初始化函数，需要知道总共的处理次数
#     def __init__(self, max_steps):
#         self.max_steps = max_steps
#         self.i = 1
#
#     # 显示函数，根据当前的处理进度i显示进度
#     # 效果为[>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>]100.00%
#     def show_process(self, i=None):
#         if i is not None:
#             self.i = i
#         num_arrow = int(self.i * self.max_arrow / self.max_steps) #计算显示多少个'>'
#         num_line = self.max_arrow - num_arrow #计算显示多少个'-'
#         percent = self.i * 100.0 / self.max_steps #计算完成进度，格式为xx.xx%
#         process_bar = '[' + '>' * num_arrow + '-' * num_line + ']'\
#                       + '%.2f' % percent + '%' + '\r' #带输出的字符串，'\r'表示不换行回到最左边
#         sys.stdout.write(process_bar) #这两句打印字符到终端
#         sys.stdout.flush()
#         self.i += 1
#
#     def close(self, words='done'):
#         print ''
#         print words
#         self.i = 1
#
#
# max_steps = 100
#
# process_bar = ShowProcess(max_steps)
#
# for i in range(max_steps):
#     process_bar.show_process()
#     time.sleep(0.05)
# process_bar.close()

import time
import sys
import os

for i in range(5):
    print(str(i))
    k = os.system('cls')
    time.sleep(1)
