# -*- coding:utf-8 -*-

'''
Changed by lill
2018年6月3日
'''

import datetime
import time
import os
import re
import platform

from Queue import Queue

from robot.output import LEVELS
from robot.utils import robottime

from testrunner import TestRunner
from robotide.contrib.testrunner import runprofiles

STYLE_STDERR = 2


def _RunProfile(name, run_prefix):
    return type('Profile', (runprofiles.PybotProfile,),
                {'name': name, 'get_command': lambda self: run_prefix})


class TestRunnerPlugin(object):  # 平台测试案例运行
    """A plugin for running tests from within RIDE"""
    report_regex = re.compile("^Report: {2}(.*\.html)$", re.MULTILINE)
    log_regex = re.compile("^Log: {5}(.*\.html)$", re.MULTILINE)

    def __init__(self, application=None):
        self._reload_timer = None
        self._report_file = None
        self._log_file = None
        self._running = False
        self._initialize_for_running()
        # 当前执行的关键字
        self._currently_executing_keyword = None
        self._test_runner = TestRunner()
        self._names_to_run = set()
        self._progress_bar = ProgressBar()

    def enable(self):
        self._test_runner.enable(self._post_result)
        self._set_stopped()

    def disable(self):
        self._test_runner.clear_server()

    def OnClose(self, evt):
        '''关闭正在运行的服务和流程'''
        self._test_runner.kill_process()
        self._test_runner.shutdown_server()

    def OnStop(self):
        """当用户单击“停止”按钮时调用,这将向正在运行的进程发送一个信号,与从控件开始运行时输入control-c的效果相同命令行。"""
        self._AppendText('[ SENDING STOP SIGNAL ]\n', source='stderr')
        self._test_runner.send_stop_signal()

    def OnPause(self):
        self._AppendText('[ SENDING PAUSE SIGNAL ]\n')
        self._test_runner.send_pause_signal()

    def OnContinue(self):
        self._AppendText('[ SENDING CONTINUE SIGNAL ]\n')
        self._test_runner.send_continue_signal()

    def OnStepNext(self, event):
        self._AppendText('[ SENDING STEP NEXT SIGNAL ]\n')
        self._test_runner.send_step_next_signal()

    def OnStepOver(self, event):
        self._AppendText('[ SENDING STEP OVER SIGNAL ]\n')
        self._test_runner.send_step_over_signal()

    def OnRun(self, case_name, first_dir_path):
        '''运行'''
        argfile = self._test_runner._output_dir + 'argfile.txt'
        if '.Main.' in case_name:
            name_run = set([(case_name.decode('utf-8'))])
        else:
            # 测试时ESBDemo.ESBDemo，正式的是Main.main
            name_run = set([(case_name.decode('utf-8') + u'.Main.main')])
        print("***************************************************************")
        print "run_name:", name_run
        print("***************************************************************")
        dir_path = os.path.join(first_dir_path, case_name)
        print("***************************************************************")
        print "dir_path:", dir_path
        print("***************************************************************")
        command = self._create_command(name_run, dir_path)
        print("***************************************************************")
        print("Run command: ", command)
        print("***************************************************************")

        argfile_path = command.split(" ")[2]
        self.html_path = os.path.dirname(argfile_path)
        print("***************************************************************")
        print "html path:", self.html_path
        print("***************************************************************")

        self._log_file = os.path.join(
            self.html_path, "report", "ShowReportPage.html")
        print("***************************************************************")
        print self._log_file
        print("***************************************************************")
        self._output("command: %s\n" % command)
        try:
            self._test_runner.run_command(command, dir_path)
            self._set_running()
            self._progress_bar.Start()
            self.OnTimer()
        except Exception, e:
            self._set_stopped()
            print unicode(e)

    def _create_command(self, name_run, dir_path):
        '''
        name_run是运行的案例文件名称，dir_path是案例保存的路径
        '''
        command_as_list = self._test_runner.get_command(
            [],
            '60',
            name_run,
            dir_path)
        print("***************************************************************")
        print "command_as_list:", command_as_list
        print("***************************************************************")

        self._min_log_level_number = self._test_runner.get_message_log_level(
            command_as_list)  ###2
        print("***************************************************************")
        print "_min_log_level_number:", self._min_log_level_number
        print("***************************************************************")

        command = self._format_command(command_as_list)
        return command

    def _get_current_working_dir(self):
        profile = self.get_current_profile()
        if profile.name == runprofiles.CustomScriptProfile.name:
            return profile.get_cwd()
        if not os.path.isdir(self.model.suite.source):
            return os.path.dirname(self.model.suite.source)  #############
        return self.model.suite.source

    def _format_command(self, argv):
        '''Quote a list as if it were a command line command

        This isn't perfect but seems to work for the normal use
        cases. I'm not entirely sure what the perfect algorithm
        is since *nix and windows have different quoting
        behaviors.
        '''
        result = []
        for arg in argv:
            if "'" in arg or " " in arg or "&" in arg:
                # for windows, if there are spaces we need to use
                # double quotes. Single quotes cause problems
                result.append('"%s"' % arg)
            elif '"' in arg:
                result.append("'%s'" % arg)
            else:
                result.append(arg)
        return " ".join(result)

    def _can_start_running_tests(self):
        if self._running:  # or self.model.suite is None:
            return False

        if self.auto_save:  # or self._ask_user_to_save_before_running():
            self.save_all_unsaved_changes()
            return True
        return False

    def _initialize_for_running(self):
        self._report_file = self._log_file = None
        self._messages_log_texts = Queue()

    def OnProcessEnded(self, evt):
        '''Changed by lill
        2018年6月09日
        '''
        self._set_stopped()
        self._progress_bar.Stop()
        now = datetime.datetime.now()
        self._output(
            "\ntest_case finished %s" % robottime.format_time(now.timetuple()))
        self._test_runner.command_ended()

    def OnTimer(self):
        """循环等待运行结束
        """
        if not self._test_runner.is_running():
            self.OnProcessEnded(None)
            return
        else:
            time.sleep(5)
            self.OnTimer()

    def GetLastOutputChar(self):
        '''Return the last character in the output window'''
        pos = self.out.PositionBefore(self.out.GetLength())
        char = self.out.GetCharAt(pos)
        return chr(char)

    def _AppendText(self, string, source="stdout"):
        try:
            print string  ##############可以返给运行的状态
        except UnicodeDecodeError, e:
            # I'm not sure why I sometimes get this, and I don't know what I can
            # do other than to ignore it.
            pass

        if source == "stderr":
            pass

    def _output(self, string, source="stdout"):
        '''将输出放到文本控件中'''
        self._AppendText(string, source)

    def _post_result(self, event, *args):
        '''侦听器接口的端点，这是通过监听器接口调用的。它有一个事件，例如“start_suite”，
        “start_test”等，以及关于事件的元数据。我们使用这些数据进行更新这棵树和状态栏'''
        if event == 'start_test':
            self._handle_start_test(args)
        if event == 'end_test':
            self._handle_end_test(args)
        if event == 'report_file':
            self._handle_report_file(args)
        if event == 'log_file':
            self._handle_log_file(args)
        if event == 'start_keyword':
            self._handle_start_keyword(args)
        if event == 'end_keyword':
            self._handle_end_keyword()
        if event == 'log_message':
            self._handle_log_message(args)
        if event == 'paused':
            self._append_to_message_log('<<  PAUSED  >>')
        if event == 'continue':
            self._append_to_message_log('<< CONTINUE >>')

    def _handle_start_test(self, args):
        longname = args[1]['longname']
        self._append_to_message_log('Starting test_case: %s' % longname)

    def _append_to_message_log(self, text):
        self._messages_log_texts.put(text)

    def _handle_end_test(self, args):
        longname = args[1]['longname']
        self._append_to_message_log('Ending test_case:   %s\n' % longname)
        if args[1]['status'] == 'PASS':
            self._progress_bar.add_pass()
        else:
            self._progress_bar.add_fail()

    def _handle_report_file(self, args):
        self._report_file = args[0]

    def _handle_log_file(self, args):
        self._log_file = '\\'.join(args[0].split('\\')[
                                   :-1]) + '\\report\\ShowReportPage.html'  # args[0]
        if platform.system() == "Linux":
            self._log_file = self._log_file.replace(r"\\", "/")

    def _handle_start_keyword(self, args):
        self._progress_bar.set_current_keyword(args[0])

    def _handle_end_keyword(self):
        self._progress_bar.empty_current_keyword()

    def _handle_log_message(self, args):
        a = args[0]
        if LEVELS[a['level']] >= self._min_log_level_number:
            prefix = '%s : %s : ' % (a['timestamp'], a['level'].rjust(5))
            message = a['message']
            if '\n' in message:
                message = '\n' + message
            self._messages_log_texts.put(prefix + message)

    def _set_running(self):
        self._running = True
        self._test_runner.test_execution_started()

    def _set_stopped(self):
        self._running = False


