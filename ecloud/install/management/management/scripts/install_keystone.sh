#!/usr/bin/env bash
function install_keystone ()
{
	check_install_keystone_tag
	get_host_info
	check_yum_source
	get_database_passwd
	get_master_DB_passwd
	get_or_create_token
	create_keystone_db
	install_keystone_package
	setting_keystone
	create_entity_keystone
	verify_keystone_service
	write_install_keystone_tag
}

function check_install_keystone_tag ()
{
	if [ -f  ${install_tag_path}/prepare_system.tag ]
	then 
		info_log "config system have executed."
	else
		warn_info "You should prepare system first."
		iaas_install_menu
	fi

	if [ -f  ${install_tag_path}/install_keystone.tag ]
	then
	    warn_info "The install keystone operation has been executed，Do not need to execute it."
		info_log "The install keystone operation has been executed"
		iaas_install_menu
	fi
	normal_info "#######################################################################################"
	normal_info "###                      Start install keystone service                             ###"
	normal_info "#######################################################################################"
}

function get_or_create_token()
{
    if [ "${Master_DataCenter}" == y ];
	then
	    if  [ -f /etc/keystone/admin_token ]
        then
            ADMIN_TOKEN=$(cat /etc/keystone/admin_token)
            check_command "Get local exist Admin token"
        else
            ADMIN_TOKEN=$(openssl rand -hex 10)
            check_command "Create Admin token"
        fi

        if [ -z "${ADMIN_TOKEN}" ];
        then
            error_info "Get Token value is null,please check!"
            error_log "Get Token value is null,stop install!"
            exit 1
        fi

        KEYSTONE_DB_URL=mysql://keystone:${ADMIN_TOKEN}@${DataBase_host_name}/keystone
	else
	    ADMIN_TOKEN=`ssh ${Master_DataCenter_Manage_ip} "crudini --get /etc/keystone/keystone.conf DEFAULT admin_token"`
	    KEYSTONE_DB_URL=`ssh ${Master_DataCenter_Manage_ip} "crudini --get /etc/keystone/keystone.conf database connection"`
	fi

    if  [ -f /etc/keystone/RegionName ]
    then
        CONFIG_KEYSTONE_REGION=$(cat /etc/keystone/RegionName)
        check_command "Get local exist Region name"
    else
        CONFIG_KEYSTONE_REGION="Region_$(echo ${Management_host_ip} | cut -d '.' -f 4)_$(date '+%m%d%H%M%S')"
        check_command "Create Region name"
    fi

    if [ -z "${CONFIG_KEYSTONE_REGION}" ];
    then
        error_info "Get region name is null,please check!"
        error_log "Get region name is null,stop install!"
        exit 1
    fi
}


function create_keystone_db ()
{
    if [ "${Master_DataCenter}" == y ];
	then
        ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON *.* TO 'root'@'%'IDENTIFIED BY '${DATABASE_PASSWD}' WITH GRANT OPTION;\" "

        DATABASEKEYSTONE=`ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"show databases;\"" | grep -w keystone`
        if [ ${DATABASEKEYSTONE}x = keystonex ]
        then
            info_log "keystone database had create."
        else
            ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"CREATE DATABASE keystone;\""
            check_command "Create keystone database"
            ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'localhost' IDENTIFIED BY '${ADMIN_TOKEN}';\""
            check_command "Set keystone database local access Permissions"
            ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'%' IDENTIFIED BY '${ADMIN_TOKEN}';\""
            check_command "Set keystone database remote access Permissions"
        fi
    fi
}

function install_keystone_package ()
{
	yum install -y openstack-keystone httpd mod_wsgi python-openstackclient memcached python-memcached openstack-utils
	check_command "Install openstack keystone"
}

