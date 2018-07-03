#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: zip.py
    @time: 2018/6/25 13:59
"""
import os
import zipfile

base_dir = os.path.abspath(os.path.dirname(__file__))
zip_path = os.path.join(base_dir, "file", "Neutron.zip")
print base_dir
print zip_path

zipf = zipfile.ZipFile(zip_path)
zipf.extractall(os.path.dirname(zip_path))
