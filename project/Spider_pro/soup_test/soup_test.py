#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Time    : 2017/8/12 23:25
# @Author  : liping
# @File    : soup_test.py
# @Software: PyCharm

from bs4 import BeautifulSoup
import bs4

html = """
<html><head><title>The Dormouse's story</title></head>
<body>
<p class="title" name="dromouse"><b>The Dormouse's story</b></p>
<p class="story">Once upon a time there were three little sisters; and their names were
<a href="http://example.com/elsie" class="sister" id="link1"><!-- Elsie --></a>,
<a href="http://example.com/lacie" class="sister" id="link2">Lacie</a> and
<a href="http://example.com/tillie" class="sister" id="link3">Tillie</a>;
and they lived at the bottom of a well.</p>
<p class="story">...</p>
<div class="pagination pagination-multi"><ul><li class='prev-page'><a target="_blank" href='3433_2.html'>上一页</a></li><li class='active'><span>3</span></li><li><a target="_blank" href='3433_4.html'>4</a></li><li><a target="_blank" href='3433_5.html'>5</a></li><li><a target="_blank" href='3433_6.html'>6</a></li><li><a target="_blank" href='3433_7.html'>7</a></li><li><a target="_blank" href='3433_8.html'>8</a></li><li class='next-page'><a target="_blank" href='3433_4.html'>下一页</a></li></ul></div>
"""

soup = BeautifulSoup(html, "html.parser")
for i in soup.div.children:
    print i
#     print soup.a.string
#     print soup.p.string
    # if type(soup.a.string) == bs4.element.Comment:
    #     print i