function setting_keystone ()
{
	systemctl enable memcached.service
	check_command "Enable memcached.service start on boot"
	systemctl start  memcached.service 
	check_command "Start memcached.service"

	[ -f /etc/keystone/keystone.conf.bak ] || cp -a /etc/keystone/keystone.conf /etc/keystone/keystone.conf.bak
	[ -f /etc/httpd/conf/httpd.conf.bak  ] || cp -a /etc/httpd/conf/httpd.conf  /etc/httpd/conf/httpd.conf.bak
	
	rm -rf /etc/keystone/keystone.conf
	cp ${INSTALL_PATH}/etc/keystone/keystone.conf  /etc/keystone/keystone.conf
	
	chown -R root:keystone /etc/keystone/keystone.conf

	crudini --set /etc/keystone/keystone.conf DEFAULT  admin_token ${ADMIN_TOKEN}
	crudini --set /etc/keystone/keystone.conf database connection  ${KEYSTONE_DB_URL}
	
	crudini --set /etc/keystone/keystone.conf oslo_messaging_rabbit rabbit_host  ${RabbitMQ_host_name}
	crudini --set /etc/keystone/keystone.conf oslo_messaging_rabbit rabbit_hosts ${RabbitMQ_host_name}:5672

	if [ "${Master_DataCenter}" == y ];
	then
        su -s /bin/sh -c "keystone-manage db_sync" keystone
        check_command "Sync keystone DataBase"
	fi

	sed -i  "s/#ServerName www.example.com:80/ServerName ${Management_host_name}/" /etc/httpd/conf/httpd.conf
	
	rm -rf /etc/httpd/conf.d/wsgi-keystone.conf
	cp ${INSTALL_PATH}/etc/keystone/wsgi-keystone.conf  /etc/httpd/conf.d/wsgi-keystone.conf 
	
	rm -rf /var/www/cgi-bin/keystone
	mkdir -p /var/www/cgi-bin/keystone
	
	cat ${INSTALL_PATH}/etc/keystone/keystone_admin >> /var/www/cgi-bin/keystone/main
	cat ${INSTALL_PATH}/etc/keystone/keystone_admin >> /var/www/cgi-bin/keystone/admin
	
	chown -R keystone:keystone /var/www/cgi-bin/keystone/admin
	chown -R keystone:keystone /var/www/cgi-bin/keystone/main
	chmod -R 755 /var/www/cgi-bin/keystone/admin 
	chmod -R 755 /var/www/cgi-bin/keystone/main
	chown -R keystone:keystone /var/www/cgi-bin/keystone
	chmod -R 755 /var/www/cgi-bin/keystone/* 
	
	iptables -I INPUT  -p udp --dport 5000  -j ACCEPT
	iptables -I INPUT  -p tcp --dport 5000  -j ACCEPT
	iptables -I INPUT  -p udp --dport 35357 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 35357 -j ACCEPT
	iptables -I INPUT  -p udp --dport 11211 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 11211 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 5000  -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 5000  -j ACCEPT
	iptables -I OUTPUT -p udp --dport 35357 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 35357 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 11211 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 11211 -j ACCEPT
	iptables-save > /etc/sysconfig/iptables
	
	systemctl enable httpd.service
	check_command "Enable httpd.service start on boot"
	systemctl start  httpd.service
	check_command "Start httpd.service"
	check_result=`systemctl status httpd.service | grep "wsgi:keystone- -DFOREGROUND"`
	if [ -z "${check_result}" ];
	then
		systemctl restart httpd.service
		check_command "Restart httpd.service"
		check_result=`systemctl status httpd.service | grep "wsgi:keystone- -DFOREGROUND"`
		if [ -z "${check_result}" ];
		then
			systemctl status httpd.service
			error_log "Start httpd.service for keystone service faild,please check!!!"
			echo  -e  "\033[41;37mStart httpd.service for keystone service faild,please check!!!\033[0m"
			exit
		fi
	fi
	systemctl restart httpd.service 
	sleep 3
}


function create_entity_keystone ()
{
    if [ "${Master_DataCenter}" == y ];
	then
        export OS_SERVICE_TOKEN=${ADMIN_TOKEN}
        export OS_SERVICE_ENDPOINT=http://${Management_host_ip}:35357/v2.0

        TENANT_NAME=`keystone tenant-list 2> /dev/null | grep admin |awk -F "|" '{print$3}' | awk -F " " '{print$1}'`
        if [ ${TENANT_NAME}x  = adminx ]
        then
            info_log "Check openstack admin tenant already exist."
        else
            keystone tenant-create --name admin --description "Admin Tenant"  2> /dev/null
            check_command "Create openstack admin tenant"
        fi

        USER_NAME=`keystone user-list 2> /dev/null | grep  admin | awk -F "|" '{print$3}' | awk -F " " '{print$1}'`
        if [ ${USER_NAME}x = adminx ]
        then
            info_log "Check openstack admin user already exist."
        else
            keystone user-create --name admin --pass ${ADMIN_TOKEN}  2> /dev/null
            check_command "Create openstack admin user"
        fi

        ROLE_NAME=`keystone role-list 2> /dev/null | grep  admin | awk -F "|" '{print$3}' | awk -F " " '{print$1}'`
        if [ ${ROLE_NAME}x = adminx ]
        then
            info_log "Check openstack admin role already exist."
        else
            keystone role-create --name admin    2> /dev/null
            check_command "Create openstack admin role"
            keystone user-role-add --user admin --tenant admin --role admin  2> /dev/null
            check_command "Add admin role to admin tenant and user"
        fi

        TENANT_NAME=`keystone tenant-list 2> /dev/null | grep services |awk -F "|" '{print$3}' | awk -F " " '{print$1}'`
        if [ ${TENANT_NAME}x  = servicesx ]
        then
            info_log "Check openstack services tenant already exist."
        else
            keystone tenant-create --name services --description "Services Tenant"  2> /dev/null
            check_command "Create openstack services tenant"
        fi

        SERVICE_NAME=`keystone service-list 2> /dev/null | grep ${CONFIG_KEYSTONE_REGION} |awk -F "|" '{print$3}' | awk -F " " '{print$1}'`
        if [ ${SERVICE_NAME}x  = keystonex ]
        then
            info_log "Check openstack keystone service already exist."
        else
            keystone service-create --name keystone --type identity --description "${CONFIG_KEYSTONE_REGION} Identity Service"  2> /dev/null
            check_command "Create the keystone service for the Identity service"
        fi

        identity_service_id=`keystone service-list 2>/dev/null | grep ${CONFIG_KEYSTONE_REGION} | cut -d' ' -f2`
        ENDPOINT_NAME=`keystone endpoint-list 2> /dev/null | grep ${identity_service_id} | awk -F "|" '{print$7}' | awk -F " " '{print$1}'`
        if [ "${ENDPOINT_NAME}" = "${identity_service_id}" ]
        then
            info_log "Check openstack keystone endpoint already exist."
        else
            keystone endpoint-create                                    \
                --service-id  ${identity_service_id}                    \
                --publicurl   http://${Management_host_name}:5000/v2.0  \
                --internalurl http://${Management_host_name}:5000/v2.0  \
                --adminurl    http://${Management_host_name}:35357/v2.0 \
                --region      ${CONFIG_KEYSTONE_REGION}                 2> /dev/null
            check_command "Create the Identity service API endpoint"
        fi
    else
        mysql -h${Master_DataCenter_DataBase_ip} -uroot -p${MASTER_DB_PASSWORD} -e "insert into keystone.region(id,parent_region_id,extra) values ('$CONFIG_KEYSTONE_REGION',NULL,'{}');"
        export OS_SERVICE_TOKEN=${ADMIN_TOKEN}
        export OS_SERVICE_ENDPOINT=http://${Master_DataCenter_Manage_hostname}:35357/v2.0

        SERVICE_NAME=`keystone service-list 2> /dev/null | grep ${CONFIG_KEYSTONE_REGION} |awk -F "|" '{print$3}' | awk -F " " '{print$1}'`
        if [ ${SERVICE_NAME}x  = keystonex ]
        then
            info_log "Check openstack keystone service already exist."
        else
            keystone service-create --name keystone --type identity --description "${CONFIG_KEYSTONE_REGION} Identity Service"  2> /dev/null
            check_command "Create the keystone service for the Identity service"
        fi

        identity_service_id=`keystone service-list 2>/dev/null | grep -w keystone | grep ${CONFIG_KEYSTONE_REGION} | cut -d' ' -f2`
        ENDPOINT_NAME=`keystone endpoint-list 2> /dev/null | grep ${identity_service_id} | awk -F "|" '{print$7}' | awk -F " " '{print$1}'`
        if [ "${ENDPOINT_NAME}" = "${identity_service_id}" ]
        then
            info_log "Check openstack keystone endpoint already exist."
        else
            keystone endpoint-create                                                 \
                --service-id  ${identity_service_id}                                 \
                --publicurl   http://${Master_DataCenter_Manage_hostname}:5000/v2.0  \
                --internalurl http://${Master_DataCenter_Manage_hostname}:5000/v2.0  \
                --adminurl    http://${Master_DataCenter_Manage_hostname}:35357/v2.0 \
                --region      ${CONFIG_KEYSTONE_REGION}                              2> /dev/null
            check_command "Create the Identity service API endpoint"
        fi
    fi
}


function verify_keystone_service ()
{
	unset OS_SERVICE_TOKEN OS_SERVICE_ENDPOINT

	if [ "${Master_DataCenter}" == y ];
	then
        keystone --os-tenant-name admin --os-username admin --os-password ${ADMIN_TOKEN} --os-auth-url http://${Management_host_ip}:35357/v2.0 token-get  2> /dev/null
        check_command "As the admin user,request an authentication token"

        keystone --os-tenant-name admin --os-username admin --os-password ${ADMIN_TOKEN} --os-auth-url http://${Management_host_ip}:35357/v2.0 tenant-list 2> /dev/null
        check_command "As the admin user,request the tenant list"

        keystone --os-tenant-name admin --os-username admin --os-password ${ADMIN_TOKEN} --os-auth-url http://${Management_host_ip}:35357/v2.0 user-list 2> /dev/null
        check_command "As the admin user,request the user list"

        keystone --os-tenant-name admin --os-username admin --os-password ${ADMIN_TOKEN} --os-auth-url http://${Management_host_ip}:35357/v2.0 role-list 2> /dev/null
        check_command "As the admin user,request the role list"


        echo "unset OS_SERVICE_TOKEN"                                       >  /root/keystonerc_admin
        echo "export PS1='[\u@\h \W(keystone_admin)]\$ '"                   >> /root/keystonerc_admin
        echo "export OS_TENANT_NAME=admin"                                  >> /root/keystonerc_admin
        echo "export OS_USERNAME=admin"                                     >> /root/keystonerc_admin
        echo "export OS_PASSWORD=${ADMIN_TOKEN}"                            >> /root/keystonerc_admin
        echo "export OS_AUTH_URL=http://${Management_host_name}:35357/v2.0" >> /root/keystonerc_admin
        echo "export OS_REGION_NAME=${CONFIG_KEYSTONE_REGION}"              >> /root/keystonerc_admin
    else
        keystone --os-tenant-name admin --os-username admin --os-password ${ADMIN_TOKEN} --os-auth-url http://${Master_DataCenter_Manage_hostname}:35357/v2.0 token-get  2> /dev/null
        check_command "As the admin user,request an authentication token"

        keystone --os-tenant-name admin --os-username admin --os-password ${ADMIN_TOKEN} --os-auth-url http://${Master_DataCenter_Manage_hostname}:35357/v2.0 tenant-list 2> /dev/null
        check_command "As the admin user,request the tenant list"

        keystone --os-tenant-name admin --os-username admin --os-password ${ADMIN_TOKEN} --os-auth-url http://${Master_DataCenter_Manage_hostname}:35357/v2.0 user-list 2> /dev/null
        check_command "As the admin user,request the user list"

        keystone --os-tenant-name admin --os-username admin --os-password ${ADMIN_TOKEN} --os-auth-url http://${Master_DataCenter_Manage_hostname}:35357/v2.0 role-list 2> /dev/null
        check_command "As the admin user,request the role list"


        echo "unset OS_SERVICE_TOKEN"                                                    >  /root/keystonerc_admin
        echo "export PS1='[\u@\h \W(keystone_admin)]\$ '"                                >> /root/keystonerc_admin
        echo "export OS_TENANT_NAME=admin"                                               >> /root/keystonerc_admin
        echo "export OS_USERNAME=admin"                                                  >> /root/keystonerc_admin
        echo "export OS_PASSWORD=${ADMIN_TOKEN}"                                         >> /root/keystonerc_admin
        echo "export OS_AUTH_URL=http://${Master_DataCenter_Manage_hostname}:35357/v2.0" >> /root/keystonerc_admin
        echo "export OS_REGION_NAME=${CONFIG_KEYSTONE_REGION}"                           >> /root/keystonerc_admin
    fi

    echo "${CONFIG_KEYSTONE_REGION}" > /etc/keystone/RegionName
    echo "${ADMIN_TOKEN}"            > /etc/keystone/admin_token
}

function write_install_keystone_tag ()
{
	normal_info "#######################################################################################"
	normal_info "###                         Install keystone successful                             ###"
	normal_info "#######################################################################################"
	echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_keystone.tag
}