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

#import wx

class eventhandlertype(type):#事件处理类型
    def __new__(cls, name, bases, dict):
        def mod_time_wrapper(method):#模式时间包装
            def wrapped(self, event=None):#包装
                if self._can_be_edited(event):
                    method(self, event)
            return wrapped
        for attr in dict:
            '''#attr如果以“On”开头，并且不是“OnClose”、“OnDrop”，“OnIdle”，“OnLeaveWindow”，“OnDisplayMotion”,
                                            名字不是“RideFrame”，“Tree”，“KeywordEditor”，“OnEnterWindow”，
                                            则对字典中key值为attr内容的值进行模式时间包装。'''
            if (attr.startswith('On') and
                    not (name == 'RideFrame' and attr == 'OnClose') and
                    not (name == 'Tree' and attr == 'OnDrop') and
                    not (name == 'KeywordEditor' and attr == 'OnIdle') and
                    not (attr == 'OnEnterWindow' or attr == 'OnLeaveWindow' or attr == 'OnDisplayMotion')):
                dict[attr] = mod_time_wrapper(dict[attr])
        return type.__new__(cls, name, bases, dict)


class RideEventHandler(object):#Ride时间管理
    __metaclass__ = eventhandlertype
    _SHOWING_MODIFIED_ON_DISK_CONTROLLERS_ = set()#在磁盘管理器中显示改进
    _SHOWING_REMOVED_ON_DISK_CONTROLLERS_ = set()#在磁盘管理器中显示移除

    def _can_be_edited(self, event):#确定是否能被编辑
        ctrl = self.get_selected_datafile_controller()#获取选中的选项数据管理
        if ctrl and ctrl.has_been_removed_from_disk():
            return self._show_removed_from_disk_warning(ctrl, event)
        if ctrl and ctrl.has_been_modified_on_disk():
            return self._show_modified_on_disk_warning(ctrl, event)
        return True

    def _show_removed_from_disk_warning(self, ctrl, event):#显示从磁盘移除的警告
        msg = ['The file has been removed from the file system.',
               'Do you want to remove it from the project?',
               'Answering <No> will rewrite the file on disk.']
        self._execute_if_not_in_the_set(RideEventHandler._SHOWING_REMOVED_ON_DISK_CONTROLLERS_, ctrl, msg, ctrl.remove)

    #TODO: Not a very good mechanism to control the number of shown dialogs
    def _show_modified_on_disk_warning(self, ctrl, event):#显示从磁盘改变内容的警告
        def reload_datafile():#加载文件数据
            ctrl.reload()
            self.refresh_datafile(ctrl, event)
        msg = ['The file has been changed on the file system.',
               'Do you want to reload the file?',
               'Answering <No> will overwrite the changes on disk.']
        self._execute_if_not_in_the_set(RideEventHandler._SHOWING_MODIFIED_ON_DISK_CONTROLLERS_, ctrl, msg, reload_datafile)

    def _execute_if_not_in_the_set(self, the_set, ctrl, msg, yes_handler):#如果不在集合里则执行
        if ctrl in the_set:
            return
        the_set.add(ctrl)
        #wx.CallLater(100, self._try_show_warning, the_set, ctrl, msg, yes_handler)

    def _try_show_warning(self, the_set, ctrl, msg, yes_handler):#尝试显示警告
        try:
            self._show_warning(msg, ctrl, yes_handler)
        finally:
            the_set.remove(ctrl)

    def _show_warning(self, msg_lines, ctrl, yes_handler):#显示警告
        """
        if ctrl.dirty:
            msg_lines.insert(2, 'Answering <Yes> will discard unsaved changes.')
        msg_lines.extend(['', 'Changed file is:', ctrl.datafile.source])
        ret = wx.MessageBox('\n'.join(msg_lines), 'File Changed On Disk',
                            style=wx.YES_NO|wx.ICON_WARNING)
        if ret == wx.NO:
            from robotide.controller.commands import SaveFile
            ctrl.execute(SaveFile())
            return True
        if ret == wx.YES:
            yes_handler()
        """
        return False

    def get_selected_datafile_controller(self):#获取选中的选项数据管理
        raise NotImplementedError(self.__class__.__name__)
