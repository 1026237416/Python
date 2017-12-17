#!/usr/bin/env bash
cd $(dirname "$0")

INSTALL_PATH=$PWD/compute
TOP_DIR=`pwd`

system_release="CentOS Linux release"
system_version="7.1.1503"
install_tag_path=/etc/ecloud/install_tag
XML_DIR=/opt/xml

display_length=75
INSTALL_LOG_PATH=.
INSTALL_LOG_FILE=install.log
EVS_STORAGE_TYPE_NAME=EVS_Storages

SHARE_DIR=/opt/ecloud/share
LOCAL_ECLOUD_DIR=/opt/ecloud


##########################################################################
#  Global variables
##########################################################################
Management_host_ip=""
Compute_host_ip=""
using_evs_storage=""
Evs_manage_ip=""
Evs_pool_name=""
create_nfs_file_system=""
share_file_system_type=""
share_file_system_path=""



USER_NAME=`whoami`
if  [ ${USER_NAME} != root ]
then
	echo -e "\033[41;37mYou must execute this script by root. \033[0m"
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
	echo -e "\033[41;37mNot find install.conf file in $PWD,Please check! \033[0m"
	exit 1
fi

check_conf_result=`file ${TOP_DIR}/install.conf | grep "CRLF"`
if [ ! -z "${check_conf_result}" ];
then
    printf "\033[41;37m%s \033[0m\n" "Check install.conf with CRLF line terminators,please check!"
    exit 1
fi


# Reading and checking install.conf file
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


if [ ! -f "${TOP_DIR}/compute.cs" ];
then
    printf "\033[41;37m%s \033[0m\n" "Not find md5 check sum file,please check!"
    exit 1
else
    package_cs=`cat ${TOP_DIR}/compute.cs | awk '{print$1}'`
    package_name=`cat ${TOP_DIR}/compute.cs | awk '{print$2}'`
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
            if [ -d "compute" ];
            then
                rm -rf compute
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


source ${INSTALL_PATH}/scripts/common.sh
source ${INSTALL_PATH}/scripts/install_compute.sh
source ${INSTALL_PATH}/scripts/prepare_system.sh

read_conf Management_host_ip Management_host_ip
read_conf Compute_host_ip Compute_host_ip

check_and_ping_ip ${Management_host_ip} "Management host ip"


check_result=`ifconfig | grep "${Compute_host_ip}"`
if [ ! -n "${check_result}" ];
then
	echo "Check configure Compute node IP address '${Compute_host_ip}' not exist in this node,please check!!!"
	error_log "Not execute install command at Compute node"
	exit
else
	info_log "Find Compute IP address successful."
fi 


#检查配网卡信息中的物理网卡信息
for NIC in $(cat ${TOP_DIR}/install.conf | grep ^physical_nic | cut -d= -f2);
do
    check_nic=`ip addr | grep -w ${NIC}`
    if [ -z "${check_nic}" ];
    then
        error_info "Not find ${NIC} in this node, please check your install.conf file."
        error_log "Not find ${NIC} in this node, please check your install.conf file."
        exit 1
    fi
done

read_conf using_evs_storage using_evs_storage
case ${using_evs_storage} in
y)
    info_log "Get the key 'using_evs_storage' is 'y',need setting Easted EvStorage."
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
#read_conf create_nfs_file_system create_nfs_file_system
create_nfs_file_system=n




install_compute
reboot_os