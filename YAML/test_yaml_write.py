#coding:utf-8
'''
Created on 2016年5月18日

@author: liping
'''

import os
import sys

evs_uuid = sys.argv[1]

set_yaml_cmd = "sed -i 's/rbd_secret_uuid.*/rbd_secret_uuid: %s/g' test_yaml_write.yaml"%(evs_uuid)
os.system(set_yaml_cmd)