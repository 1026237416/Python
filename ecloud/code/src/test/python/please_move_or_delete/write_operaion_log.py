# -*- coding: utf-8 -*-
__author__ = 'Jim Xu'
from easted.core import config
import random
import time
config.CONF(default_config_files=['/jm/easted/ecloud/trunk/src/main/etc/ecloud.conf'])

import easted.core.log as log

log.init()
sl_time=[1,2,3]
user=['rose', 'xujun', 'jim', 'menny', 'kris']
role=['sys_admin', 'sec_admin', 'audit_admin']
typ=['host', 'disk', 'net', 'project', 'order', 'secure', 'user', 'global_argument']
host_op=['start', 'delete', 'edit']
disk_op=['mount', 'umount', 'delete', 'edit']
user_op=['change_role', 'change_level', 'delete', 'edit']
project_op=['set_ip', 'set_host', 'delete', 'edit']
order_op=['order_accept', 'order_reject']
net_op=['delete_net', 'edit_net', 'change_quota', 'set_net', 'set_user']
gl_op=['edit']
secure_op=[]
comment=['', 'success', 'failed']
while True:
    u = user[random.randint(0,4)]
    if u == 'rose' or u == 'xujun':
        r = 'sys_admin'
    elif u == 'jim' or u == 'menny':
        r = 'sec_admin'
    else:
        r = 'sec_amdin'

    t = typ[random.randint(0,7)]
    if t == 'host':
        op = host_op[random.randint(0,2)]
        o='host1'
    elif t == 'disk':
        op = disk_op[random.randint(0,3)]
        o='disk1'
    elif t == 'user':
        op = user_op[random.randint(0,3)]
        o='user1'
    elif t == 'project':
        op = project_op[random.randint(0,3)]
        o='project1'
    elif t == 'net':
        op = net_op[random.randint(0,4)]
        o = 'net1'
    #elif t == 'secure':
    #    op = secure_op[random.randint(0,2)]
    elif t == 'order':
        op = order_op[random.randint(0,1)]
        o='order1'
    else:
        op = 'edit'
        o='edit1'
    c = comment[random.randint(0,2)]
    log.write_operation_log(u, r, t, o, op, c)
    time.sleep(sl_time[random.randint(0,2)])
