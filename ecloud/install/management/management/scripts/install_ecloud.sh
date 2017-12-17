#!/usr/bin/env bash
LOCAL_ECLOUD_DIR=${LOCAL_ECLOUD_DIR}
install_tag_path=${install_tag_path}

function install_ecloud ()
{
	check_install_ecloud_tag
	get_host_info
	get_database_passwd
	get_ldap_access_passwd
	get_master_DB_passwd
	setting_ecloud_admin_passwd
	setting_ecloud_package
	setting_manor_package
	setting_ecloud_database
	setting_ecloud_user
	install_ecloud_requirements
	setting_ecloud_service

	write_install_ecloud_tag
}


function check_install_ecloud_tag ()
{	
	if [ -f  ${install_tag_path}/install_keystone.tag ]
	then 
		info_log "Check keystone have installed ."
	else
		echo -e "\033[41;37mYou should install keystone first. \033[0m"
		iaas_install_menu
	fi
	
	if [ -f ${install_tag_path}/install_cinder.tag ]
	then
		info_log "Check cinder have installed ."
	else
		echo -e "\033[41;37mYou should install cinder first. \033[0m"
		iaas_install_menu
	fi
	
	if [ -f  ${install_tag_path}/install_nova_controller.tag ]
	then 
		info_log "Check nova controller service have installed ."
	else
		echo -e "\033[41;37mYou should install nova controller service first. \033[0m"
		iaas_install_menu
	fi
	
	if [ -f ${install_tag_path}/install_glance.tag ]
	then
		info_log "Check glance have installed ."
	else
		echo -e "\033[41;37mYou should install glance first. \033[0m"
		iaas_install_menu
	fi
	
	if [ -f ${install_tag_path}/install_neutron.tag ]
	then
		info_log "Check neutron have installed ."
	else
		echo -e "\033[41;37mYou should install neutron first. \033[0m"
		iaas_install_menu
	fi
	
	if [ -f ${install_tag_path}/install_ceilometer.tag ]
	then
		info_log "Check ceilometer have installed ."
	else
		echo -e "\033[41;37mYou should install ceilometer first. \033[0m"
		iaas_install_menu
	fi

	if [ -f  ${install_tag_path}/install_ecloud.tag ]
	then 
		echo -e "\033[41;37mThe install ecloud operation has been performed.\033[0m"
		info_log "you had install neutron."	
		iaas_install_menu
	fi

	normal_info "#######################################################################################"
	normal_info "###                           Start Install Ecloud Platform                         ###"
	normal_info "#######################################################################################"
	USER_PASSWD=`cat  /etc/keystone/admin_token`
	OS_DB_PASSWD=`cat /etc/keystone/admin_token`
	ADMIN_TOKEN=`cat  /etc/keystone/admin_token`

	OS_USERNAME=`cat ~/keystonerc_admin    | grep OS_USERNAME    | cut -d= -f2`
	OS_PASSWORD=`cat ~/keystonerc_admin    | grep OS_PASSWORD    | cut -d= -f2`
	OS_REGION_NAME=`cat ~/keystonerc_admin | grep OS_REGION_NAME | cut -d= -f2`
	OS_TENANT_NAME=`cat ~/keystonerc_admin | grep OS_TENANT_NAME | cut -d= -f2`
}

function get_ldap_access_passwd()
{
    if [ ${ldap_enable} == "y" ];
	then
	    read_password ldap_auth_pass "Please input LDAP '${ldap_auth_domain}' auth domain '${ldap_auth_user}' user access password:"
	    info_log "Get user input ldap '${ldap_auth_domain}' auth domain '${ldap_auth_user}' user password is ${ldap_auth_pass}"

        check_ldap_dns=`cat /etc/resolv.conf | grep '${ldap_dns}'`
        if [ -z "${check_ldap_dns}" ];
        then
            echo "nameserver ${ldap_dns}" >> /etc/resolv.conf
            info_log "Setting ldap dns to /etc/resolv.conf file"
        fi
	fi
}


