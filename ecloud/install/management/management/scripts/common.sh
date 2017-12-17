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


function read_conf()
{
    match_field=$1
    local __result=$2
    local __value=`cat ${TOP_DIR}/install.conf | grep -w ^${match_field} | cut -d= -f2 | sed 's/^[ \t]*//g' | sed 's/[ \t]*$//g'`
    info_log "Get field ${match_field} from install.conf is: ${__value}"
    if [ -z "${__value}" ];
    then
        error_info "Get field ${match_field} value is null, please check your install.conf file."
        error_log "Get field ${match_field} value is null, stop install."
        exit 1
    else
        eval ${__result}="'${__value}'"
    fi
}

function display_info()
{
	info=$1
	other_info=""
	length=`echo ${#info}`
	other_length=$((${display_length}-${length}))
	for ((i=0;${i}<=${other_length};i+=1))
	do
		other_info=.${other_info}
	done
	printf "%s%s" "${info}" "${other_info}"
}

function check_and_ping_ip()
{
:<<!
    param1:test_connect_host
    param2:display information
!
    local host_address=$1
    local info="$2"

    check_result=`echo ${host_address} | awk -F '.' '{ if(($1>256||$1<0)||($2>256||$2<0)||($3>256||$3<0)||($4>256||$4<0)) print 1}'`
    if [ -n "${check_result}" ];
    then
        error_info "Check configure "${info}" ${host_address} is invalid,please check your install.conf file."
        error_log "Check configure "${info}" ${host_address} is invalid,stop install"
        exit 1
    else
        info_log "Check configure "${info}" ${host_address} is necessary."
        ping -c 2 ${host_address} >/dev/null
	    check_command "Try connecting "${info}" ${host_address}"
    fi
}

function ping_test_connect()
{
:<<!
    param1:will test connect host ip address
    param2:display information
!
    host_address=$1
    info=$2
    ping -c 2 ${host_address} >/dev/null
	check_command "Try connecting ${info} ${host_address}"
}

function set_ssh_access()
{
:<<!
    param1:will test connect host ip address
!
    set_ssh_host=$1
    ssh -o NumberOfPasswordPrompts=0 ${set_ssh_host} "date" > /dev/null 2>&1
    if [ $? = 0 ];
    then
        info_log "Check to host ${set_ssh_host} SSH no password access already clear."
    else
        ssh-copy-id  ${set_ssh_host}
        ssh -o NumberOfPasswordPrompts=0 ${set_ssh_host} "date" > /dev/null 2>&1
        if [ $? = 0 ];
        then
            info_log "Set to host ${set_ssh_host} SSH no password access successful."
            normal_info "Set to host ${set_ssh_host} SSH no password access successful."
        else
            error_info "Set to host ${set_ssh_host} SSH no password access failed, please check."
            error_log "Set to ${set_ssh_host} SSH no password access failed, please check."
            exit 1
        fi
    fi
}

function check_yum_source()
{
	if  [ -f /etc/yum.repos.d/iaas.repo ]
	then
		info_log "Check repo file passed."
	else 
		error_info "Can't find iaas.repo file,please check!"
		error_log "Can't find iaas.repo file."
		exit 1
	fi
}

function add_DNS_host_info()
{
:<<!
    param1: host ip address
    param2: host name
!
    local host_ip=$1
    local host_name=$2
    check_nfs_value=`cat /var/named/ecloud.easted.com.cn.zone | grep ${host_ip} | grep ${host_name}`
    if [ -z "${check_nfs_value}" ];
    then
        echo "${host_name}      IN  A   ${host_ip}"  >> /var/named/ecloud.easted.com.cn.zone
    fi
}

function read_password()
{
:<<!
    param1: will return var
    param2: will display info
!
    local __result=$1
    local __info="$2"

    printf "\033[1;32m%s\033[0m" "${__info}"

    local __DATABASE_PASSWD=
    while : ;do
        char=`
            stty cbreak -echo
            dd if=/dev/tty bs=1 count=1 2>/dev/null
            stty -cbreak echo
        `
        if [ "$char" =  "" ];then
            break
        fi
        __DATABASE_PASSWD="$__DATABASE_PASSWD$char"
        echo -n "*"
    done
    echo

    eval ${__result}="'${__DATABASE_PASSWD}'"
}


