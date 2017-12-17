#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/8/12 13:10
# @Author  : liping
# @File    : zhilian_kw_spider.py
# @Software: PyCharm

import time
import requests
import pymongo
from datetime import datetime
from bs4 import BeautifulSoup
from multiprocessing import Pool
from itertools import product
# from urllib.parse import urlencode
from zhilian_kw_config import *

client = pymongo.MongoClient(MONGO_URI)
db = client[MONGO_DB]


def download(url):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:51.0) Gecko/20100101 Firefox/51.0'}
    response = requests.get(url, headers=headers)
    return response.text


def get_content(html):
    date = datetime.strftime(datetime.now().date(), '%Y-%m-%d')

    soup = BeautifulSoup(html, 'lxml')
    body = soup.body


def main():
    basic_url = '招聘（求职）尽在智联招聘?'

    for keyword in KEYWORDS:
        mongo_table = db[keyword]
        paras = {
            'jl': args[0],
            'kw': keyword,
            'p': args[1]
        }
        # url = basic_url + urlencode(paras)


if __name__ == '__main__':
    start = time.time()
    number_list = list(range(TOTAL_PAGE_NUMBER))
    args = product(ADDRESS, number_list)
    pool = Pool()
    pool.map(main, args)
    end = time.time()
    print("Finished, Task runs %s seconds" % (end - start))