function setting_ecloud_admin_passwd()
{
    if [ "${Master_DataCenter}" == y ];
	then
        normal_info "Please Setting Ecloud platform ecloud user password,and ensure the password must be greater than 8 characters."
        local __PASSWORD_ONE=
        read_password __PASSWORD_ONE "Please input your password:"

        passwd_length=`echo ${#__PASSWORD_ONE}`
        if [ 8 -le "${passwd_length}" ];
        then
            info_log "Check Ecloud platform admin password length is greater than 8 characters.check pass "
        else
            warn_info "The password less than 8 characters,please reset it."
            info_log "The password less than 8 characters"
            setting_ecloud_admin_passwd
        fi

        local __PASSWORD_TWO=
        read_password __PASSWORD_TWO "Please input again:"

        if [ "${__PASSWORD_ONE}" != "${__PASSWORD_TWO}" ];
        then
            warn_info "The password and confirmation password are different,please reset it."
            info_log "The password and confirmation password are different."
            setting_ecloud_admin_passwd
        else
            info_log "The password and confirmation password are identical."
            ECLOUD_ADMIN_PASSWD=${__PASSWORD_TWO}
        fi
    fi
}

setting_ecloud_package()
{
	rm -rf ${LOCAL_ECLOUD_DIR}/{download,etc,manor,python,web,bin}
	info_log "Remove all of old ${LOCAL_ECLOUD_DIR} diretctory file."

	mkdir -p ${LOCAL_ECLOUD_DIR}                   1>/dev/null 2>&1
	mkdir -p ${LOCAL_ECLOUD_DIR}/bin/packages

	# Setting ecloud diretctory
	if [ -f ${INSTALL_PATH}/packages/ecloud/ecloud-${ECLOUD_VERSION}.tar ];
	then
		info_log "check Ecloud code package done"
	else
		error_info "Not find ecloud code package in '${INSTALL_PATH}/packages/ecloud/',please check!"
		error_log "Not find ecloud code package in '${INSTALL_PATH}/packages/ecloud/'"
		exit
	fi

	tar xfm ${INSTALL_PATH}/packages/ecloud/ecloud-${ECLOUD_VERSION}.tar -C ${LOCAL_ECLOUD_DIR}
	check_command "Unpacking ecloud package"
	mv -f ${LOCAL_ECLOUD_DIR}/ecloud-${ECLOUD_VERSION}/* ${LOCAL_ECLOUD_DIR}
	rm -rf ${LOCAL_ECLOUD_DIR}/ecloud-${ECLOUD_VERSION}

	sed -i 's/\r//' ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf

	if [ "${Master_DataCenter}" == y ];
	then
	    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_keystone mysql://root:${DATABASE_PASSWD}@${DataBase_host_ip}:3306/keystone
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_global   mysql://root:${DATABASE_PASSWD}@${DataBase_host_ip}:3306/ecloud_common
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_redis    mysql://root:${DATABASE_PASSWD}@${Redis_host_ip}:6379/15
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf keystone auth_url    http://${Management_host_ip}:5000/v2.0/tokens
	else
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_keystone mysql://root:${MASTER_DB_PASSWORD}@${Master_DataCenter_DataBase_ip}:3306/keystone
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_global   mysql://root:${MASTER_DB_PASSWORD}@${Master_DataCenter_DataBase_ip}:3306/ecloud_common
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_redis    mysql://root:${DATABASE_PASSWD}@${Master_DataCenter_Redis_ip}:6379/15
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf keystone auth_url    http://${Master_DataCenter_Manage_ip}:5000/v2.0/tokens
	fi

	crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_local    mysql://root:${DATABASE_PASSWD}@${DataBase_host_ip}:3306/ecloud
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_nova     mysql://root:${DATABASE_PASSWD}@${DataBase_host_ip}:3306/nova
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_cinder   mysql://root:${DATABASE_PASSWD}@${DataBase_host_ip}:3306/cinder
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_glance   mysql://root:${DATABASE_PASSWD}@${DataBase_host_ip}:3306/glance
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf database db_neutron  mysql://root:${DATABASE_PASSWD}@${DataBase_host_ip}:3306/neutron
    #[keystore]
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf keystone username    ${OS_USERNAME}
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf keystone password    ${OS_PASSWORD}
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf keystone tenant_name ${OS_TENANT_NAME}
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf keystone region_name ${OS_REGION_NAME}
    #[network]
	network_names=`crudini --get ${TOP_DIR}/install.conf network_info network_name`
	info_log "Get all of network name is: ${network_names}"
	for network_name in ${network_names//,/ }
	do
		bridge_name=`crudini --get ${TOP_DIR}/install.conf ${network_name} bridge_name`
		info_log "Get ${network_name}'s bridge name is: ${bridge_name}."
		phy_nic=`crudini --get ${TOP_DIR}/install.conf ${network_name} physical_nic`
		info_log "Get bridge '${bridge_name}' corresponding physical_nic is: '${phy_nic}'"
		Bridge_port=${Bridge_port},${network_name}:${bridge_name}:${phy_nic}
	done
	Bridge_port=`echo ${Bridge_port} | sed 's/^[,]*//g'`
	crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf network bridge_port  ${Bridge_port}
	# [storage]
	crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf storage share_storage_access ${Management_host_name}
    # [meter]
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf meter mongodb_server ${MongoDB_host_ip}
    # [message]
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf message url amqp://guest:guest@${RabbitMQ_host_ip}:5672/%2F
    # [service]
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf service network ${Management_host_ip}
	if [ "${using_evs_storage}" = "y" ];
	then
		crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf service storage ${Evs_manage_ip}
	else
		crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf service storage 
	fi
    # [ldap]
	if [ ${ldap_enable} == "y" ];
	then
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf ldap enable      True
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf ldap auth_domain ${ldap_auth_domain}
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf ldap auth_user   ${ldap_auth_user}
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf ldap auth_pass   ${ldap_auth_pass}
    else
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf ldap enable False
	fi

	ECLOUD_LOG_DIR=`cat ${LOCAL_ECLOUD_DIR}/etc/ecloud.conf | grep file_path | cut -d = -f 2 | sed 's/^[ \t]*//g' | sed 's/[ \t]*$//g'`
	info_log "Get ecloud log dir is:$ECLOUD_LOG_DIR"
	if [ ! -d ${ECLOUD_LOG_DIR} ];
	then
		mkdir -p ${ECLOUD_LOG_DIR}
		info_log "Creat ${ECLOUD_LOG_DIR} diretctory"
	fi
	chmod -R 777 ${ECLOUD_LOG_DIR}
	info_log "Create ecloud log dir."

	cp ${LOCAL_ECLOUD_DIR}/etc/remove_compute_node  ${LOCAL_ECLOUD_DIR}/bin
	cp ${LOCAL_ECLOUD_DIR}/etc/upload_win_dirver    ${LOCAL_ECLOUD_DIR}/bin
	sed -i "1iLOCAL_ECLOUD_DIR=${LOCAL_ECLOUD_DIR}" ${LOCAL_ECLOUD_DIR}/bin/upload_win_dirver
	chmod -R 777 ${LOCAL_ECLOUD_DIR}/bin/remove_compute_node
	chmod -R 777 ${LOCAL_ECLOUD_DIR}/bin/upload_win_dirver
	cp ${INSTALL_PATH}/etc/glance/virtio-win-0.1.126.iso ${LOCAL_ECLOUD_DIR}/bin/packages
}

