#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: NoDB_spider_1.py
    @time: 2018/2/22 18:51
"""
import json
import requests
from bs4 import BeautifulSoup

user_agent = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
headers = {
    "User-Agent": user_agent
}

resp = requests.get(url="http://seputu.com",
                    headers=headers)

soup = BeautifulSoup(resp.text, "html.parser", from_encoding="utf-8")
content = []
for mulu in soup.find_all(class_="mulu"):
    h2 = mulu.find("h2")
    if h2:
        h2_title = h2.string
        result = []
        for a in mulu.find(class_="box").find_all("a"):
            href = a.get("href")
            box_title = a.get("title")
            result.append(
                {
                    "href": href,
                    "Title": box_title
                }
            )
        content.append(result)
with open("nodb_spider_1.txt", "wb") as fp:
    json.dump(content, fp=fp, indent=4)
