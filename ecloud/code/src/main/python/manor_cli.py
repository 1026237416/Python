#!/usr/bin/env python
# coding=utf-8
import cmd
import json
import os

import pyaml
from tornado import httpclient

from manor.util import generals


def get_client(method,url):
    ip=generals.get_ip()
    url='https://%s:8443/manor/cli/%s'%(ip,url)
    request=httpclient.HTTPRequest(
        url=url,
        method=method,
        validate_cert=False)
    client=httpclient.HTTPClient()
    return client,request


class Manor(cmd.Cmd):
    prompt='manor >'
    intro="""
        __  ______    _   ______  ____
       /  |/  /   |  / | / / __ \/ __ \\
      / /|_/ / /| | /  |/ / / / / /_/ /
     / /  / / ___ |/ /|  / /_/ / _, _/
    /_/  /_/_/  |_/_/ |_/\____/_/ |_|

===========================================

manor 管理工具 v 1.0
"""

    def do_exit(self,line):
        return True

    def self_complete(self,ids,text):
        if not text:
            completions=ids
        else:
            completions=[f for f in ids if f.startswith(text)]
        return completions

    def do_get_stack(self,line):
        """
        获取栈的状态。
        参数为stack id
        """
        params=line.replace(' ','/')
        url='get_stack/%s'%params
        method='GET'
        client,request=get_client(method,url)
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def do_get_stack_resources(self,line):
        """
        获取栈中的资源情况
        参数为栈的ID。
        栈的ID可以通过list_app方法获得。
        """
        params=line.replace(' ','/')
        method='GET'
        url='get_stack_resources/%s'%params
        client,request=get_client(method,url)
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def do_get_roles(self,line):
        """
        获取栈中资源的角色
        """
        params=line.replace(' ','/')
        method='GET'
        url='get_roles/%s'%params
        client,request=get_client(method,url)
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def do_get_resources_info(self,line):
        """
        获取栈中的资源的详细信息
        """
        params=line.replace(' ','/')
        method='GET'
        url='get_resources_info/%s'%params
        client,request=get_client(method,url)
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def do_download_path(self,line):
        """
        获取下载到云主机中的包的名称,根据镜像名称分析得来。
        仅支持ubuntu以及centos
        """
        params=line.replace(' ','/')
        method='GET'
        url='download_path/%s'%params
        client,request=get_client(method,url)
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def do_redis(self,line):
        """
        列出redis中的内容
        参数是需要列出的key的前缀:
        mapup
        execute_script
        manage_error
        如果不传,则返回全部内容
        """
        params=line.replace(' ','/')
        method='GET'
        url='redis/%s'%params
        client,request=get_client(method,url)
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def do_clear_redis_msg(self,line):
        """
        清理redis中的内容
        参数为需要清理的key前缀
        """
        params=line.replace(' ','/')
        method='GET'
        url='clear_redis_msg/%s'%params
        client,request=get_client(method,url)
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def do_list_instances(self,line):
        """
        列出应用的基本信息
        """
        method='GET'
        url='list_instances'
        client,request=get_client(method,url)
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def do_delete_instance(self,line):
        """
        删除应用
        参数是应用的serial
        可以通过tab键补全
        """
        params=line.replace(' ','/')
        method='POST'
        url='delete_instance/%s'%params
        client,request=get_client(method,url)
        request.body='{}'
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def complete_delete_instance(self,text,line,begidx,endidx):
        method='GET'
        url='list_instances'
        client,request=get_client(method,url)
        response=client.fetch(request)
        ids=[_['app_serial'] for _ in json.loads(response.body)]
        return self.self_complete(ids,text)

    # def do_delete_stack(self,line):
    #     params=line.replace(' ','/')
    #     method='POST'
    #     url='delete_stack/%s'%params
    #     client,request=get_client(method,url)
    #     request.body='{}'
    #     response=client.fetch(request)
    #     print pyaml.dumps(json.loads(response.body))

    # def do_send_message(self,line):
    #     method='POST'
    #     url='send_message'
    #     client,request=get_client(method,url)
    #     request.body=line
    #     response=client.fetch(request)
    #     print pyaml.dumps(json.loads(response.body))

    def do_list_app(self,line):
        """
        列出应用的详情
        参数是应用的serial
        可以通过tab补全
        """
        method='GET'
        params=line.replace(' ','/')
        url='list_app/%s'%params
        client,request=get_client(method,url)
        response=client.fetch(request)
        print pyaml.dumps(json.loads(response.body))

    def complete_list_app(self,text,line,begidx,endidx):
        method='GET'
        url='list_instances'
        client,request=get_client(method,url)
        response=client.fetch(request)
        ids=[_['app_serial'] for _ in json.loads(response.body)]
        return self.self_complete(ids,text)

    # def do_create_vm(self,line):
    #     method='POST'
    #     url='create_vm'
    #     client,request=get_client(method,url)
    #     request.body=line
    #     response=client.fetch(request)
    #     print pyaml.dumps(json.loads(response.body))

    # def do_list_app_templates(self,line):
    #     from manor.util import cfgutils
    #     cfgutils.init('../etc/manor.conf')
    #     instance_path=cfgutils.getval('app','instance_path')
    #     for f in os.listdir(instance_path):
    #         print f
    #
    # def do_app_template(self,line):
    #     from manor.util import cfgutils
    #     cfgutils.init('../etc/manor.conf')
    #     instance_path=cfgutils.getval('app','instance_path')
    #     with open('%s/%s'%(instance_path,str(line))) as f:
    #         rs=f.read()
    #     print rs


    # def do_rename_vm(self,line):
    #     """
    #     修改虚拟机的display name
    #
    #     两个参数
    #
    #     参数0 虚拟机的ID
    #     参数1 新的名字
    #
    #     """
    #     method='GET'
    #     params=line.replace(' ','/')
    #     url='rename/%s'%params
    #     client,request=get_client(method,url)
    #     response=client.fetch(request)
    #     print pyaml.dumps(json.loads(response.body))

    # def do_app_count(self,line):
    #     method='GET'
    #     url='app_count'
    #     client,request=get_client(method,url)
    #     response=client.fetch(request)
    #     print pyaml.dumps(json.loads(response.body))


Manor().cmdloop()
