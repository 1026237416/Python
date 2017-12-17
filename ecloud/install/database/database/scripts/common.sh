#!/usr/bin/env bash

function info_log ()
{
	DATE_N=`date "+%Y-%m-%d %H:%M:%S"`
	USER_N=`whoami`
	echo "${DATE_N} ${USER_N} execute [INFO] $0 $@" >>${INSTALL_LOG_PATH}/${INSTALL_LOG_FILE}
}
#错误日志信息
function error_log ()
{
	DATE_N=`date "+%Y-%m-%d %H:%M:%S"`		#获取时间
	USER_N=`whoami`							#获取用户
	echo -e "\033[41;37m${DATE_N} ${USER_N} execute [ERROR] $0 $@ \033[0m"  >>${INSTALL_LOG_PATH}/${INSTALL_LOG_FILE}
}

function normal_info()
{
    printf "\033[1;32m%s \033[0m\n" "$1"
}

function warn_info()
{
    printf "\033[1;43m%s \033[0m\n" "$1"
}

function error_info()
{
    printf "\033[41;37m%s \033[0m\n" "$1"
}


function check_command ()
{
    command_result=$?
	info=$1
	other_info=""
	length=`echo ${#info}`
    other_length=$((${display_length}-${length}))

    for ((i=0;${i}<=${other_length};i+=1))
    do
        other_info=.${other_info}
    done

	if [ "${command_result}" -eq 0  ]
	then
		info_log "$@ succeeded."
		printf "\033[32m${info}${other_info}succeeded. \033[0m \n"
	else
		error_log "$@ failed."
		printf "\033[41;37m${info}${other_info}...failed. \033[0m \n"
		exit
	fi
}

function check_variable_result()
{
	check_info=$1
	check_value=$2
	
	if  [ -z "${check_value}" ]
	then
		echo -e "\033[41;37mGet ${check_info} value is Null,Please check.\033[0m"
		error_log "${check_info} value is Null,Please check."
#		exit 1
	else
		info_log "${check_info} value is: ${check_value}"
	fi
}

function check_yum_source()
{
	if  [ -f /etc/yum.repos.d/compute.repo ]
	then
		info_log "Check repo file passed."
	else 
		echo -e "\033[41;37mCan't find compute.repo file,please check!033[0m"
		error_log "Can't find compute.repo file."
		exit 1
	fi
}


function get_database_passwd ()
{
	read -p "Please input the database root user access password: " DATABASE_PASSWD
	ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"quit\""
    if [[ $? -eq 0 ]]
    then
        info_log "Access DataBase Successful."
    else
        echo -e "\033[1;4;31mAccess DataBase Faild, Please input again.\033[0m"
        info_log "Connect IAAS Platform DataBase Faild."
        get_database_passwd
    fi
}

function reboot_os()
{
	echo -e -n "\033[43;31mWe need reboot system, please input your choose[Default:'y']:\033[0m"
	read user_choose
	
	if [ -z "${user_choose}" ];
	then
		user_choose=y
	fi
	
	case ${user_choose} in
		y)
			echo -e "\033[43;31mStart reboot system,please wait......\033[0m"
			reboot
		;;
		n)
			info_log "user choose not reboot system."
		;;
		*)
			echo -e "\033[43;31myour input error,please input again.\033[0m"
			reboot_os
		;;
	esac
}