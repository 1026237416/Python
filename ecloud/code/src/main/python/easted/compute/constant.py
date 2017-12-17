# -*- coding: utf-8 -*-
__author__ = 'litao@easted.com.cn'

SCHED_TYPE_ACTIONG_CREATE = 0
SCHED_TYPE_ACTIONG_START = 1
SCHED_TYPE_ACTIONG_REBOOT = 2
SCHED_TYPE_ACTIONG_UPLOAD_IMAGE = 3

SCHED_STATUS_PREPARE = 0
SCHED_STATUS_PREPARE_SUCCESS = 1
SCHED_STATUS_PREPARE_FAIL = 2
SCHED_STATUS_RUNNING = 3
SCHED_STATUS_RUN_SUCCESS = 4


SYS_VOLUME = "ecloud-sys-volume-%s"

VM_SEQUENCE_NAME = 'vm-sequence'
VM_SEQUENCE_PREFIX = 'vm-'

NEED_REBOOT = 'need_reboot'
NEED_DELETE = "need_delete"
NEED_DELETE_SYS_VOLUME = "need_del_sys_vol"


VM_STATUS_ACTIVE = "active"
VM_STATUS_STOP = "stopped"
VM_STATUS_ERROR = "error"
VM_STATUS_BUILD = "building"
VM_STATUS_POWER_ON = "powering-on"
VM_STATUS_POWER_OFF = "powering-off"
VM_STATUS_REBOOT = "rebooting"
VM_STATUS_BACKUP = "backuping"
VM_STATUS_RECOVER = "recovering"
VM_STATUS_DELETE = "deleting"
VM_STATUS_MIGRAT = "migrating"
VM_STATUS_UPLOAD = "uploading"
VM_STATUS_PREPARE = "preparation"
VM_STATUS_WAIT_CREATE = "wait_create"
VM_STATUS_WAIT_BOOT = "wait_boot"
VM_STATUS_WAIT_REBOOT = "wait_reboot"
