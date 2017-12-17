#!/usr/bin/env bash


function install_glance ()
{
	check_install_glance_tag
	get_host_info
	check_yum_source
	get_database_passwd
	create_glance_database
	create_glance_entity
	install_glance_packages
	setting_glance
	upload_demo_image
	write_install_glance_tag
}

function check_install_glance_tag ()
{	
	if [ -f  ${install_tag_path}/install_keystone.tag ]
	then 
		info_log "Check keystone have installed ."
	else
		echo -e "\033[41;37mYou should install keystone first. \033[0m"
		iaas_install_menu
	fi

	if [ -f  ${install_tag_path}/install_glance.tag ]
	then 
		echo -e "\033[41;37mThe install glance operation has been performed.\033[0m"
		info_log "you had install glance."	
		iaas_install_menu
	fi

	normal_info "#######################################################################################"
	normal_info "###                          Start install glance service                           ###"
	normal_info "#######################################################################################"
}

function create_glance_database ()
{
	USER_PASSWD=`cat  /etc/keystone/admin_token`
	OS_DB_PASSWD=`cat /etc/keystone/admin_token`
	ADMIN_TOKEN=`cat  /etc/keystone/admin_token`
	REGION_NAME=`cat  /etc/keystone/RegionName`
	
	DATABASEGLANCE=`ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"show databases ;\"" | grep -w glance`
	if [ ${DATABASEGLANCE}x = glancex ]
	then
		info_log "glance database had installed."
	else
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"CREATE DATABASE glance;\"" 
		check_command "Create glance databases"
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON glance.* TO 'glance'@'localhost' IDENTIFIED BY '${OS_DB_PASSWD}';\""
		check_command "Set glance database local access Permissions"
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON glance.* TO 'glance'@'%' IDENTIFIED BY '${OS_DB_PASSWD}';\""
		check_command "Set glance database remote access Permissions"
	fi
}

function create_glance_entity ()
{
	source /root/keystonerc_admin
		
	USER_GLANCE=`keystone user-list 2> /dev/null | grep -w glance | awk -F "|" '{print$3}' | awk -F " " '{print$1}'`
	if [ ${USER_GLANCE}x = glancex ]
	then
		info_log "Check openstack glance user has already exist."
	else
		keystone user-create --name glance --pass  ${USER_PASSWD}             2> /dev/null
		check_command "Create openstack glance user"
		keystone user-role-add --user glance --tenant services --role admin   2> /dev/null
		check_command "Add role to glance user"
	fi

	SERVICE_IMAGE=`keystone service-list 2> /dev/null | grep glance | grep ${REGION_NAME} | awk -F "|" '{print$3}' | awk -F " " '{print$1}'`
	if [  ${SERVICE_IMAGE}x = glancex ]
	then 
		info_log "openstack glance service has already exist."
	else
		keystone service-create --name glance --type image --description "${REGION_NAME} Image Service"  2> /dev/null
		check_command "Create openstack glance service"
	fi

	image_service_id=`keystone service-list 2> /dev/null | grep "${REGION_NAME}" | awk '/ image / {print $2}'`
	ENDPOINT_GLANCE=`keystone endpoint-list 2> /dev/null | grep ${image_service_id} | awk -F "|" '{print$7}' | awk -F " " '{print$1}'`
	if [ -z "${ENDPOINT_GLANCE}" ]
	then
		keystone endpoint-create \
            --service-id  ${image_service_id}                  \
            --publicurl   http://${Management_host_name}:9292  \
            --internalurl http://${Management_host_name}:9292  \
            --adminurl    http://${Management_host_name}:9292  \
            --region      ${REGION_NAME}                              2> /dev/null
		check_command "Create openstack glance endpoint"
	else
		info_log "openstack glance endpoint has already exist."
	fi
}

function install_glance_packages()
{
	yum install -y openstack-glance python-glance python-glanceclient
	check_command "Install glance packages"
}

