#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: uoload.py
    @time: 2018/6/24 16:31
    @desc:
"""
import os
import time
from flask import Flask, render_template, send_from_directory, request, jsonify

app = Flask(__name__)

from flask import request, jsonify, send_from_directory, abort, make_response
import os

@app.route('/download/<path:filename>')
def download(filename):
    print("***************")
    if request.method == "GET":
        if os.path.isfile(os.path.join('upload', filename)):
            print('upload', filename)
            return send_from_directory('upload', filename, as_attachment=True)
        abort(404)


# @app.route('/download/<path:filename>')
# def send_html(filename):
#     print("download file, path is %s" % filename)
#     return send_from_directory(app.config['UPLOAD_PATH'], filename, as_attachment=True)


app.run(host="0.0.0.0", port=8088, debug=True)
