#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: multiprocess_ex5_PIPE.py
    @time: 2018/5/27 13:23
    @desc: 进程间使用管道（PIPE）进行通信
           申请管道之后会产生两个对象，作为管道的两端，分别作为父进程与子进程之间的通信
           * pipe1， pipe2 = multiprocessing.Pipe()
           * pipe1.send(data)
           * pipe2.recv()
           *
"""
from multiprocessing import Process
from multiprocessing import Pipe


def run(conn):
    data = {"From child process": "Hello world"}
    conn.send(data)
    print(conn.recv())
    conn.close()


if __name__ == '__main__':
    parent_pipe, child_pipe = Pipe()
    child_process = Process(target=run, args=(child_pipe, ))
    child_process.start()

    print(parent_pipe.recv())
    parent_pipe.send({"From parent": "Hello child"})
    child_process.join()
