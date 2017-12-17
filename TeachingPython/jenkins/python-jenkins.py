#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: ??
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: python-jenkins.py
    @time: 2017/4/14 21:53
"""

import jenkins
from jenkinsapi.jenkins import Jenkins
import ConfigParser

config_file = "jenkins.ini"
xml = ""


def menu():
    dis_menu = """
========================================================
    1) Show Jenkins server info
    2) Show all of Jenkins project
    3) Show Jenkins project info
    4) Create Jenkins project
    5) Built Jenkins job
    
========================================================
    """
    permit_choose = ("1", "2", "3", "4", "5")
    print dis_menu
    user_choose = raw_input("Please input your choose:")
    if user_choose not in permit_choose:
        print "Your input is error, please input again! "
        menu()
    return int(user_choose)


class jenkins_tools():
    def __init__(self, url, user, passwd, xml):
        self.url = url
        self.user = user
        self.passwd = passwd
        self.xml = xml

    def __conn_jenkins_server(self):
        try:
            server = jenkins.Jenkins(self.url, self.user, self.passwd)
            return server
        except Exception:
            print "Connecting Jenkins server %s failed!" % self.url
            return None

    def show_all_project(self):
        server = self.__conn_jenkins_server()
        print server
        if server:
            print server.get_all_jobs()


if __name__ == "__main__":
    server = jenkins.Jenkins("http://localhost:8080", username="liping", password="3133070cde7dd9caef7de57aeabb7f00")
    server.get_version()
    """
    nBuild = Jenkins("http://localhost:8080", "liping", "3133070cde7dd9caef7de57aeabb7f00")
    for plugin in nBuild.get_plugins().values():
        print plugin


    file_obj = ConfigParser.ConfigParser()
    file_obj.read(config_file)
    for sec in file_obj.sections():
        if sec == "server":
            jenkins_host = file_obj.get(sec, "host")
            jenkins_user = file_obj.get(sec, "user")
            jenkins_passwd = file_obj.get(sec, "passwd")

    user_choose = menu()

    test_jen = jenkins_tools(jenkins_host,jenkins_user,jenkins_passwd,xml)

    if user_choose == 1:
        print("User choose is:%d" % user_choose)
    elif user_choose == 2:
        test_jen.show_all_project()
        print("User choose is:%d" % user_choose)
    elif user_choose == 3:
        print("User choose is:%d" % user_choose)
    elif user_choose == 4:
        print("User choose is:%d" % user_choose)
    elif user_choose == 5:
        print("User choose is:%d" % user_choose)
    elif user_choose == 6:
        print("User choose is:%d" % user_choose)
        """

