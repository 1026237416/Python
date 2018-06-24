#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: __init__.py.py
    @time: 2018/6/23 10:54
    @desc:
"""
import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_openid import OpenID
from flask_login import LoginManager

from config import basedir

app = Flask(__name__)
app.config.from_object("config")
db = SQLAlchemy(app)

lm = LoginManager()
lm.init_app(app)
lm.login_view = "login"
oid = OpenID(
    app=app,
    fs_store_path=os.path.join(basedir, "tmp")
)

from app import views
from app import models