function verify_DB_root_password()
{
:<<!
    param1:will test connect DB host ip address or hostname
    param2:will test connect DB root password
    param3:callback function name
!
    local __DB_HOST=$1
    local __DATABASE_PASSWORD=$2
    local __CALLBACK_FN=$3

    ssh ${__DB_HOST} "mysql -uroot -p${__DATABASE_PASSWORD} -e \"quit\""
    if [[ $? -eq 0 ]]
    then
        info_log "Verify DataBase ${__DB_HOST} root user access password Successful."
        normal_info "Verify DataBase ${__DB_HOST} root user access password Successful."
    else
        warn_info "Verify DataBase ${__DB_HOST} root user access password Failed, please input again!"
        info_log "Verify DataBase ${__DB_HOST} root user access password Failed."
        ${__CALLBACK_FN}
    fi
}


function get_database_passwd ()
{
	if [ -z "${DATABASE_PASSWD}" ];
	then
		read_password DATABASE_PASSWD "Please input the database root user access password:"
		verify_DB_root_password ${DataBase_host_ip} ${DATABASE_PASSWD} get_database_passwd
	else
		if [ ! -f ${install_tag_path}/auto_install.tag ]
		then
			ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"quit\""
			if [[ $? -eq 0 ]]
			then
				info_log "Access DataBase Successful."
			else
				read_password DATABASE_PASSWD "Please input the database root user access password:"
				verify_DB_root_password ${DataBase_host_ip} ${DATABASE_PASSWD} get_database_passwd
			fi	
		else
			info_log "Auto install, not need input password."
		fi
	fi
}

function get_master_DB_passwd()
{
    if [ "${Master_DataCenter}" == n ];
	then
	    if [ -z "${MASTER_DB_PASSWORD}" ];
	    then
            read_password MASTER_DB_PASSWORD "Please input your master DataCenter DataBase root user access password:"
            verify_DB_root_password ${Master_DataCenter_DataBase_ip} ${MASTER_DB_PASSWORD} get_master_DB_passwd
	    else
            if [ ! -f ${install_tag_path}/auto_install.tag ]
            then
                mysql -h${Master_DataCenter_DataBase_ip} -uroot -p${MASTER_DB_PASSWORD} -e "quit"
                if [[ $? -eq 0 ]]
                then
                    info_log "Access master DC DataBase Successful."
                else
                    read_password MASTER_DB_PASSWORD "Please input your master DataCenter DataBase root user access password:"
                    verify_DB_root_password ${Master_DataCenter_DataBase_ip} ${MASTER_DB_PASSWORD} get_master_DB_passwd
                fi
            fi
        fi
    fi
}

function get_host_info ()
{
	Management_host_name=`hostname --fqdn`
	info_log "Get Management node hostname is: ${Management_host_name}"
	
	DataBase_host_name=`ssh ${DataBase_host_ip} "cat /etc/hostname"`
	info_log "Get DataBase node ${DataBase_host_ip} hostname is:\"${DataBase_host_name}\""
	
	RabbitMQ_host_name=`ssh ${RabbitMQ_host_ip} "cat /etc/hostname"`
	info_log "Get RabbitMQ node ${RabbitMQ_host_ip} hostname is:\"${RabbitMQ_host_name}\""
	
	MongoDB_host_name=`ssh ${MongoDB_host_ip} "cat /etc/hostname"`
	info_log "Get DataBase node ${MongoDB_host_ip} hostname is:\"${MongoDB_host_name}\""
	
	Redis_host_name=`ssh ${Redis_host_ip} "cat /etc/hostname"`
	info_log "Get DataBase node ${Redis_host_ip} hostname is:\"${Redis_host_name}\""
	
	if [ "${using_evs_storage}" = "y" ];
	then
		evs_host_name=`ssh ${Evs_manage_ip} "cat /etc/hostname"`
        info_log "Get DataBase node ${Evs_manage_ip} hostname is:\"${evs_host_name}\""
	fi

	if [ "${Master_DataCenter}" == n ];
	then
	    Master_DataCenter_Manage_hostname=`ssh ${Master_DataCenter_Manage_ip} "cat /etc/hostname"`
        info_log "Get Master DataCenter management node ${Master_DataCenter_Manage_ip} hostname is:\"${Master_DataCenter_Manage_hostname}\""
        Master_DataCenter_DataBase_hostname=`ssh ${Master_DataCenter_DataBase_ip} "cat /etc/hostname"`
        info_log "Get Master DataCenter DataBase node ${Master_DataCenter_DataBase_ip} hostname is:\"${Master_DataCenter_DataBase_hostname}\""
	fi
}


function reboot_os()
{
    printf "\033[1;43m%s\033[0m" "We need reboot system, please input your choose[Default:'y']:"
	read user_choose
	
	if [ -z "${user_choose}" ];
	then
		user_choose=y
	fi
	
	case ${user_choose} in
		y)
		    normal_info "Start reboot system,please wait......"
			reboot
		;;
		n)
			info_log "user choose not reboot system."
		;;
		*)
		    warn_info "Your input error,please input again."
			reboot_os
		;;
	esac
}