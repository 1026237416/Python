#coding:utf-8
from __future__ import with_statement
from configobj import ConfigObj
import ConfigParser
import yaml
import re
import os
import sys

#打开并读取install.conf文件
install_config = ConfigParser.ConfigParser()
with open("install.conf") as cfgfile: 
    install_config.readfp(cfgfile)
    
    #读取对应角色的节点IP地址，如果角色对应的IP地址有多个，则存入数组之中
    Manage_ip   = install_config.get("Host", "MANAGEMENT_IP")
    Datebase_ip = install_config.get("Host", "DATABASE_HOST_IP")
    MongoDB_ip  = install_config.get("Host", "MONGODB_HOST_IP")
    
    Compute_ip_list = re.split(',', install_config.get("Host", "COMPUTE_HOSTS_IP"))
    Network_ip_list = re.split(',', install_config.get("Host", "NETWORK_HOSTS_IP"))
  
#配置using_evs.yaml文件
evs_uuid = sys.argv[1]
set_yaml_cmd = "sed -i 's/rbd_secret_uuid.*/rbd_secret_uuid: %s/g' test_yaml_write.yaml"%(evs_uuid)
os.system(set_yaml_cmd)
 
 
with open('n.yaml') as fp:
    nodenames = yaml.load(fp) 
    print "All Node:", nodenames.keys()    #nodenames.keys() is a list,保存着主机信息，内容是：['Compute_node', 'Management_node']
  
    for nodename in nodenames:
        if nodename == "Management_node":   #判断节点是否是管理节点
            print "Management Node config."
            for filename in nodenames.get(nodename):
                print "File:", filename
                for section in nodenames.get(nodename).get(filename):   #section是具体文件里的section字段
                    if section == "all":
                        for option_key in nodenames.get(nodename).get(filename).get(section):
                            option_key_value = nodenames.get(nodename).get(filename).get(section).get(option_key)
                            CMD = "sed -i 's/.*%s.*/%s=%s/' %s"%(option_key,option_key,option_key_value,filename)
                            os.system(CMD)
                    else:
                        get_section_config = ConfigParser.ConfigParser()
                        get_section_config.read(filename)
                        set_config = ConfigObj(filename)
                         
                        if "DEFAULT" == section :
                            for option_key in nodenames.get(nodename).get(filename).get(section):
                                option_key_value = nodenames.get(nodename).get(filename).get(section).get(option_key)
                                set_config[section][option_key] = option_key_value
                        elif section not in get_section_config.sections():
                            set_config[section] = {}
                            for option_key in nodenames.get(nodename).get(filename).get(section):
                                option_key_value = nodenames.get(nodename).get(filename).get(section).get(option_key)
                                set_config[section][option_key] = option_key_value
                        else:
                            for option_key in nodenames.get(nodename).get(filename).get(section):
                                option_key_value = nodenames.get(nodename).get(filename).get(section).get(option_key)
                                set_config[section][option_key] = option_key_value
                        set_config.write()
 
        else:
            print "Compute Node config."
             
            for IP in Compute_ip_list:                          #计算节点可能为多个，保存在一个列表内，使用for循环遍历
                for filename in nodenames.get(nodename):        #filename是具体的文件名称
                      
                    filename_short = re.split('/',filename)[-1]
                    local_path = "/tmp/%s"%(filename_short)
                      
                    get_file_cmd = "scp %s:%s %s"%(IP,filename,local_path)
                    os.system(get_file_cmd)
                     
                    for section in nodenames.get(nodename).get(filename):   #section是具体文件里的section字段
                        if "all" == section:
                            for option_key in nodenames.get(nodename).get(filename).get(section):
                                option_key_value = nodenames.get(nodename).get(filename).get(section).get(option_key)
                                   
                                set_file_cmd = "sed -i 's/.*%s.*/%s=%s/' %s"%(option_key,option_key,option_key_value,local_path)
                                os.system(set_file_cmd)
                        else:
                            get_section_config = ConfigParser.ConfigParser()
                            get_section_config.read(local_path)
                            set_config = ConfigObj(local_path)
                             
                            if "DEFAULT" == section:
                                for option_key in nodenames.get(nodename).get(filename).get(section):
                                    option_key_value = nodenames.get(nodename).get(filename).get(section).get(option_key)
                                    set_config[section][option_key] = option_key_value
                            elif section not in get_section_config.sections():
                                set_config[section] = {}
                                for option_key in nodenames.get(nodename).get(filename).get(section):
                                    option_key_value = nodenames.get(nodename).get(filename).get(section).get(option_key)
                                    set_config[section][option_key] = option_key_value
                            else:
                                for option_key in nodenames.get(nodename).get(filename).get(section):
                                    option_key_value = nodenames.get(nodename).get(filename).get(section).get(option_key)
                                    set_config[section][option_key] = option_key_value
                            set_config.write()
                         
                    put_cmd = "scp %s %s:%s"%(local_path,IP,filename)
                    os.system(put_cmd)