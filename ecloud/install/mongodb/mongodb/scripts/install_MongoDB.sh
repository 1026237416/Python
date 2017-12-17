#!/usr/bin/env bash

function install_mongodb ()
{
	check_install_mongodb_tag
	prepare_mongodb_system
	install_mongodb_server
	setting_mongodb_server
	write_install_mongodb_tag
}

function check_install_mongodb_tag()
{
	if [ -f  ${install_tag_path}/install_mongodb.tag ]
    then
        echo -e "\033[41;37mThe prepare system operation has been performed.\033[0m"
        info_log "The prepare system operation has been performed."
        exit 1
    else
        normal_info "#######################################################################################"
        normal_info "###                         Start install Mongo DataBase node                       ###"
        normal_info "#######################################################################################"

        if  [ ! -d ${install_tag_path} ]
        then
            mkdir -p ${install_tag_path}
        fi
    fi
}

function install_mongodb_server()
{
	yum install -y mongodb-server mongodb
	check_command "Install MongoDB server"
}

function setting_mongodb_server()
{
	sed -i  "s/bind_ip.*/bind_ip = localhost/g" /etc/mongodb.conf
	sed -i  "s/#smallfiles.*/smallfiles = true/g" /etc/mongodb.conf
	
	systemctl enable mongod.service
	systemctl start mongod.service
	
	firewall-cmd --zone=public --add-port=27017/tcp --permanent  1>/dev/null 2>&1 
	systemctl restart firewalld.service 
}

function write_install_mongodb_tag ()
{
    normal_info "#######################################################################################"
    normal_info "###                     Install Mongo DataBase Successful                           ###"
    normal_info "#######################################################################################"
	echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_mongodb.tag
}