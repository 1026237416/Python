uninstall_ecloud()
{
	check_uninstall_ecloud_tag
	get_database_passwd
	stop_ecloud_service
	get_ecloud_info
    remove_ecloud_database
	remove_ecloud_user
	remove_ecloud_package
	exit
}


function check_uninstall_ecloud_tag ()
{
	if [ -f ${install_tag_path}/install_ecloud.tag ]
	then
		info_log "Check ecloud have installed ."
	else
		echo -e "\033[41;37mYou have not install Ecloud platform. \033[0m"
		iaas_install_menu
	fi	
}

stop_ecloud_service()
{
	service ecloud stop
	service ecloud-manor stop
}

function get_ecloud_info ()
{
	USER_PASSWD=`cat  ${INSTALL_PATH}/etc/keystone/admin_token`
	OS_DB_PASSWD=`cat ${INSTALL_PATH}/etc/keystone/admin_token`
	ADMIN_TOKEN=`cat  ${INSTALL_PATH}/etc/keystone/admin_token`
	
	OS_USERNAME=`cat ~/keystonerc_admin   | grep OS_USERNAME | cut -d= -f2`
	OS_PASSWORD=`cat ~/keystonerc_admin | grep OS_PASSWORD | cut -d= -f2`
	OS_REGION_NAME=`cat ~/keystonerc_admin | grep OS_REGION_NAME | cut -d= -f2`
	OS_TENANT_NAME=`cat ~/keystonerc_admin | grep OS_TENANT_NAME | cut -d= -f2`
	
}

remove_ecloud_database()
{
    echo "Restore ecloud database......"
    if [ "${Master_DataCenter}" = "y" ];
	then
	    mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} -e "drop database if exists ecloud_common;"
		mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} -e "drop database if exists ecloud;"
		mysql -h${DataBase_host_ip} -uroot -p${DATABASE_PASSWD} -e "drop database if exists manor;"
	else
		mysql -h${CONFIG_DATABASE_HOST_IP} -uroot -p${IAAS_DB_PASSWD} -e "drop database if exists manor;"
		mysql -h${CONFIG_DATABASE_HOST_IP} -uroot -p${IAAS_DB_PASSWD} -e "drop database if exists ecloud;"
		mysql -h${MASTER_DC_DATABASE_IP}   -uroot -p${IAAS_DB_PASSWD} -e "delete from ecloud_common.regions where region=\"$OS_REGION_NAME\";"
	fi
}

remove_ecloud_user()
{
    echo "Delete ecloud user......"
	if [ "${Master_DataCenter}" = "y" ];
	then
		source /root/keystonerc_admin
		
		endpoint_list=`openstack endpoint list | grep -v ID`
		if [ -n "`echo ${endpoint_list} | grep ${ECLOUD_USER_NAME}`" ];
		then
			endpoint_id=`openstack endpoint list | grep ${ECLOUD_USER_NAME} | awk '{print $2}'`
			openstack endpoint delete ${endpoint_id}
		fi
		
		service_list=`openstack service list | grep -v ID`
		if [ -n "`echo ${service_list} | grep ${ECLOUD_USER_NAME}`" ];
		then
			openstack service delete ${ECLOUD_USER_NAME}
		fi
		openstack role remove --project admin --user ${ECLOUD_USER_NAME} admin
		
		user_list=`openstack user list |  grep -v ID`
		if [ -n "`echo ${user_list} | grep ${ECLOUD_USER_NAME}`" ];
		then
			openstack user delete ${ECLOUD_USER_NAME}
		fi
	fi
}

remove_ecloud_package()
{
    echo "Remove ecloud package......"
	rm -rf ${LOCAL_ECLOUD_DIR}
	rm -rf ${LOG_DIR}
	rm -rf ${XML_DIR}
	rm -rf /etc/rc.d/init.d/ecloud*
}