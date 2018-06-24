#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: db_create.py
    @time: 2018/6/23 23:02
    @desc:
"""
import os

from migrate.versioning import api

from config import SQLALCHEMY_DATABASE_URI
from config import SQLALCHEMY_MIGRATE_REPO
from app import db

db.create_all()
if not os.path.exists(SQLALCHEMY_MIGRATE_REPO):
    api.create(SQLALCHEMY_MIGRATE_REPO, "database repository")
    api.version_control(SQLALCHEMY_DATABASE_URI, SQLALCHEMY_MIGRATE_REPO)
else:
    api.version_control(url=SQLALCHEMY_DATABASE_URI,
                        repository=SQLALCHEMY_MIGRATE_REPO,
                        version=api.version(SQLALCHEMY_MIGRATE_REPO)
                        )
