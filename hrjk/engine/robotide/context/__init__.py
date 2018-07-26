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

import sys

from robotide.version import VERSION
from robotide.robotapi import ROBOT_LOGGER

from coreplugins import get_core_plugins
from logger import Logger
from platform import (IS_MAC, IS_WINDOWS, ctrl_or_cmd)
LOG = Logger()
ROBOT_LOGGER.disable_automatic_console_logger()
ROBOT_LOGGER.register_logger(LOG)

SETTING_EDITOR_WIDTH = 450#设置编辑的宽度
SETTING_LABEL_WIDTH = 150#设置标签的宽度
SETTING_ROW_HEIGTH = 25#设置行的高度
POPUP_BACKGROUND = (255, 255, 187)#设置导出菜单的背景

pyversion = '.'.join(str(v) for v in sys.version_info[:3])
SYSTEM_INFO = ''#"Started RIDE %s using python version %s with wx version %s in %s." % \
        #(VERSION, pyversion, sys.platform)#系统信息
ABOUT_RIDE = u'''<h3>AutoTest -- Robot Framework 测试数据编辑器</h3>
<p>AutoTest %s 运行基于 Python %s.</p>
<p>AutoTest是一个基于 <a href="http://robotframework.org">Robot Framework</a> 的测试数据编辑器。
</p>
<p>大部分图标来源于 <a href="http://www.famfamfam.com/lab/icons/silk/">Silk Icons</a>。</p>
''' % (VERSION, pyversion)
#For more information, see project pages at <a href="http://github.com/robotframework/RIDE">http://github.com/robotframework/RIDE</a>.
SHORTCUT_KEYS = u'''\
<h2>AutoTest 中的快捷键</h2>
<table>
    <tr align="left">
        <th><b>快捷键</b></th>
        <th><b>作用</b></th>
    </tr>
    <tr>
        <td>CtrlCmd-S</td>
        <td>保存</td>
    </tr>
    <tr>
        <td>CtrlCmd-Shift-S</td>
        <td>保存所有</td>
    </tr>
    <tr>
        <td>CtrlCmd-O</td>
        <td>打开</td>
    </tr>
    <tr>
        <td>CtrlCmd-Shift-O</td>
        <td>打开目录</td>
    </tr>
    <tr>
        <td>CtrlCmd-R</td>
        <td>打开资源</td>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-R</td>
        <td>刷新目录</td>
    </tr>
    <tr>
        <td>CtrlCmd-N</td>
        <td>新建工程</td>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-N</td>
        <td>新建资源</td>
    </tr>
    <tr>
        <td>CtrlCmd-Q</td>
        <td>退出 Autotest</td>
    </tr>
    <tr>
        <td>Alt-X</td>
        <td>前进</td>
    </tr>
    <tr>
        <td>Alt-Z</td>
        <td>后退</td>
    </tr>
    <tr>
        <td>F6</td>
        <td>打开预览</td>
    </tr>
    <tr>
        <td>F5</td>
        <td>打开关键字查找页面</td>
    </tr>
    <tr>
        <td>F3</td>
        <td>打开案例查找页面</td>
    </tr>
    <tr>
        <td>F8</td>
        <td>运行测试案例套件</td>
    </tr>
    <tr>
        <td>CtrlCmd-F8</td>
        <td>停止运行测试案例套件</td>
    </tr>
</table>
<h3>网格</h3>

<table>
    <tr align="left">
        <th><b>快捷键</b></th>
        <th><b>作用</b></th>
    </tr>
    <tr>
        <td>Ctrl-Space</td>
        <td>建议和自动完成</td>
    </tr>
    <tr>
        <td>CtrlCmd-I</td>
        <td>插入行</td>
    </tr>
    <tr>
        <td>CtrlCmd-D</td>
        <td>移动行</td>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-I</td>
        <td>插入单元格</td>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-D</td>
        <td>移动单元格</td>
    </tr>
    <tr>
        <td>CtrlCmd-Z</td>
        <td>撤消</td>
    </tr>
    <tr>
        <td>CtrlCmd-Y</td>
        <td>重做</td>
    </tr>
    <tr>
        <td>CtrlCmd-1</td>
        <td>参数化设置</td>
    </tr>
    <tr>
        <td>CtrlCmd-2</td>
        <td>制作列表变量体</td>
    </tr>
    <tr>
        <td>CtrlCmd-3</td>
        <td>注释行</td>
    </tr>
    <tr>
        <td>CtrlCmd-4</td>
        <td>取消行注释</td>
    </tr>
    <tr>
        <td>Alt-Up</td>
        <td>向上移动行</td>
    </tr>
    <tr>
        <td>Alt-Down</td>
        <td>向下移动行</td>
    </tr>
    <tr>
        <td>Alt-Enter</td>
        <td>向下移动光标</td>
    </tr>
    <tr>
        <td>CtrlCmd-A</td>
        <td>选择所有</td>
    </tr>
    <tr>
        <td>CtrlCmd-X</td>
        <td>剪切（不移动单元格或行）</td>
    </tr>
    <tr>
        <td>CtrlCmd-C</td>
        <td>复制</td>
    </tr>
    <tr>
        <td>CtrlCmd-V</td>
        <td>粘贴（不移动单元格或行）</td>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-V</td>
        <td>插入（添加空行和粘贴数据）</td>
    </tr>
    <tr>
        <td>Delete</td>
        <td>移除单元格内容</td>
    </tr>
</table>

<h3>树视图</h3>
<table>
    <tr align="left">
        <th><b>快捷键</b></th>
        <th><b>作用</b></th>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-T</td>
        <td>添加新的测试案例</td>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-K</td>
        <td>添加新的关键字</td>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-V</td>
        <td>添加新的标量变量</td>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-L</td>
        <td>添加新的列表变量</td>
    </tr>
    <tr>
        <td>F2</td>
        <td>重命名</td>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-C</td>
        <td>克隆或复制已选中的关键字或测试案例</td>
    </tr>
    <tr>
        <td>CtrlCmd-Up</td>
        <td>上移选中元素p</td>
    </tr>
    <tr>
        <td>CtrlCmd-Down</td>
        <td>下移选中元素</td>
    </tr>
</table>

<h3>文本编辑器</h3>

<table>
    <tr align="left">
        <th><b>快捷键</b></th>
        <th><b>作用</b></th>
    </tr>
    <tr>
        <td>CtrlCmd-F</td>
        <td>在文本中查找</td>
    </tr>
    <tr>
        <td>CtrlCmd-G</td>
        <td>查找下一个查询结果</td>
    </tr>
    <tr>
        <td>Shift-CtrlCmd-G</td>
        <td>查找上一个查询结果</td>
    </tr>
    <tr>
        <td>Enter</td>
        <td>当光标聚焦在查询位置，查找下一个查询结果</td>
    </tr>
    <tr>
        <td>Shift-Enter</td>
        <td>当光标聚焦在查询位置，查找上一个查询结果</td>
    </tr>
</table>

<h3>运行标签</h3>

<table>
    <tr align="left">
        <th><b>快捷键</b></th>
        <th><b>作用</b></th>
    </tr>
    <tr>
        <td>CtrlCmd-C</td>
        <td>当选中文本时从文本输出复制</td>
    </tr>
       <tr>
        <td>CtrlCmd-L</td>
        <td>打开HTML页面日志</td>
    </tr>
    <tr>
        <td>CtrlCmd-R</td>
        <td>展示HTML页面报告</td>
    </tr>
</table>
'''

APP = None
