#!/usr/bin/env python
# -*- coding: utf-8 -*-


import sys
import subprocess


def run(cmd):
    """run an command line and execute in progress.

    :param cmd: command line to execute
    :return: 0 for success, other for errors.
    """
    print "Executing cmd: %s..." % cmd
    ret = subprocess.call(cmd, shell=True)
    if ret != 0:
        sys.exit('Exec cmd %s error, return value: %s' % (cmd, str(ret)))
