#!/usr/bin/env python
import os
from subprocess import call

shell="""
#!/bin/sh
passwd root<<EOF
password
password
EOF
adduser manor
passwd manor<<EOF
manor
manor
EOF
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config
service sshd restart
"""
call(shell,shell=True)

sudo_file="""
## Allow root to run any commands anywhere
root    ALL=(ALL)       ALL
manor   ALL=(ALL)       ALL
"""
with open('/etc/sudoers','w+') as f:
    f.write(sudo_file)

resolv_file="""
nameserver 114.114.114.114
nameserver 4.4.4.4
nameserver 8.8.8.8
"""
with open('/etc/resolv.conf','w+') as f:
    f.write(resolv_file)

shell="""
rm -rf /tmp/files.txt
"""
call(shell,shell=True)
shell="""
rm -rf /tmp/pip
"""
call(shell,shell=True)
shell="""
echo 'download pip resources offline...'>>/var/log/manor-init.log
curl http://169.254.169.254:4042/files/pip/files.txt >> /tmp/files.txt
mkdir /tmp/pip
"""
call(shell,shell=True)

with open('/tmp/files.txt')as file:
    while True:
        line=file.readline()
        line=line.replace('\n','')
        if line:
            shell="""curl http://169.254.169.254:4042/files/pip/%s>>/tmp/pip/%s"""%(
                line,line)
            print shell
            call(shell,shell=True)
        if not line:
            break

shell="""
echo 'setup local rpm sources...'>>/var/log/manor-init.log
rm -f /etc/yum.repos.d/*
"""
call(shell,shell=True)

repo_file="""[Manor]
name=Manor Yum
baseurl=http://169.254.169.254:4042/files/rpms
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7
"""
with open('/etc/yum.repos.d/CentOS-Manor.repo','w+') as f:
    f.write(repo_file)

shell="""
echo 'install gcc offline...'>>/var/log/manor-init.log
yum makecache>>/var/log/manor-init.log
yum install --disablerepo=\* --enablerepo=Manor  gcc -y>>/var/log/manor-init.log
yum install --disablerepo=\* --enablerepo=Manor  vim -y>>/var/log/manor-init.log

echo 'install pip offline...'>>/var/log/manor-init.log
curl http://169.254.169.254:4042/files/pip/pip-8.1.1.tar.gz >> /tmp/pip-8.1.1.tar.gz
cd /tmp
tar zxvf pip-8.1.1.tar.gz
cd pip-8.1.1
python setup.py install
echo 'pip installed ..'

echo 'download cowbell instance...'>>/var/log/manor-init.log
mkdir /opt/ecloud
curl http://169.254.169.254:4042/files/_#url >> /opt/ecloud/_#url
echo 'unzip cowbell file'>>/var/log/manor-init.log
tar zxvf /opt/ecloud/_#url -C /opt/ecloud
mkdir /etc/systemd/system/ecloud-client.service.d
"""

# for test ...
# shell=shell.replace('_#url','ecloud-client-centos.tar.gz')

call(shell,shell=True)

shell="""
echo 'install ecloud-client dependent'
pip install --no-index --find-links=/tmp/pip  tornado>>/var/log/manor-init.log
pip install --no-index --find-links=/tmp/pip  redis>>/var/log/manor-init.log
pip install --no-index --find-links=/tmp/pip  futures>>/var/log/manor-init.log
pip install --no-index --find-links=/tmp/pip  pexpect>>/var/log/manor-init.log
"""
call(shell,shell=True)

unitFile="""
[Service]
ExecStart=/usr/bin/python /opt/ecloud/python/launch.py -f /opt/ecloud/conf
"""
with open('/etc/systemd/system/ecloud-client.service.d/ecloud-client.conf',
          'w+') as f:
    f.write(unitFile)

service_file="""
[Unit]
Description=ecloud-client
[Install]
WantedBy=multi-user.target
"""
with open('/etc/systemd/system/ecloud-client.service','w+') as f:
    f.write(service_file)

shell="""
systemctl daemon-reload
systemctl enable ecloud-client
systemctl start ecloud-client
"""
call(shell,shell=True)

script_path='/tmp/manor'
if not os.path.exists(script_path):
    os.makedirs(script_path)

shell="""
echo 'disabled cloud-init'>>/var/log/manor-init.log
#!/bin/bash
mkdir -p /etc/systemd/system/back
mv /etc/systemd/system/multi-user.target.wants/cloud* /etc/systemd/system/back/
echo 'Done!...'>>/var/log/manor-init.log
"""
call(shell,shell=True)
