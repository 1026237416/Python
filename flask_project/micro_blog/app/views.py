#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: views.py
    @time: 2018/6/23 12:53
    @desc:
"""
from flask import render_template, flash, redirect
from flask import url_for, request, g, session
from flask_login import login_user, logout_user, current_user, login_required

from app import app, db, lm, oid
from .forms import LoginForm
from app.models import User


@app.route("/")
@app.route("/index")
@login_required
def index():
    # user = {
    #     "nickname": "Miguel"
    # }
    user = g.user

    posts = [
        {
            "author": {"nickname": "John"},
            "body": "Beautiful day in Portland!"
        },
        {
            "author": {"nickname": "Susan"},
            "body": "The Avengers movie was so cool!"
        }
    ]

    return render_template(
        "index.html",
        title="Home",
        user=user,
        posts=posts
    )


@app.route("/login", methods=["GET", "POST"])
@oid.loginhandler
def login():
    if g.user is None and g.user.is_authenticated():
        return redirect(url_for("index`"))
    form = LoginForm()

    if form.validate_on_submit():
        # flash(
        #     "Login requested for OpenID='{openid}', remember_me={rem}".format(
        #         openid=form.openid.data,
        #         rem=str(form.remember_me.data)
        #     )
        # )
        # return redirect("/index")
        session["remember_me"] = form.remember_me.data
        return oid.try_login(form.openid.data, ask_for=["nickname", "email"])

    return render_template(
        "login.html",
        title="Sign In",
        form=form,
        providers=app.config["OPENID_PROVIDERS"]
    )


@oid.after_login
def after_login(resp):
    if resp.email is None or resp.email == "":
        flash("Invalid login. Please try again.")
        return redirect(url_for("login"))

    user = User.query.filter_by(email=resp.email).frist()
    if user is None:
        nickname = resp.nickname
        if nickname is None or nickname == "":
            nickname = resp.email.split("@")[0]
        user = User(nickname=nickname, email=resp.email)
        db.session.add(user)
        db.session.commit()
    remember_me = False

    if "remember_me" in session:
        remember_me = session["remember_me"]
        session.pop("remember_me", None)
    login_user(user, remember=remember_me)
    return redirect(request.args.get("next") or url_for("index"))


@lm.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.before_request
def before_request():
    g.user = current_user


@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("index"))


@app.route("/user/<nickname>")
@login_required
def user(nickname):
    user = User.query.filter_by(nickname=nickname).first()
    if not user:
        flash("User %s not found" % nickname)
        return redirect(url_for("index"))
    posts = [
        {'author': user, 'body': 'Test post #1'},
        {'author': user, 'body': 'Test post #2'}
    ]
    return render_template(
        template_name_or_list="user.html",
        user=user,
        posts=posts
    )


