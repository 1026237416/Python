#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: forms.py
    @time: 2018/6/23 16:06
    @desc:
"""
from flask_wtf import FlaskForm
from wtforms import StringField, BooleanField
from wtforms.validators import DataRequired


class LoginForm(FlaskForm):
    openid = StringField("openid", validators=[DataRequired()])
    remember_me = BooleanField("remember_me", default=False)
