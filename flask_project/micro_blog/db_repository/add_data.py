#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: add_data.py
    @time: 2018/6/24 11:39
    @desc:
"""
import datetime
from app import db, models

insert_users = [
    {"nickname": "liping", "email": "liping@email"},
    {"nickname": "spring", "email": "spring@email"},
    {"nickname": "alex", "email": "alex@email"},
    {"nickname": "Toms", "email": "Toms@email"},
    {"nickname": "stevn", "email": "stevn@email"},

]

for user in insert_users:
    u = models.User(nickname=user["nickname"], email=user["email"])
    db.session.add(u)


users = models.User.query.all()
print(users)

for user in users:
    print(user.id, user.nickname)

u = models.User.query.get(1)
p = models.Post(body="my first post!",
                timestamp=datetime.datetime.utcnow(),
                author=u)
db.session.add(p)

# users = models.User.query.all()
# for user in users:
#     db.session.delete(user)
#
# posts = models.Post.query.all()
# for post in posts:
#     db.session.delete(post)

db.session.commit()