function setting_manor_package()
{
	mkdir ${LOCAL_ECLOUD_DIR}/manor             1>/dev/null 2>&1
	mkdir ${LOCAL_ECLOUD_DIR}/manor/app         1>/dev/null 2>&1
	mkdir ${LOCAL_ECLOUD_DIR}/manor/instance    1>/dev/null 2>&1

	# Setting Manor diretctory
	MANOR_PACKAGE_NAME=`ls ${INSTALL_PATH}/packages/manor | grep 'ecloud-manor-.*.tar'`
	if [ -z "${MANOR_PACKAGE_NAME}" ];
	then
		error_info "Not find manor code package in '${INSTALL_PATH}/packages/manor/ecloud-manor-.*.tar',please check!!!"
		error_log "Not find manor code package in '${INSTALL_PATH}/packages/manor/ecloud-manor-.*.tar'"
		exit
	else
		info_log "Get manor code package name is: ${MANOR_PACKAGE_NAME}"
	fi

	tar xfm ${INSTALL_PATH}/packages/manor/${MANOR_PACKAGE_NAME} -C ${LOCAL_ECLOUD_DIR}/manor/
	check_command "Unpacking manor package"
	sed -i 's/\r//' ${LOCAL_ECLOUD_DIR}/manor/etc/conf
	stable_download_dir=`cat ${LOCAL_ECLOUD_DIR}/manor/etc/conf | grep download | cut -d= -f2 | sed 's/^[ \t]*//g' | sed 's/[ \t]*$//g'`

	mkdir -p ${stable_download_dir}         1>/dev/null 2>&1
	mkdir -p ${stable_download_dir}/edp     1>/dev/null 2>&1

	tar xzfm ${INSTALL_PATH}/packages/manor/pip.tar.gz  -C ${stable_download_dir}
	tar xzfm ${INSTALL_PATH}/packages/manor/rpms.tar.gz -C ${stable_download_dir}
	cp  -r  ${INSTALL_PATH}/packages/manor/app/*          ${LOCAL_ECLOUD_DIR}/manor/app
	mv  -f  ${LOCAL_ECLOUD_DIR}/manor/*.tar.gz            ${stable_download_dir}

	#manor.conf
	#[app]
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf app template_path  ${LOCAL_ECLOUD_DIR}/manor/app
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf app streamlet_path ${LOCAL_ECLOUD_DIR}/etc/streamlets
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf app instance_path  ${LOCAL_ECLOUD_DIR}/manor/instance
	#[heat]
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf heat end_point   http://${Management_host_ip}:8004/v1
    if [ "${Master_DataCenter}" = "y" ];
	then
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf heat auth_url    http://${Management_host_ip}:5000/v2.0
    else
        crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf heat auth_url    http://${Master_DataCenter_DataBase_ip}:5000/v2.0
    fi
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf heat region      ${OS_REGION_NAME}
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf heat username    ${OS_USERNAME}
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf heat password    ${OS_PASSWORD}
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf heat tenant_name ${OS_TENANT_NAME}
	#[db]
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf db host ${DataBase_host_ip}
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf db user manor
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf db password ${OS_DB_PASSWD}
    crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf db db_name manor
	#[redis]
	crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf redis host ${Redis_host_ip}
    #[log]
	crudini --set ${LOCAL_ECLOUD_DIR}/etc/manor.conf log level ERROR

	#manor/etc/conf
	crudini --set ${LOCAL_ECLOUD_DIR}/manor/etc/conf redis      host ${Redis_host_ip}
	crudini --set ${LOCAL_ECLOUD_DIR}/manor/etc/conf log        path ${ECLOUD_LOG_DIR}
	crudini --set ${LOCAL_ECLOUD_DIR}/manor/etc/conf log        file ${ECLOUD_LOG_DIR}/ecloud-manor.log
	crudini --set ${LOCAL_ECLOUD_DIR}/manor/etc/conf stable_log file ${ECLOUD_LOG_DIR}/ecloud-stable.log
}

function setting_ecloud_database ()
{
	if [ "${Master_DataCenter}" = "y" ];
	then
        mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} < ${LOCAL_ECLOUD_DIR}/etc/ecloud.sql
		check_command "Create ecloud DataBase"
	    mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} < ${LOCAL_ECLOUD_DIR}/etc/ecloud_common.sql
		check_command "Create ecloud_common DataBase"
	    mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} -e "INSERT into ecloud_common.regions (region,displayname,url) values (\"${OS_REGION_NAME}\",\"${DataCenter_Name}\",\"https://${Management_host_ip}:8443\");"
		check_command "Create DataCenter information"
		mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} -e "update keystone.user set extra = '{\"displayname\":\"超级管理员\"}'  where name = \"ecloud\";"
    else
        mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} < ${LOCAL_ECLOUD_DIR}/etc/ecloud.sql
        local check_db_result=`mysql -h${Master_DataCenter_DataBase_ip} -uroot -p${MASTER_DB_PASSWORD} -e "SELECT url FROM regions WHERE region='${OS_REGION_NAME}'"`
        if [ -z "${check_db_result}" ];
        then
            mysql -h${Master_DataCenter_DataBase_ip} -uroot -p${MASTER_DB_PASSWORD} -e "INSERT into ecloud_common.regions (region,displayname,url) values (\"${OS_REGION_NAME}\",\"${DataCenter_Name}\",\"https://${Management_host_ip}:8443\");"
	    fi
	fi
	mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} -e "update cinder.quota_classes set hard_limit = -1;"
	#添加manor数据库
	mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} < ${INSTALL_PATH}/packages/manor/manor.sql
	check_command "Create manor DataBase"	
	mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} -e "GRANT ALL PRIVILEGES ON *.* TO 'manor'@'%' IDENTIFIED BY '${OS_DB_PASSWD}';"
	check_command "Set manor database local access Permissions"
	mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} -e "GRANT ALL PRIVILEGES ON *.* TO 'manor'@'localhost' IDENTIFIED BY '${OS_DB_PASSWD}';"
	check_command "Set manor database remote access Permissions"
}


setting_ecloud_user()
{
	
    if [ "${Master_DataCenter}" = "y" ];
	then
	    source /root/keystonerc_admin

		role_list=`openstack role list | grep -v ID | grep -v +`
		if [ ! -n "`echo ${role_list} | grep user`" ];
		then
			openstack role create user
			check_command "Create openstack user role"
		fi
		
		if [ ! -n "`echo ${role_list} | grep tenant_admin`" ];
		then
			openstack role create tenant_admin
			check_command "Create openstack tenant_admin role"
		fi
		
		if [ ! -n "`echo ${role_list} | grep sys_admin`" ];
		then
			openstack role create sys_admin
			check_command "Create openstack sys_admin role"
		fi
		
		user_list=`openstack user list |  grep -v ID`
		if [ ! -n "`echo ${user_list} | grep ecloud`" ];
		then
			openstack user create ecloud --password ${ECLOUD_ADMIN_PASSWD} --email ecloud@easted.com.cn
			check_command "Create ecloud admin user"	
			openstack role add --project admin --user ecloud admin		
		fi		
		
        service_list=`openstack service list | grep -v ID`
		if [ ! -n "`echo ${service_list} | grep ecloud`" ];
		then
			openstack service create --name ecloud --description "ECloud Service" ecloud
			check_command "Create ecloud service"				
		fi
         
		endpoint_list=`openstack endpoint list | grep -v ID`
		if [ ! -n "`echo ${endpoint_list} | grep ecloud`" ];
		then
			openstack endpoint create --publicurl http://ecloud:8443 --internal http://ecloud:8443 --adminurl http://ecloud:8443 --region ${OS_REGION_NAME} ecloud
			check_command "Create ecloud endpoint"	
		fi
    fi
}

function install_ecloud_requirements ()
{
	CHECK_VALUE=` rpm -qa | grep python-pip`
	if [ -z "${CHECK_VALUE}" ];
	then
		yum install -y python-pip
		check_command "Install python-pip"
	else
		info_log "Openstack python-pip already installed"
	fi
	
	pip -V > /dev/null
	check_command "Check python pip tools"

    cat ${LOCAL_ECLOUD_DIR}/etc/requirements | grep -v ^$ | while read package_name
    do
        pip install --no-index --find-links=file:${INSTALL_PATH}/packages/python_package ${package_name}
    done
}

setting_ecloud_service()
{
	echo "authCommunity   log,execute,net public" >> /etc/snmp/snmptrapd.conf
	echo "traphandle  default  /usr/bin/python ${LOCAL_ECLOUD_DIR}/python/alarm_handler.pyc $Management_host_ip" >> /etc/snmp/snmptrapd.conf
	
	systemctl restart snmptrapd.service
	systemctl enable  snmptrapd.service
	
	chmod +x /etc/rc.d/rc.local                         1>/dev/null 2>&1  
	systemctl enable rc-local.service                   1>/dev/null 2>&1
	
	systemctl disable iptables.service                  1>/dev/null 2>&1
	systemctl stop iptables.service                     1>/dev/null 2>&1
	service iptables stop                               1>/dev/null 2>&1
	chkconfig iptables off                              1>/dev/null 2>&1
	systemctl stop firewalld.service                    1>/dev/null 2>&1
	systemctl disable firewalld.service                 1>/dev/null 2>&1	

	cp -r ${INSTALL_PATH}/etc/ecloud/etc/start_iaas     /etc/rc.d/init.d/start_iaas
	cp -r ${INSTALL_PATH}/etc/ecloud/etc/ecloud         /etc/rc.d/init.d/ecloud
	cp -r ${INSTALL_PATH}/etc/ecloud/etc/ecloud-server  /etc/rc.d/init.d/ecloud-server
	cp -r ${INSTALL_PATH}/etc/ecloud/etc/ecloud-message /etc/rc.d/init.d/ecloud-message
	cp -r ${INSTALL_PATH}/etc/ecloud/etc/ecloud-task    /etc/rc.d/init.d/ecloud-task
	cp -r ${INSTALL_PATH}/etc/ecloud/etc/ecloud-manor   /etc/rc.d/init.d/ecloud-manor

	sed -i "s#^LOCAL_ECLOUD_DIR.*#LOCAL_ECLOUD_DIR=${LOCAL_ECLOUD_DIR}#" /etc/rc.d/init.d/ecloud
	sed -i "s#^LOCAL_ECLOUD_DIR.*#LOCAL_ECLOUD_DIR=${LOCAL_ECLOUD_DIR}#" /etc/rc.d/init.d/ecloud-server
	sed -i "s#^LOCAL_ECLOUD_DIR.*#LOCAL_ECLOUD_DIR=${LOCAL_ECLOUD_DIR}#" /etc/rc.d/init.d/ecloud-message
	sed -i "s#^LOCAL_ECLOUD_DIR.*#LOCAL_ECLOUD_DIR=${LOCAL_ECLOUD_DIR}#" /etc/rc.d/init.d/ecloud-task
    sed -i "s#^LOCAL_ECLOUD_DIR.*#LOCAL_ECLOUD_DIR=${LOCAL_ECLOUD_DIR}#" /etc/rc.d/init.d/ecloud-manor
	
	chmod 777 /etc/rc.d/init.d/start_iaas
    chmod 777 /etc/rc.d/init.d/ecloud
    chmod 777 /etc/rc.d/init.d/ecloud-server
    chmod 777 /etc/rc.d/init.d/ecloud-message
    chmod 777 /etc/rc.d/init.d/ecloud-task
	chmod 777 /etc/rc.d/init.d/ecloud-manor

	echo 'service start_iaas start'   >> /etc/rc.d/rc.local
    echo 'service ecloud-manor start' >> /etc/rc.d/rc.local
    echo "sleep 30"                   >> /etc/rc.d/rc.local
    echo "service ecloud start"       >> /etc/rc.d/rc.local
    echo "sleep 20"                   >> /etc/rc.d/rc.local
    echo "service ecloud restart"     >> /etc/rc.d/rc.local
		
    # service start_iaas start
    service ecloud-manor start&

	cd ${LOCAL_ECLOUD_DIR}/python
	service ecloud start&
    cd ${TOP_DIR}
	sleep 15
}


function write_install_ecloud_tag ()
{
	normal_info "#######################################################################################"
	normal_info "###                        Install Ecloud Platform Successful                       ###"
	normal_info "#######################################################################################"
	echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_ecloud.tag
}