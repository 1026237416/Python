#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: ??
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: jenkinsapi_test.py
    @time: 2017/4/11 22:01
"""

from jenkinsapi.jenkins import Jenkins
import jenkins


class CJenkinsAPI():
    __doc__ = '''Usage: \t\tCJenkinsAPI.createProject\t\tCJenkinsAPI.triggerBuild\t\t'''

    """
    均采用同步设置超时机制
    """
    _strConfigTemplatePath = ""
    _strConfigDataPath = ""

    def __init__(self):
        import pycurl
        pass

    def __del__(self):
        pass

    """
    创建项目（createProject）：
        输入：
            configid：
            planid：
        返回：
            N/A
    """

    @staticmethod
    def createProject(nPlanId, strConfigId):
        # 用于测试的初始参数值
        nPlanId = 14
        strConfigId = "D1057406"

        # 返回
        nRet, strMsg, nBuild = 0, "", 0

        # 配置文件模板
        strConfigTemplate = CJenkinsAPI._strConfigTemplatePath + "/config.templates.xml"

        # 用PlanID和配置ID来作为项目名
        strProjectName = "P%d-%s" %(nPlanId, strConfigId)

        # 访问数据库得到构建节点IP和SVN
        strBuildNodeIP = ""
        strProjectSVN = ""

        oProxy = CSqlProxy("10.129.145.112", "ci_test", "ci_test", "ci_plat")

    """
    创建任务（triggerBuild）：
        输入：
            configid：
            planid：
        返回：
            返回码：msg buildid
        额外动作：不写SQL
    查询任务：（infoBuild）
        输入参数：
            configid ：
            planid ：
            taskid ：
        返回:
            返回码 msg buildid  
        额外动作：结束更新SQL（包括成功或失败），未结束则不处理
    终止任务：（stopBuild）
        输入参数：
            configid 
            planid 
            taskid  
        返回:
            返回码 msg buildid  
        额外动作：终止成功写SQL
    """
