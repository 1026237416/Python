# -*- coding: utf-8 -*-
import re
import subprocess

__author__ = 'litao@easted.com.cn'

lifeline = re.compile(r"(\d) received")
report = ("No response", "Partial Response", "Alive")

__all__ = ['ping']


def ping(ip):
    pingaling = subprocess.Popen(["ping", "-q", "-c 2", "-r", ip],
                                 shell=False,
                                 stdin=subprocess.PIPE,
                                 stdout=subprocess.PIPE)
    while 1:
        pingaling.stdout.flush()
        line = pingaling.stdout.readline()

        if not line:
            break
        igot = re.findall(lifeline, line)
        if igot:
            return report[int(igot[0])]
