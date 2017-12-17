#coding:utf-8
'''
Created on 2016年5月18日

@author: liping
'''

from configobj import ConfigObj
import logging

conf_ini = "configObj.conf"
conf_ini = r"C:\Users\liping\Desktop\libvirtd.conf"
# class Test():
#     def main(self):
#         try:
#             config = ConfigObj(conf_ini)
#             print "config=====", config
#         except Exception as e:
#             logging.error("error is %s" % e)
#         
#     
# if __name__=="__main__":
#     pass
#     print "1111111111" 
#     testobj = Test()
#     testobj.main()

# print config['server'].keys()
# if "serverport" not in config['server'].keys():
#     print "SSSSSSSSSSSSSSSSSSSSSS"
# else:
#     print "AAAAAAAAAAAAAAAAAAAAAAAAAA"
#     
# print config['server']['servername']


config = ConfigObj(conf_ini)
config['listen_tcp'] = 1
config.write()

print config