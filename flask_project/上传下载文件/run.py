#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: run.py
    @time: 2018/7/1 22:20
    @desc:
"""
from flask import Flask, render_template, send_from_directory, request, jsonify
import config
from upload import upload

app = Flask(__name__)

app.config["UPLOAD_DIR"] = config.UPLOAD_DIR


@app.route("/test/upload")
def upload_test():
    return render_template("upload.html")


@app.route("/api/upload", methods=["POST"], strict_slashes=False)
def api_upload():
    result = upload(request)
    return jsonify(result)


if __name__ == '__main__':
    app.debug = True
    app.run(host="0.0.0.0", port=8633)
