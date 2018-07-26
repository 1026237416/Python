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

from robotide.pluginapi import Plugin, RideLog


def _message_to_string(msg):
    return '%s [%s]: %s\n\n' % (msg.timestamp, msg.level, msg.message)


class LogPlugin(Plugin):
    """Viewer for internal log messages."""

    def __init__(self, app):
        Plugin.__init__(self, app, default_settings={'log_to_console': False})
        self._log = []
        self._window = None

    def enable(self):
        self._create_menu()
        self.subscribe(self._log_message, RideLog)

    def disable(self):
        self.unsubscribe_all()
        self.unregister_actions()
        if self._window:
            self._window.close(self.notebook)

    def _create_menu(self):
        self.unregister_actions()
        
    def _log_message(self, log_event):
        self._log.append(log_event)
        if self._window:
            self._window.update_log()
        if self.log_to_console:
            print _message_to_string(log_event)
        if log_event.notify_user:
            pass

    def OnViewLog(self, event):
        pass
