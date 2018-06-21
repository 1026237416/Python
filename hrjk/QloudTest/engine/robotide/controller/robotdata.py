# -*- coding:utf-8 -*-

#  Copyright 2008-2015 Nokia Solutions and Networks
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import os

from robotide import robotapi


def NewTestCaseFile(path):#新测试案例文件
    datafile = robotapi.TestCaseFile(source=path)
    _create_missing_directories(datafile.directory)
    return datafile


def NewTestDataDirectory(path):#新测试数据目录
    dirname = os.path.dirname(path)
    datafile = robotapi.TestDataDirectory(source=dirname)
    datafile.initfile = path
    _create_missing_directories(dirname)
    return datafile


def _create_missing_directories(dirname):#创建缺失的目录
    if not os.path.isdir(dirname):
        os.makedirs(dirname)