function setting_glance ()
{
	[ -f /etc/glance/glance-api.conf.bak ]      || cp -a /etc/glance/glance-api.conf /etc/glance/glance-api.conf.bak
	[ -f /etc/glance/glance-registry.conf.bak ] || cp -a /etc/glance/glance-registry.conf /etc/glance/glance-registry.conf.bak
	
	rm -rf /etc/glance/glance-api.conf
	rm -rf /etc/glance/glance-registry.conf
	
	cp ${INSTALL_PATH}/etc/glance/glance-api.conf       /etc/glance/glance-api.conf
	cp ${INSTALL_PATH}/etc/glance/glance-registry.conf  /etc/glance/glance-registry.conf
	
	crudini --set /etc/glance/glance-api.conf DEFAULT             os_region_name ${REGION_NAME}
	crudini --set /etc/glance/glance-api.conf database connection mysql://glance:${OS_DB_PASSWD}@${DataBase_host_name}/glance
	crudini --set /etc/glance/glance-api.conf glance_store        os_region_name ${REGION_NAME}
	
	crudini --set /etc/glance/glance-api.conf oslo_messaging_rabbit rabbit_host  ${RabbitMQ_host_name}
	crudini --set /etc/glance/glance-api.conf oslo_messaging_rabbit rabbit_hosts ${RabbitMQ_host_name}:5672

	crudini --set /etc/glance/glance-registry.conf DEFAULT os_region_name ${REGION_NAME}
	crudini --set /etc/glance/glance-registry.conf DEFAULT rabbit_host    ${RabbitMQ_host_name}
	
	crudini --set /etc/glance/glance-registry.conf database connection  mysql://glance:${OS_DB_PASSWD}@${DataBase_host_name}/glance

	if [ "${Master_DataCenter}" == y ];
	then
        crudini --set /etc/glance/glance-api.conf      keystone_authtoken  identity_uri http://${Management_host_name}:35357
        crudini --set /etc/glance/glance-api.conf      keystone_authtoken  auth_uri http://${Management_host_name}:5000/v2.0
        crudini --set /etc/glance/glance-api.conf      keystone_authtoken  admin_password ${USER_PASSWD}

        crudini --set /etc/glance/glance-registry.conf keystone_authtoken  identity_uri http://${Management_host_name}:35357
        crudini --set /etc/glance/glance-registry.conf keystone_authtoken  auth_uri http://${Management_host_name}:5000/v2.0
        crudini --set /etc/glance/glance-registry.conf keystone_authtoken  admin_password ${USER_PASSWD}
	else
	    crudini --set /etc/glance/glance-api.conf      keystone_authtoken  identity_uri http://${Master_DataCenter_Manage_hostname}:35357
        crudini --set /etc/glance/glance-api.conf      keystone_authtoken  auth_uri http://${Master_DataCenter_Manage_hostname}:5000/v2.0
        crudini --set /etc/glance/glance-api.conf      keystone_authtoken  admin_password ${USER_PASSWD}

        crudini --set /etc/glance/glance-registry.conf keystone_authtoken  identity_uri http://${Master_DataCenter_Manage_hostname}:35357
        crudini --set /etc/glance/glance-registry.conf keystone_authtoken  auth_uri http://${Master_DataCenter_Manage_hostname}:5000/v2.0
        crudini --set /etc/glance/glance-registry.conf keystone_authtoken  admin_password ${USER_PASSWD}
	fi
	
	iptables -I INPUT  -p udp --dport 9191 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 9191 -j ACCEPT
	iptables -I INPUT  -p udp --dport 9292 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 9292 -j ACCEPT
	
	iptables -I OUTPUT -p udp --dport 9191 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 9191 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 9292 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 9292 -j ACCEPT
	iptables-save > /etc/sysconfig/iptables
	
	chown -R root:glance /etc/glance
	
	rm -rf /usr/lib/python2.7/site-packages/glanceclient/common/http.py
	cp ${INSTALL_PATH}/etc/glance/http.py /usr/lib/python2.7/site-packages/glanceclient/common/http.py
	
	su -s /bin/sh -c "glance-manage db_sync" glance 
	
	systemctl enable openstack-glance-api.service openstack-glance-registry.service
	check_command "Enable glance service start on boot"
	systemctl start openstack-glance-api.service openstack-glance-registry.service
	check_command "Start glance service"
}

function upload_demo_image ()
{
#	source /root/keystonerc_admin
#
#	glance image-create --name "Demo" --disk-format qcow2  --min-disk=1 --container-format bare --is-public True --progress <${INSTALL_PATH}/etc/glance/cirros-0.3.4-x86_64-disk.img   --property os=centos --property des=test --property disk_format=qcow2  --property super_user_pass=password  --property super_user=root  --property ecloud_image_type=0
#	check_command "Upload demo image"
#
#	glance image-list
#	check_command "Check glance image-list"

    info_log "Need upload Demo image."
}



function write_install_glance_tag ()
{
	normal_info "#######################################################################################"
	normal_info "###                             Install glance successful                           ###"
	normal_info "#######################################################################################"
	echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_glance.tag
}