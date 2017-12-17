#!/usr/bin/env python
import os
import shutil
from subprocess import call
import logging
import tarfile
import urllib2


def extract_current(file_name, path=None):
    ex_path = file_name.replace('.tar.gz', '')
    tfile = tarfile.open(file_name)
    if path:
        tfile.extractall(path=ex_path)
    else:
        tfile.extractall()
    tfile.close()
    os.chdir(ex_path)


def download_to_path(path, file_url):
    f = open('/var/log/manor-init.log', 'a+')
    f.write('download form :' + file_url + '\n')
    f.close()
    if os.path.exists(path):
        shutil.rmtree(path)

    os.makedirs(path)

    os.chdir(path)

    file_name = get_file_name(file_url)

    u = urllib2.urlopen(file_url)
    f = open(file_name, 'wb')
    meta = u.info()
    file_size = int(meta.getheaders("Content-Length")[0])
    print "Downloading: %s Bytes: %s" % (file_name, file_size)

    file_size_dl = 0
    block_sz = 8192
    while True:
        file_buffer = u.read(block_sz)
        if not file_buffer:
            break

        file_size_dl += len(file_buffer)
        f.write(file_buffer)
        status = r"%10d  [%3.2f%%]" % (
            file_size_dl, file_size_dl * 100. / file_size)
        status += chr(8) * (len(status) + 1)
        print status,

    f.close()


def get_file_name(file_url):
    return file_url.split('/')[-1]


# init user name and password,and ssh ...
print 'manor ... userdata init username and ssh authentication ...'
logging.info('manor ... userdata init username and ssh authentication ...')

shell = """
#!/bin/sh
adduser manor --gecos "First Last,RoomNumber,WorkPhone,HomePhone" --disabled-password
passwd manor<<EOF
manor
manor
EOF
sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/g' /etc/ssh/sshd_config
service ssh restart
"""
call(shell, shell=True)

sudo_file = """
## Allow root to run any commands anywhere
root    ALL=(ALL)       ALL
manor   ALL=(ALL)       ALL
"""
with open('/etc/sudoers', 'w+') as f:
    f.write(sudo_file)

resolv_file = """
nameserver 114.114.114.114
"""
with open('/etc/resolv.conf', 'w+') as f:
    f.write(resolv_file)

source_list = """
deb http://mirrors.aliyun.com/ubuntu/ trusty main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ trusty-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ trusty-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ trusty-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ trusty-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ trusty main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ trusty-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ trusty-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ trusty-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ trusty-backports main restricted universe multiverse
"""
with open('/etc/apt/sources.list', 'w+') as f:
    f.write(source_list)

install_pip = """
#!/bin/sh
echo 'Dpkg::Progress-Fancy "1";' >>/etc/apt/apt.conf.d/99progressbar
apt-get update -y >>/var/log/manor-init.log
apt-get install build-essential python-dev -y >>/var/log/manor-init.log
apt-get install python-pip -y  >>/var/log/manor-init.log
"""
call(install_pip, shell=True)

call('pip install tornado >>/var/log/manor-init.log', shell=True)
call('pip install futures >>/var/log/manor-init.log', shell=True)
call('pip install redis >>/var/log/manor-init.log', shell=True)

with open('/var/log/manor-init.log', 'a+') as f:
    f.write('manor ... init manor client ... \n')

client_url = 'http://169.254.169.254:4042/files/_#url'
download_to_path('/tmp/manor/init_client', client_url)
extract_current(get_file_name(client_url), path=True)
call('./install.sh')

with open('/var/log/manor-init.log', 'a+') as f:
    f.write('done ... !')
