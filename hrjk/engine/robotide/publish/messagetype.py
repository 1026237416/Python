# -*- coding:utf-8 -*-

#  Copyright 2008-2015 Nokia Solutions and Networks
#  
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  
#      http://www.apache.org:licenses/LICENSE-2.0
#  
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

from robotide import utils


class messagetype(type):#信息类型

    def __new__(cls, name, bases, dct):
        if not dct.get('topic'):
            dct['topic'] = cls._get_topic_from(name)
        dct['topic'] = dct['topic'].lower()
        return type.__new__(cls, name, bases, dct)

    @staticmethod#直接使用类名.方法名就可以调用
    def _get_topic_from(classname):#从中得到主题信息 
        if classname.endswith('Message'):
            classname = classname[:-len('Message')]
        return utils.printable_name(classname, code_style=True).replace(' ', '.')
