#!/usr/bin/env bash

display_length=75
INSTALL_LOG_PATH=.
INSTALL_LOG_FILE=install.log

function install_redis ()
{
	check_install_redis_tag
	prepare_redis_system
	install_redis_server
	setting_redis_server
	write_install_redis_tag
}


function check_install_redis_tag()
{
	if [ -f  ${install_tag_path}/install_redis.tag ]
    then
        echo -e "\033[41;37mThe prepare system operation has been performed.\033[0m"
        info_log "The prepare system operation has been performed."
        exit 1
    else
        normal_info "#######################################################################################"
        normal_info "###                             Start install Redis-server                          ###"
        normal_info "#######################################################################################"

        if  [ ! -d ${install_tag_path} ]
        then
            mkdir -p ${install_tag_path}
        fi
    fi
}
function install_redis_server()
{
	yum install -y redis
	check_command "Install redis service"
}

function setting_redis_server()
{
	iptables -I INPUT  -p udp --dport 6379 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 6379 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 6379 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 6379 -j ACCEPT
	iptables-save > /etc/sysconfig/iptables

	sed -i "s/daemonize no/daemonize yes/" /etc/redis.conf
	
	firewall-cmd --zone=public --add-port=6379/tcp --permanent   1>/dev/null 2>&1 
	systemctl restart firewalld.service
	
	echo  "redis-server &"  >> /etc/rc.d/rc.local
	
	chmod +x /etc/rc.d/rc.local                         1>/dev/null 2>&1  
	systemctl enable rc-local.service                   1>/dev/null 2>&1
	
	redis-server & 1>/dev/null 2>&1
	sleep 10
	
}

#***********************************************************************************************************************
#                           write install tag
#***********************************************************************************************************************
function write_install_redis_tag ()
{
	normal_info "#######################################################################################"
    normal_info "###                           Install Redis-server Successful                       ###"
    normal_info "#######################################################################################"
    echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_redis.tag
}