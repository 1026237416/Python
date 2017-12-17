#!/usr/bin/env bash

##########################################################################
#  Define basic variables
##########################################################################

cd $(dirname "$0")

system_release="CentOS Linux release"
system_version="7.1.1503"

TOP_DIR=`pwd`
INSTALL_PATH=${TOP_DIR}/management

install_tag_path=/etc/ecloud/install_tag
display_length=75
INSTALL_LOG_PATH=.
INSTALL_LOG_FILE=install.log
EVS_STORAGE_TYPE_NAME=EVS_Storages

SHARE_DIR=/opt/ecloud/share
LOCAL_ECLOUD_DIR=/opt/ecloud
ECLOUD_VERSION=5.1.0.1


##########################################################################
#  Global variables
##########################################################################
Management_host_ip=""
DataBase_host_ip=""
RabbitMQ_host_ip=""
MongoDB_host_ip=""
Redis_host_ip=""
using_local_storage=""
using_evs_storage=""
Evs_manage_ip=""
Evs_pool_name=""
create_nfs_file_system=""
share_file_system_type=""
share_file_system_path=""
DataCenter_Name=""
Master_DataCenter=""
Master_DataCenter_Manage_ip=""
Master_DataCenter_DataBase_ip=""
Master_DataCenter_Redis_ip=""
ldap_enable=""
ldap_dns=""
ldap_auth_domain=""
ldap_auth_user=""

##########################################################################
# Check the integrity of the installation package
##########################################################################
USER_NAME=`whoami`
if  [ ${USER_NAME} != root ]
then
	printf "\033[41;37m%s \033[0m\n" "You must execute this script by root user."
	exit 1
fi


if [ ! -n "$(cat /etc/redhat-release | grep "${system_release}")" ];
then
    printf "\033[41;37m%s\033[0m\n" "Check OS type is: $(cat /etc/redhat-release),not $system_release,please check!"
    exit 1
else
    if [ ! -n "$(cat /etc/redhat-release | grep "${system_version}")" ];
    then
        printf "\033[41;37m%s\033[0m\n" "Check OS version is: $(cat /etc/redhat-release),not ${system_version},please check!"
        exit 1
    fi
fi

if  [ ! -f ${TOP_DIR}/install.conf ]
then
	printf "\033[41;37m%s\033[0m\n" "Not find install.conf file in ${INSTALL_PATH},Please check!"
	exit 1
fi

check_conf_result=`file ${TOP_DIR}/install.conf | grep "CRLF"`
if [ ! -z "${check_conf_result}" ];
then
    printf "\033[41;37m%s \033[0m\n" "Check install.conf with CRLF line terminators,please check!"
    exit 1
fi

printf "\033[1;32m%s \033[0m\n" "Your install.conf has the following contents:"
cat ${TOP_DIR}/install.conf | grep -v ^# | grep -v '^$'
printf "\033[1;32m%s \033[0m" "Please confirm those value, 'y': next steps, 'n': exit. [Default: 'y']:"

function ensure_config ()
{
	read  check_choose
	if [ -z "${check_choose}" ];
	then
		check_choose=y
	fi
	case ${check_choose} in
		y)
			printf "\033[1;32m%s\033[0m"
		;;
		n)
			exit 1
		;;
		*)
			printf "\033[1;43m%s\033[0m" "Your input error, Please input again:"
			ensure_config
		;;
	esac
}
ensure_config


if [ ! -f "${TOP_DIR}/management.cs" ];
then
    printf "\033[41;37m%s \033[0m\n" "Not find md5 check sum file,please check!"
    exit 1
else
    package_cs=`cat ${TOP_DIR}/management.cs | awk '{print$1}'`
    package_name=`cat ${TOP_DIR}/management.cs | awk '{print$2}'`
    if [ ! -f "${package_name}" ];
    then
        printf "\033[41;37m%s \033[0m\n" "Not find ${package_name} file in $PWD,Please check!"
        exit 1
    else
        package_cs_md5=`md5sum ${package_name} | awk '{print$1}'`
        if [ "${package_cs}" != "${package_cs_md5}" ];
        then
            printf "\033[41;37m%s \033[0m\n" "Check file ${package_name} md5 sum error,Please check!"
            exit 1
        else
            if [ -d "management" ];
            then
                rm -rf management
            fi

            tar xzvfm ${package_name}
            if [ "$?" != 0 ];
            then
                printf "\033[41;37m%s \033[0m\n" "Unpacking file ${package_name} error,Please check!"
                exit 1
            fi
        fi
    fi
fi

if  [ ! -f ${INSTALL_PATH}/scripts/common.sh ]
then
    printf "\033[41;37m%s \033[0m\n" "Not find common.sh file in ${INSTALL_PATH}/scripts/,Please check!"
	exit 1
fi

if  [ ! -f ${INSTALL_PATH}/scripts/install_management.sh ]
then
    printf "\033[41;37m%s \033[0m\n" "Not find install_management.sh file in ${INSTALL_PATH}/scripts/,Please check!"
	exit 1
fi

