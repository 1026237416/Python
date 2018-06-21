# -*- coding:utf-8 -*-
'''
Created on 2018年6月11日

@author: lille
'''
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
import sys
import os
import datetime

reload(sys)
sys.setdefaultencoding('gbk')


class ElasticSearch(object):
    def __init__(self, index_name, index_type, ip="127.0.0.1"):
        '''
        :param index_name: 索引名称
        :param index_type: 索引类型
        '''
        self.index_name = index_name
        self.index_type = index_type
        # 无用户名密码状态
        self.es = Elasticsearch([ip], port=9200)
        # 用户名密码状态
        # self.es = Elasticsearch([ip],http_auth=('elastic', 'password'),port=9200)

    def create_index(self, index_name="showhtml", index_type="report"):
        # '''创建索引,创建索引名称为showhtml，类型为report的索引
        # :param ex: Elasticsearch对象
        # :return:
        # '''
        """
        创建索引,创建索引名称为showhtml，类型为report的索引
        :param index_name: 索引名称
        :param index_type: 索引类型
        :return: 
        """
        # 创建映射
        _index_mappings = {
            "mappings": {
                self.index_type: {
                    "properties": {
                        "title": {
                            "type": "text",
                            "index": True
                            # "analyzer": "ik_max_word",
                            # "search_analyzer": "ik_max_word"
                        },
                        "date": {
                            "type": "text",
                            "index": True
                        },
                        "keyword": {
                            "type": "string",
                            "index": "not_analyzed"
                        },
                        "source": {
                            "type": "string",
                            "index": "no",
                            "store": "yes",
                            "ignore_above": 256
                        },
                        "link": {
                            "type": "string",
                            "index": "no"
                        }
                    }
                }

            }
        }
        judge = self.es.indices.exists(index=self.index_name)
        if judge is not True:
            res = self.es.indices.create(index=self.index_name,
                                         body=_index_mappings)
            print res

    def index_data(self, dir_path):
        '''插入数据
        : return: nowtime是系统当前时间'''
        path_list = os.walk(dir_path)
        js_file_name_list = []
        font_file_name_list = []
        css_file_name_list = []
        html_file_name_list = []
        nowtime = datetime.datetime.now().strftime("%Y/%m/%d/%H/%S/%M")
        # 如果report文件夹在目录下，运行if中流程，否则运行else中流程
        try:
            if 'report' in os.listdir(dir_path):
                for (dirpath, dirname, filenames) in path_list:
                    if dirpath.split('\\')[-1] == 'css':
                        css_file_name_list.extend(
                            ['report\\css\\' + name for name in filenames])
                    elif dirpath.split('\\')[-1] == 'fonts':
                        try:
                            font_file_name_list.extend(
                                ['report\\fonts\\' + name for name in
                                 filenames])
                        except:
                            print u'fonts文件夹中信息不能存入ES'
                    elif dirpath.split('\\')[-1] == 'js':
                        js_file_name_list.extend(
                            ['report\\js\\' + name for name in filenames])
                    elif dirpath.split('\\')[-1] == 'report':
                        html_file_name_list.extend(
                            ['report\\' + name for name in filenames])
                    else:
                        html_file_name_list.extend(filenames)

                self.index_data_type(html_file_name_list, dir_path, nowtime,
                                     'html/xml')
                self.index_data_type(css_file_name_list, dir_path, nowtime,
                                     'css')
                self.index_data_type(font_file_name_list, dir_path, nowtime,
                                     'fonts')
                self.index_data_type(js_file_name_list, dir_path, nowtime, 'js')

            else:
                for (dirpath, dirname, filenames) in path_list:
                    html_file_name_list.extend(filenames)
                self.index_data_type(html_file_name_list, dir_path, nowtime,
                                     'html/xml')
        except:
            print u'测试结果存入ES错误'
        return nowtime

    def index_data_type(self, file_name_list, dir_path, now_time, type):
        '''将数据插入es中'''
        doc = {}
        index = 2
        try:
            file_name_list.remove('argfile.txt')
        except:
            pass
        # 从文件中获取数据上传到es中
        for filename in file_name_list:
            if dir_path[-1] == '\\':
                filepath = dir_path + filename
            else:
                filepath = dir_path + '\\' + filename
            filedata = open(filepath, 'rb')
            fileinfo = filedata.read()
            filedata.close()

            if index > 1:
                doc['title'] = filename.split('\\')[-1]
                doc['link'] = filename
                doc['date'] = now_time
                doc['source'] = fileinfo
                doc['keyword'] = type
                res = self.es.index(index=self.index_name,
                                    doc_type=self.index_type, body=doc)
                print(res['created'])
            index += 1

    def Get_Data_By_Body(self, time):
        """
    
        """
        # doc = {'query': {'match_all': {}}}
        doc = {
            "query": {
                "match": {
                    "date": time
                }
            }
        }
        _searched = self.es.search(index=self.index_name,
                                   doc_type=self.index_type, body=doc)

        for hit in _searched['hits']['hits']:
            # print hit['_source']
            print hit['_source']['date'], hit['_source']['link'], \
            hit['_source']['keyword'], hit['_source']['title']


if __name__ == '__main__':
    file_path = 'E:\\case'
    es = ElasticSearch('showhtml', 'report')
    es.create_index()
    time = es.index_data(file_path)
    print time
    es.Get_Data_By_Body(time)