class ProgressBar():
    '''A progress bar for the test_case runner plugin'''

    def __init__(self, judge=0):
        self._nowtime = time
        self._initialize_state()
        self.judge = judge

    def _initialize_state(self):
        self._pass = 0
        self._fail = 0
        self._current_keywords = []

    def set_current_keyword(self, name):
        self._current_keywords.append(name)

    def empty_current_keyword(self):
        if self._current_keywords:
            self._current_keywords.pop()

    def OnTimer(self, event):
        '''计时器事件的处理程序;它更新状态栏'''
        self._update_message()

    def Start(self):
        '''Signals the start of a test_case run; initialize progressbar.'''
        self._initialize_state()
        self._start_time = self._nowtime.time()
        print 'time start: ', time.strftime('%Y-%m-%d %H:%M:%S',
                                            time.localtime(self._start_time))

    def Stop(self):
        '''Signals the end of a test_case run'''
        self._stop_time = self._nowtime.time()
        print 'time stop: ', time.strftime('%Y-%m-%d %H:%M:%S',
                                           time.localtime(self._stop_time))
        print 'total time: ', self._stop_time - self._start_time
        self._update_message()

    def add_pass(self):
        '''Add one to the passed count'''
        self._pass += 1

    def add_fail(self):
        '''Add one to the failed count'''
        self._fail += 1

    def _update_message(self):
        '''Update the displayed elapsed time, passed and failed counts'''
        elapsed = self._nowtime.time() - self._start_time
        # if self.judge:
        # message = u"运行结果"
        # else:
        message = u"elapsed time: %s     pass: %s     fail: %s" % (
        secondsToString(elapsed), self._pass, self._fail)
        message += self._get_current_keyword_text()

        # not sure why this is required, but without it the background
        # colors don't look right on Windows

    def _get_current_keyword_text(self):
        if not self._current_keywords:
            return ''
        return '     current keyword: ' + self._fix_size(
            ' -> '.join(self._current_keywords), 50)

    def _fix_size(self, text, max_length):
        if len(text) <= max_length:
            return text
        return '...' + text[3 - max_length:]


# 从网上获取的代码
def secondsToString(t):
    '''将秒数转换为HH:MM:SS的字符串'''
    return "%d:%02d:%02d" % \
           reduce(lambda ll, b: divmod(ll[0], b) + ll[1:],
                  [(t,), 60, 60])
