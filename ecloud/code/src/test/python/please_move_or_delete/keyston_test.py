# -*-coding:utf-8-*-
# I = 23
# __author__ = 'gavin'
# #!/usr/bin/python
# import keystoneclient.v2_0.client as ks_client
# if __name__ == '__main__':
#     # username='admin'
#     # password='password'
#     # tenant_name='admin'
#     # auth_url='http://10.10.3.113:5000/v2.0'
#     # keystone = ks_client.Client(username=username, password=password, tenant_name=tenant_name, auth_url=auth_url)
#     # print  keystone.users.list("5f9f8064f7304b8eaf0f06495edca68a")
#     roles = ['admin','demo','member']
#     print  'admin' in roles
#     print 'admin1' in roles
#
#
#
# url:  https://ip:port/v1/user/create post
# header：
# Content-Type:application/json
# Token:5f9f8064f7304b8eaf0f06495edca68a
# body:
#     {
#         "name":"ecloud",
#         "password":"password",
#         "email":"ecloud@easted.com.cn",
#         "phone":"400",
#         "enable":ture
#     }
# response:
#     {
#         "success":true,
#         "msg":"create user success"
#     }
#
#
# atitudeChuFa { get; set; }    //纬度
# public double longitudeChuFa { get; set; }   //经度
# public double latitud
#
#
# chufa:"{'latitude':'30','longitude':'80'}"
# jieren:"{'latitude':'30','longitude':'80'}"
# mudi:"{'latitude':'30','longitude':'80'}ancheng:"{'latitude':'30','longitude':'80'}"
#
#
#
#
# chufa:"30,80"
# jieren:"30,80"
# mudi:"30,80"
# fancheng:"30,80"
#
#
# {
#     "token":"fc8b0f41a5a9400a81636d585344a698"
# }
#
# {
#     "success":true,
#     "msg":"success",
#     "result":{
#         "token":"fc8b0f41a5a9400a81636d585344a698"
#     }
# }
#
# name = str
# password = str
# tenantId = str
# username = str
# email = str
# phone = str
# enabled = bool
#
# {
#     "code":"cup阀值告警",
#     "time":"2015-09-09 10:46:00",
#     "level":"1",
#     "desc":"虚拟机（vm001）cup使用率超过90%",
#     "handle":"1.使用top命令查看使用率最高的应用。2.针对具体应用分析原因"
# }
#
# Content-Type: application/json
# Token: fc8b0f41a5a9400a81636d585344a698
#
#
# {
#     "success":true,
#     "msg":"success",
#     "result":{
#         "ip":"192.11.0.3"
#     }
# }
#
# 一
# {
#     "ordertype":"云主机",
#     "attribute":{
#         "name":"vm01",
#         "images":"cetos7",
#         "adminpwd":"",
#         "cpus":"4",
#         "memory":"8",
#         "disk":"500",
#         "nic":"3"
#     }
# }
# 二
# {
#     "ordertype":"云硬盘",
#     "attribute":{
#         "name":"volume01",
#         "size":"100",
#         "type":"iscsi"
#     }
# }
# 三
# {
#     "type":"application",
#     "desc":{
#         "name":"XX高性能计算平台",
#         "app":"hpc",
#         "nodes":[{
#             "name":"console",
#             "cpus":"4",
#             "memory":"8",
#             "disk":"10",
#             "type":"manage"
#         },{
#             "name":"cn01",
#             "cpus":"4",
#             "memory":"8",
#             "disk":"10",
#             "type":"compute"
#         },{
#             "name":"cn02",
#             "cpus":"4",
#             "memory":"8",
#             "disk":"10",
#             "type":"compute"
#         },{
#             "name":"nfs",
#             "cpus":"4",
#             "memory":"8",
#             "disk":"200",
#             "type":"storage"
#         }]
#
#     }
# }
#
#
#
#
#
#
#
# <14>2015-09-09 10:51:05.291 1218 launch.py(line:54)  -[INFO]- start the easted service
# <15>2015-09-09 10:51:05.291 1218 launch.py(line:55)  -[DEBUG]- pyrestful has ready
# <12>2015-09-09 10:51:05.291 1218 launch.py(line:59)  -[WARNING]- Total usable vcpus: 4
# <11>2015-09-09 10:51:05.291 1218 launch.py(line:70)  -[ERROR]- param error!
#
#
# PRI           HEADER                               MSG  用户 增删改查 描述
# <23>2015-09-09 10:51:05.291 1218 keystoneService.py(line:54)  -[INFO]- admin  create  vm(v001) 4C8G 500G
# <24>2015-09-09 10:51:05.291 1218 keystoneService.py(line:55)  -[DEBUG]- ecloud query  query all instances
# <20>2015-09-09 10:51:05.291 1218 keystoneService.py(line:59)  -[WARNING]- admin update tenant quta disk 400 to 500
# <19>2015-09-09 10:51:05.291 1218 keystoneService.py(line:70)  -[ERROR]- ecloud delete volume(fea3245543) error! this volume has used
#
#
# <11>2015-09-09 10:51:05.291 1218 keystoneService.py(line:54)  -[ERROR]- param error!
#
# Facility可选值为：
#         1  user-level messages
# 16 local use 0 (local0)
# Level可选值为：
# 0  Emergency:     system is unusable
# 1  Alert:         action must be taken immediately
# 2  Critical:      critical conditions
# 3  Error:         error conditions
# 4  Warning:       warning conditions
# 5  Notice:        normal but significant condition
# 6  Informational: informational messages
# 7  Debug:         debug-level messages
#
#
#
# form-data; name="file"; filename="leak.txt"
# form-data; name="id"; 扫描对象
# form-data; name="scantime"; 扫描时间