source ${INSTALL_PATH}/scripts/common.sh
source ${INSTALL_PATH}/scripts/install_management.sh

##########################################################################
# Reading and checking install.conf file
##########################################################################
if  [ ! -d ${install_tag_path} ]
then
	mkdir -p ${install_tag_path}
fi

#检查配置的主机信息
read_conf Management_host_ip Management_host_ip
read_conf DataBase_host_ip DataBase_host_ip
read_conf RabbitMQ_host_ip RabbitMQ_host_ip
read_conf MongoDB_host_ip MongoDB_host_ip
read_conf Redis_host_ip Redis_host_ip

check_exist=`ifconfig | grep "${Management_host_ip}"`
if [ ! -n "${check_exist}" ];
then
    error_info "Check configure Management node IP address not exist in this node,please execute install command in management node."
    error_log "Not execute install command at management node"
    exit 1
else
    info_log "Find Management IP address successful."
fi

check_and_ping_ip ${DataBase_host_ip} "DataBase host"
check_and_ping_ip ${RabbitMQ_host_ip} "RabbitMQ host"
check_and_ping_ip ${MongoDB_host_ip}  "MongoDB host"
check_and_ping_ip ${Redis_host_ip}    "Redis host"

#检查配网卡信息中的物理网卡信息
for NIC in $(cat ${TOP_DIR}/install.conf | grep ^physical_nic | cut -d= -f2);
do
    check_nic=`ip addr | grep -w ${NIC}`
    if [ -z "${check_nic}" ];
    then
        error_info "Not find NIC ${NIC} in this node, please check your install.conf file."
        error_log "Not find NIC ${NIC} in this node, please check your install.conf file."
        exit 1
    fi
done

#检查配置的存储信息
read_conf using_local_storage using_local_storage
read_conf using_evs_storage using_evs_storage
case ${using_local_storage} in
y)
    info_log "Get the key 'using_local_storage' is 'y',using local Storage."
;;
n)
    info_log "Get the key 'using_local_storage' is 'n',not using local Storage."
;;
*)
    error_info "Your Config the key 'using_local_storage' is error,please check!"
    error_log "Your Config the key 'using_local_storage' is error"
    exit 1
;;
esac

case ${using_evs_storage} in
y)
    info_log "Get the key 'using_evs_storage' is 'y',need setting Easted EvStorage."

    read_conf Evs_manage_ip Evs_manage_ip
    read_conf Evs_pool_name Evs_pool_name
    check_and_ping_ip ${Evs_manage_ip} "EVS Management node"
;;
n)
    info_log "Get the key 'using_evs_storage' is 'n',not using Easted EvStorage."
;;
*)
    error_info "Your Config the key 'using_evs_storage' is error,please check!"
    error_log "Your Config the key 'using_evs_storage' is error"
    exit 1
;;
esac

#检查配置的共享文件系统信息
create_nfs_file_system=n
case ${create_nfs_file_system} in
y)
    info_log "User config using NFS share file system."
;;
n)
    info_log "User config don't using NFS share file system, check user config other share file system."
;;
*)
    error_info "Your install.conf file error,'create_nfs_file_system' only 'y' or 'n',please check it!"
    error_log "Your install.conf file error,'create_nfs_file_system' only 'y' or 'n',stop install!"
    exit 1
;;
esac

#检查配置的数据中心信息
read_conf DataCenter_Name DataCenter_Name
read_conf Master_DataCenter Master_DataCenter
case ${Master_DataCenter} in
y)
	info_log "Install Master DataCenter."
;;
n)
    info_log "Install Slave DataCenter."
    read_conf Master_DataCenter_Manage_ip   Master_DataCenter_Manage_ip
    read_conf Master_DataCenter_DataBase_ip Master_DataCenter_DataBase_ip
    read_conf Master_DataCenter_Redis_ip    Master_DataCenter_Redis_ip

    check_and_ping_ip ${Master_DataCenter_Manage_ip}   "Master DC Management node"
    check_and_ping_ip ${Master_DataCenter_DataBase_ip} "Master DC DataBase node"
    check_and_ping_ip ${Master_DataCenter_Redis_ip}    "Master DC Redis node"
;;
*)
    error_info "Your install.conf file error,'Master_DataCenter' only 'y' or 'n',please check it!"
    error_log "Your install.conf file error,'Master_DataCenter' only 'y' or 'n',stop install!"
    exit 1
;;
esac

read_conf ldap_enable ldap_enable
case ${ldap_enable} in
y)
    info_log "Get user setting ldap_enable is 'y',start reading related information of ldap"

    read_conf ldap_dns         ldap_dns
    read_conf ldap_auth_domain ldap_auth_domain
    read_conf ldap_auth_user   ldap_auth_user

    check_and_ping_ip ${ldap_dns} "LDAP DNS server host"
;;
n)
    info_log "Get user setting ldap_enable is 'n'"
;;
*)
    error_info "Get field ldap_enable configuration error, please check your install.conf file!"
    info_log "Get field ldap_enable configuration error,Stop install!"
    exit 1
;;
esac

iaas_install_menu
