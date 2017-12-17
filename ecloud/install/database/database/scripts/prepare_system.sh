#!/usr/bin/env bash

system_release="CentOS Linux release"
system_version="7.1.1503"

function prepare_database_system ()
{
    check_system
	check_datadase_hostname
	setting_yum_source
	# update_OS
}

#***********************************************************************************************************************
#                           check system release version
#***********************************************************************************************************************
function check_system ()
{
	tuned-adm profile virtual-host
    SYSTEM_INFO=`cat /etc/redhat-release`
    info_log "Get system release information is: '${SYSTEM_INFO}'"

    TYPE_INFO=`echo ${SYSTEM_INFO}    | grep "${system_release}"`
	VERSION_INFO=`echo ${SYSTEM_INFO} | grep "${system_version}"`

	if [ ! -n "${TYPE_INFO}" ];
    then
		echo "Check OS type is:${SYS_INFO},not $system_release,please check!"
		info_log "Check OS type is not $system_release."
		exit
	else
		info_log "Check OS release type through."

		if [ ! -n "$VERSION_INFO" ];
		then
			echo "Check OS version is:${SYS_INFO},not ${system_version},please check!"
			info_log "Check OS version is ${SYS_INFO},not ${system_version}."
			exit
		else
			info_log "Check OS version through."
		fi
	fi
}

function check_datadase_hostname ()
{
	get_hostname=`cat /etc/hostname`
	if [ "${get_hostname}" = "localhost.localdomain" ];
	then
		echo "Your hostname is \"localhost\",you must setting hostname frist."
		read -p "please input hostname for system [Default:DataBase] :" setting_hostname
		if  [ -z ${setting_hostname}  ]
		then 
			echo "DataBase" > /etc/hostname
		else
			echo "${setting_hostname}" > /etc/hostname
		fi
		hostname $(cat /etc/hostname)
	fi
	host_name=`hostname`
	if [ "${host_name}" == "localhost" ];
	then
	    hostname $(cat /etc/hostname)
	fi
}

#***********************************************************************************************************************
#                           setting yum sources
#***********************************************************************************************************************
function setting_yum_source ()
{
	cp -r /etc/yum.repos.d /etc/yum.repos.d.bak
	rm -rf /etc/yum.repos.d/*
	info_log "Backup and Delete local repo file."
	
	echo "[mariadb]" > /etc/yum.repos.d/mariadb.repo
	echo "name=mariadb" >> /etc/yum.repos.d/mariadb.repo
	echo "baseurl=file:///mnt/mariadb" >> /etc/yum.repos.d/mariadb.repo
	echo "gpgcheck=0" >> /etc/yum.repos.d/mariadb.repo
	echo "enabled=1" >> /etc/yum.repos.d/mariadb.repo
	echo "proxy=_none_" >> /etc/yum.repos.d/mariadb.repo
	
	tar xzvfm ${INSTALL_PATH}/packages/mariadb.tar.gz -C /mnt
}

function update_OS()
{
	echo "================================================================================================"
	echo "                                  Update mariadb node                                           "
	echo "================================================================================================"
	
	sed -i 's/SELINUX=.*/SELINUX=disabled/g' `grep ^SELINUX= -rl /etc/selinux/config`
	info_log "Set $CONFIG_MANAGEMENT_IP /etc/selinux/config file SELINUX=enforcing to SELINUX=disabled."
	setenforce 0
	info_log "Close $CONFIG_MANAGEMENT_IP selinux service"
	
	info_log "Update management node."
	yum -y update --skip-broken  | tee -a ${LOG_FILE}
	info_log "Update management OK"
	
	
	systemctl stop NetworkManager           > /dev/null 2>&1
	systemctl stop iptables.service         > /dev/null 2>&1
	systemctl stop firewalld.service        > /dev/null 2>&1
	systemctl disable NetworkManager        > /dev/null 2>&1
	systemctl disable iptables.service      > /dev/null 2>&1
	systemctl disable firewalld.service     > /dev/null 2>&1
	
	
	yum remove -y ntpdate
	yum install -y ntp
}
