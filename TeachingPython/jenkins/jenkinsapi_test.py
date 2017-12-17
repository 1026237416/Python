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
    @time: 2017/4/16 10:34
"""

from jenkinsapi.jenkins import Jenkins

test_xml = """
<project>
  <actions/>
  <description/>
  <keepDependencies>false</keepDependencies>
  <properties>
    <hudson.model.ParametersDefinitionProperty>
      <parameterDefinitions>
        <hudson.model.StringParameterDefinition>
          <name>Branch</name>
          <description/>
          <defaultValue>%s</defaultValue>
        </hudson.model.StringParameterDefinition>
      </parameterDefinitions>
    </hudson.model.ParametersDefinitionProperty>
  </properties>
  <scm class="hudson.scm.NullSCM"/>
  <canRoam>true</canRoam>
  <disabled>false</disabled>
  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
  <triggers/>
  <concurrentBuild>false</concurrentBuild>
  <builders>
    <hudson.tasks.Shell>
      <command>xxxxxxx</command>
    </hudson.tasks.Shell>
  </builders>
  <publishers/>
  <buildWrappers/>
</project>

"""


def get_server_instance():
    server = Jenkins("http://localhost:8080", "liping", "liping1114")
    return server


def get_job_details():
    """Get job details of each job that is running on the Jenkins instance"""
    server = get_server_instance()
    for job_name, job_instance in server.get_jobs():
        print 'Job Name:%s' % job_instance.name
        print 'Job Description:%s' % (job_instance.get_description())
        print 'Is Job running:%s' % (job_instance.is_running())
        print 'Is Job enabled:%s' % (job_instance.is_enabled())


def get_plugin_details():
    # Refer Example #1 for definition of function 'get_server_instance'
    server = get_server_instance()
    for plugin in server.get_plugins().values():
        print "========================================================================================================"
        print "Short Name:%s" % plugin.shortName
        print "Long Name:%s" % plugin.longName
        print "Version:%s" % plugin.version
        print "URL:%s" % plugin.url
        print "Active:%s" % plugin.active
        print "Enabled:%s" % plugin.enabled


if __name__ == "__main__":
#    get_plugin_details()
    server = get_server_instance()
    print server.baseurl
    print server.base_server_url()
    print server.get_nodes()
    print server.create_job("py_test", xml=test_xml)
