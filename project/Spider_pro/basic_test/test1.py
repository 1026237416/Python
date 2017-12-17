#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/8/12 18:41
# @Author  : liping
# @File    : mutliprocess.py
# @Software: PyCharm

import os
import urllib
import urllib2
from bs4 import BeautifulSoup
import urlparse
from multiprocessing import Pool

BASE_URL = "http://yxpjw.club/xiurenwang/2017/1130/4265.html"
SAVE_PATH = "./img"

image_info = {}


def get_base_html(url=BASE_URL):
    request = urllib2.Request(url)
    response = urllib2.urlopen(request)
    return response.read().decode('gbk')


def report(count, blockSize, totalSize):
    # print count, blockSize, totalSize
    # print "******"
    # print "******"
    import sys
    import math
    percent = '{:.2%}'.format(count * blockSize * 100 / totalSize)
    sys.stdout.write('\r')
    if percent > 100:
        percent = 100
    sys.stdout.write('[%-50s] %s' % ('=' * int(math.floor(blockSize * 50 / totalSize)), percent))
    sys.stdout.flush()
    if count == totalSize:
        sys.stdout.write('\n')


def schedule(a, b, c):
    """
    :param a: 已经下载的数据块
    :param b: 数据块的大小
    :param c: 远程文件的大小
    :return:
    """
    per = 100.0 * a * b / c
    if per > 100:
        per = 100
    print '%.2f%%' % per


def save_img(image_url, filename):
    print u"\n正在悄悄保存她的一张图片为", filename
    urllib.urlretrieve(image_url, filename, report)


def get_next_page_url(url, html):
    soup = BeautifulSoup(html, "html.parser")
    try:
        next_page = soup.select('li[class="next-page"] a')[0].get("href")
    except IndexError:
        return None
    else:
        base_html_name = url.split("/")[-1]
        next_url = url.replace(base_html_name, next_page)
        return next_url


def get_html_info(soup):
    html_info = {}
    group_name = soup.select('meta[property="og:title"]')[0].get("content")
    html_info["group_name"] = group_name
    return html_info


def download_page_image(html):
    soup = BeautifulSoup(html, "html.parser")
    html_info = get_html_info(soup)

    if not os.path.exists(SAVE_PATH):
        os.mkdir(SAVE_PATH)

    group_image_dir = os.path.join(SAVE_PATH, html_info.get("group_name").split("(")[0])
    if not os.path.exists(group_image_dir):
        os.makedirs(group_image_dir)

    for option in soup.select('article[class="article-content"] img'):
        url = option.get("src")
        filename = url.split("/")[-1]
        filename = os.path.join(group_image_dir, filename)

        save_img(url, filename)
        # image_info[url] = filename


def get_group_image(url=BASE_URL):
    print url
    html_info = get_base_html(url)
    download_page_image(html_info)
    while True:
        next_page_url = get_next_page_url(url, html_info)
        if next_page_url:
            html_info = get_base_html(next_page_url)
            download_page_image(html_info)
        else:
            break


def get_next_group_url(url):
    html = get_base_html(url)
    soup = BeautifulSoup(html, "html.parser")
    next_group_page = soup.select('span[class="article-nav-prev"] a')[0].get("href")
    url_parser = urlparse.urlparse(BASE_URL)
    next_group_page_url = url_parser.scheme + "://" + url_parser.hostname + "/" + next_group_page
    return next_group_page_url


def main():
    i = 0
    while i < 12:
        if i == 0:
            url = BASE_URL
        else:
            url = get_next_group_url(url)
        get_group_image(url)
        i = i + 1
        # html_info = get_base_html()
        # soup = BeautifulSoup(html_info, "html.parser")
        # get_html_info(soup)
        # image_group_name = u"[MyGirl]美媛馆第180期Evelyn艾莉[60P](20)"
        # files = "sss.jpg"
        # print (os.path.join(SAVE_PATH, image_group_name, files))
    # # for i in range(10):
    # p = Pool(processes=10)
    # for item in image_info.items():
    #
    #     p.apply_async(save_img, item)
    #
    # p.close()
    # p.join()


main()
