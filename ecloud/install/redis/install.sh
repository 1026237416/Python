#!/usr/bin/env bash

cd $(dirname "$0")

INSTALL_PATH=$PWD/redis
TOP_DIR=`pwd`


install_tag_path=/etc/ecloud/install_tag

USER_NAME=`whoami`
if  [ ${USER_NAME} != root ]
then
	echo -e "\033[41;37mYou must execute this script by root. \033[0m"
	exit
fi

if [ ! -f "${TOP_DIR}/redis.cs" ];
then
    printf "\033[41;37m%s \033[0m\n" "Not find md5 check sum file,please check!"
    exit 1
else
    package_cs=`cat ${TOP_DIR}/redis.cs | awk '{print$1}'`
    package_name=`cat ${TOP_DIR}/redis.cs | awk '{print$2}'`
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
            if [ -d "redis" ];
            then
                rm -rf redis
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
source ${INSTALL_PATH}/scripts/install_Redis.sh
source ${INSTALL_PATH}/scripts/prepare_system.sh

install_redis
reboot_os