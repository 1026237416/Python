#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @software: PyCharm
    @file: savereport.py
    @time: 2018/7/9 11:37
"""
import json
import requests
from boto.s3.key import Key
from boto.s3.connection import S3Connection


class S3(object):
    def __init__(self, s3_server_ip, s3_server_port, s3_server_user,
                 s3_server_pwd):
        self.s3_ip = s3_server_ip
        self.s3_port = s3_server_port
        self.s3_user = s3_server_user
        self.s3_pwd = s3_server_pwd

        self.s3_server = "{ip}:{port}".format(ip=self.s3_ip, port=self.s3_port)

        self.conn = S3Connection(
            host=s3_server_ip,
            port=s3_server_port,
            aws_access_key_id=s3_server_user,
            aws_secret_access_key=s3_server_pwd,
            is_secure=False,
            calling_format='boto.s3.connection.OrdinaryCallingFormat'
        )
        self.session = requests.session()

        self.headers = {
            "Accept": "*/*",
            "Accept-Encoding": "gzip,deflate",
            "Accept-Language": "zh-CN,zh;q=0.8",
            "Connection": "keep-alive",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64)",
        }
        self.token = None

    def rest_login_s3(self):
        """
        
        :return: 
        """

        login_data = {
            "id": 1,
            "jsonrpc": "2.0",
            "params": {
                "username": self.s3_user,
                "password": self.s3_pwd},
            "method": "Web.Login"
        }
        login_url = "http://{ip}:{port}/minio/webrpc".format(ip=self.s3_ip,
                                                             port=self.s3_port)
        login_resp = self.session.post(url=login_url,
                                       data=json.dumps(login_data),
                                       headers=self.headers)
        print login_resp.content
        resp_data = json.loads(login_resp.content)
        if int(login_resp.status_code) == "200":
            if resp_data.haskey("error"):
                raise Exception("Rest login S3 failed!")
        else:
            print "login success: %s" % resp_data
            self.token = resp_data.get("result").get("token")
            self.headers["Authorization"] = "Bearer {}".format(self.token)
            print self.headers

    def rest_get_obj_share_url(self, bucket_name, obj_name):
        """
        
        :param bucket_name: 
        :param obj_name: 
        :return: 
        """
        get_url = "http://{ip}:{port}/minio/webrpc".format(ip=self.s3_ip,
                                                           port=self.s3_port)
        get_url_data = {
            "id": 1,
            "jsonrpc": "2.0",
            "params": {
                "host": self.s3_server,
                "bucket": bucket_name,
                "object": obj_name,
                "expiry": 604800
            },
            "method": "Web.PresignedGet"
        }
        print get_url_data
        print self.headers
        resp = self.session.post(url=get_url,
                                 data=json.dumps(get_url_data),
                                 headers=self.headers)
        print resp
        reps_data = json.loads(resp.content)
        print reps_data

    def get_all_bucket(self):
        """
        获取S3服务器上已存在的所有桶名称
        @return: list
        """
        return [bucket.name for bucket in self.conn.get_all_buckets()]

    def create_bucket(self, bucket_name):
        """
        创建一个指定名称的桶
        @param bucket_name: 桶名称
        @return: 
        """
        if bucket_name not in self.get_all_bucket():
            self.conn.create_bucket(bucket_name)

    def upload_file(self, bucket_name, object_path, file_path):
        """
        上传一个文件（路径）到S3服务器指定的bucket中
        @param bucket_name: bucket名称
        @param object_path: object存储在bucket中的路径
        @param file_path: 本地文件的路径
        @return: 
        """
        b = self.conn.get_bucket(bucket_name)
        k = Key(b)
        k.key = object_path
        k.set_contents_from_filename(file_path, policy='public-read')

    def download_file(self, bucket_name, object_name, local_file):
        """
        下载一个对象到本地目录
        @param bucket_name: 对象所处桶的名称
        @param object_name: 对象名称
        @param local_file: 存储到本地的目录
        @return: 
        """
        b = self.conn.get_bucket(bucket_name)
        key = b.lookup(object_name)
        key.get_contents_to_filename(local_file)

    def get_file_share_url(self, bucket_name, object_name):
        """
        获取一个对象的“shareable link”
        @param bucket_name: 对象所处桶（bucket）的名称
        @param object_name: 对象名称
        @return: 成功返回object的share url
        """
        bucket = self.conn.get_bucket(bucket_name)
        plans_key = bucket.get_key(object_name)
        share_url = plans_key.generate_url(expires_in=3600 * 24 * 30,
                                           query_auth=True,
                                           force_http=True)
        return share_url


if __name__ == '__main__':
    s3 = S3(s3_server_ip="192.168.11.20", s3_server_port=9001,
            s3_server_user="AKIAIOSFODNN7EXAMPLE",
            s3_server_pwd="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY")
    s3.rest_login_s3()
    s3.rest_get_obj_share_url("case", "aaa/bbb/report.html")
    # s3.get_all_bucket()
    # s3.create_bucket("qcloud1")
    # s3.create_bucket("case1")
    # print s3.get_all_bucket()

    #
    # s3.upload_file("qcloud1", "/aaa/bb/tmp_file.txt",
    #                r"E:\auto_case\result\case6_0000001.zip")
    # s3.download_file("qcloud1", "tmp_file.txt", r"F:\Python\S3_boto\1.zip")
