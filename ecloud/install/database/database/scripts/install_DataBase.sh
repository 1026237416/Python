#!/usr/bin/env bash

function install_database()
{
	check_prepare_tag
	prepare_database_system
	set_OS_DB_passwd
	install_mariaDB
	write_install_database_tag
}


function check_prepare_tag ()
{
    if [ -f  ${install_tag_path}/install_mariadb.tag ]
    then
        echo -e "\033[41;37mThe prepare system operation has been performed.\033[0m"
        info_log "The prepare system operation has been performed."
        exit 1
    else
        normal_info "#######################################################################################"
        normal_info "###                            Start install Database node                          ###"
        normal_info "#######################################################################################"

        if  [ ! -d ${install_tag_path} ]
        then
            mkdir -p ${install_tag_path}
        fi
    fi
}


function install_mariaDB ()
{
	yum install -y mariadb mariadb-server MySQL-python
	check_command "Install mariadb mariadb-server MySQL-python"
	
	# rm -rf /etc/my.cnf.d/server.cnf
	# check_command "Delete local mariadb_openstack.cnf file."
	# cp -a ${INSTALL_PATH}/etc/server.cnf /etc/my.cnf.d/server.cnf


	#start mariadb
	systemctl enable mariadb.service
	check_command "Enable mariadb.service start on boot "
	systemctl start mariadb.service 
	check_command "Start mariadb.service"
	
	mysql_secure_installation <<EOF

y
${OS_DB_PASSWD}
${OS_DB_PASSWD}
y
y
y
y
2> /dev/null
EOF
	check_command "Initialize database"
	
	iptables -I INPUT  -p udp --dport 3306 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 3306 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 3306 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 3306 -j ACCEPT
	iptables-save > /etc/sysconfig/iptables
	
	firewall-cmd --zone=public --add-port=3306/tcp --permanent  1>/dev/null 2>&1  
	systemctl restart firewalld.service
	
	mysql -uroot -p${OS_DB_PASSWD} -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '${OS_DB_PASSWD}' WITH GRANT OPTION;"
	mysql -uroot -p${OS_DB_PASSWD} -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' IDENTIFIED BY '${OS_DB_PASSWD}' WITH GRANT OPTION;"

	cp /etc/my.cnf /etc/my.cnf.bak
	echo "" > /etc/my.cnf
	cat	${INSTALL_PATH}/etc/my.cnf  >> /etc/my.cnf
	
	systemctl restart mariadb.service 
}


set_OS_DB_passwd()
{
    printf "\033[1;32mPlease setting IAAS platform database password,and ensure the password must be greater than 8 characters.\033[0m\n"
    printf "\033[1;32mPlease input your password: \033[0m"
	OS_DB_PASSWD_FRIST=
	while : ;do
		char=`
			stty cbreak -echo
			dd if=/dev/tty bs=1 count=1 2>/dev/null
			stty -cbreak echo
		`
		if [ "$char" =  "" ];then
			break
		fi
		OS_DB_PASSWD_FRIST="$OS_DB_PASSWD_FRIST$char"
		echo -n "*"
	done
	echo
	
	passwd_length=`echo ${#OS_DB_PASSWD_FRIST}`
	if [ 8 -le "${passwd_length}" ];
	then
	    info_log "Check openstack database password length is greater than 8 characters.check pass "
	else
	    printf "\033[1;4;31mThe password less than 8 characters,please reset it.\033[0m\n"
	    info_log "The password less than 8 characters"
	    set_OS_DB_passwd
	fi
	
	printf "\033[1;32mPlease input again: \033[0m"
	OS_DB_PASSWD_SECONE=
	while : ;do
		char=`
			stty cbreak -echo
			dd if=/dev/tty bs=1 count=1 2>/dev/null
			stty -cbreak echo
		`
		if [ "$char" =  "" ];then
			break
		fi
		OS_DB_PASSWD_SECONE="$OS_DB_PASSWD_SECONE$char"
		echo -n "*"
	done
	echo
	info_log "User Input second OS DB password is ${OS_DB_PASSWD_SECONE}"
	if [ "${OS_DB_PASSWD_FRIST}" != "${OS_DB_PASSWD_SECONE}" ];
	then
		printf "\033[1;4;31mThe password and confirmation password are different,please reset it.\033[0m\n"
		info_log "The password and confirmation password are different."
		set_OS_DB_passwd
	else
	    info_log "The password and confirmation password are identical."
	    OS_DB_PASSWD=${OS_DB_PASSWD_SECONE}
        info_log "OS DB password is ${OS_DB_PASSWD}"
	fi
	
	check_passwd_result=`echo ${OS_DB_PASSWD} | grep '@'`
	if [ -z "${check_passwd_result}" ];
	then
		info_log "Check DB password pass"
	else
		printf "\033[1;4;31mThe password is invalid,please reset it.\033[0m\n"
		info_log "The password is invalid"
	    set_OS_DB_passwd
	fi
}


#***********************************************************************************************************************
#                           write install tag
#***********************************************************************************************************************
function write_install_database_tag ()
{
    normal_info "#######################################################################################"
    normal_info "###                            Install DataBase Successful                          ###"
    normal_info "#######################################################################################"
    echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_mariadb.tag
}
