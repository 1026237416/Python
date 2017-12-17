#!/usr/bin/env bash

function install_ceilometer ()
{
	check_install_ceilometer_tag
	get_host_info
	check_yum_source	
	create_ceilometer_database
	cteate_ceilometer_entity
	install_ceilometer_service
	setting_ceilometer_service
	write_install_ceilometer_tag
}

function check_install_ceilometer_tag ()
{
	if [ -f  ${install_tag_path}/install_keystone.tag ]
	then 
		info_log "Check keystone have installed ."
	else
		echo -e "\033[41;37mYou should install keystone first. \033[0m"
		iaas_install_menu
	fi

	if [ -f  ${install_tag_path}/install_ceilometer.tag ]
	then 
		echo -e "\033[41;37mThe install ceilometer operation has been performed.\033[0m"
		info_log "you had install ceilometer."	
		iaas_install_menu
	fi

	normal_info "#######################################################################################"
	normal_info "###                       Start install ceilometer service                          ###"
	normal_info "#######################################################################################"

	USER_PASSWD=`cat  /etc/keystone/admin_token`
	OS_DB_PASSWD=`cat /etc/keystone/admin_token`
	ADMIN_TOKEN=`cat  /etc/keystone/admin_token`
	REGION_NAME=`cat  /etc/keystone/RegionName`
}

function create_ceilometer_database ()
{
	ssh ${MongoDB_host_ip} "sed -i \"s/bind_ip.*/bind_ip = ${MongoDB_host_ip}/g\" /etc/mongodb.conf"
	ssh ${MongoDB_host_ip} "systemctl restart mongod.service"
	ssh ${MongoDB_host_ip} "mongo --host ${MongoDB_host_ip} --eval 'db = db.getSiblingDB(\"ceilometer\");db.createUser({user: \"ceilometer\",pwd: \"${OS_DB_PASSWD}\",roles: [ \"readWrite\", \"dbAdmin\" ]})'"
}

function cteate_ceilometer_entity ()
{
	source /root/keystonerc_admin
	
	USER_CEILOMETER=`keystone user-list 2> /dev/null | grep ceilometer`
	if [ -z "${USER_CEILOMETER}" ]
	then
		keystone user-create --name ceilometer --pass ${USER_PASSWD}  2> /dev/null
		check_command "Create openstack ceilometer user"
		keystone user-role-add --user ceilometer --tenant services --role admin  2> /dev/null
		check_command "Add role to ceilometer user"
	else
		info_log "Check openstack ceilometer user has already exist."
	fi

	SERVICE_CEILOMETER=`keystone service-list 2> /dev/null | grep ${REGION_NAME} | grep ceilometer`
	if [ -z "${SERVICE_CEILOMETER}" ]
	then
		keystone service-create --name ceilometer --type metering --description "${REGION_NAME} Telemetry Service"  2> /dev/null
		check_command "Create openstack ceilometer service"
	else
		info_log "openstack ceilometer service has already exist."
	fi

	ceilometer_service_id=`keystone service-list 2> /dev/null | grep ${REGION_NAME} | awk '/ metering / {print $2}'`
	ENDPOINT_CEILOMETER=`keystone endpoint-list  2> /dev/null | grep ${ceilometer_service_id}`
	if [ -z "${ENDPOINT_CEILOMETER}" ]
	then
		keystone endpoint-create                               \
            --service-id  ${ceilometer_service_id}             \
            --publicurl   http://${Management_host_name}:8777  \
            --internalurl http://${Management_host_name}:8777  \
            --adminurl    http://${Management_host_name}:8777  \
            --region      ${REGION_NAME}                       2> /dev/null
		check_command "Create openstack ceilometer endpoint"
	else
		info_log "openstack ceilometer endpoint has already exist."
	fi
}

function install_ceilometer_service ()
{
	yum install -y openstack-ceilometer-api openstack-ceilometer-collector openstack-ceilometer-notification openstack-ceilometer-central openstack-ceilometer-alarm python-ceilometerclient net-snmp-utils
	check_command "Install ceilometer packages"
}

function setting_ceilometer_service ()
{
	[ -f /etc/ceilometer/ceilometer.conf.bak ]  || cp -a /etc/ceilometer/ceilometer.conf /etc/ceilometer/ceilometer.conf.bak
	rm -rf /etc/ceilometer/ceilometer.conf
	cp ${INSTALL_PATH}/etc/ceilometer/ceilometer.conf /etc/ceilometer/ceilometer.conf
	
	chown -R root:ceilometer /etc/ceilometer/*
	
	crudini --set /etc/ceilometer/ceilometer.conf DEFAULT os_region_name ${REGION_NAME}
	
	crudini --set /etc/ceilometer/ceilometer.conf coordination backend_url redis://${Redis_host_name}:6379
	crudini --set /etc/ceilometer/ceilometer.conf database connection mongodb://${MongoDB_host_name}:27017/ceilometer

	crudini --set /etc/ceilometer/ceilometer.conf publisher metering_secret ${USER_PASSWD}
	
	crudini --set /etc/ceilometer/ceilometer.conf service_credentials os_password ${USER_PASSWD}
	crudini --set /etc/ceilometer/ceilometer.conf service_credentials os_region_name ${REGION_NAME}
	
	crudini --set /etc/ceilometer/ceilometer.conf oslo_messaging_rabbit rabbit_host  ${RabbitMQ_host_name}
	crudini --set /etc/ceilometer/ceilometer.conf oslo_messaging_rabbit rabbit_hosts ${RabbitMQ_host_name}:5672

	if [ "${Master_DataCenter}" == y ];
	then
        crudini --set /etc/ceilometer/ceilometer.conf keystone_authtoken auth_uri       http://${Management_host_name}:5000/v2.0
        crudini --set /etc/ceilometer/ceilometer.conf keystone_authtoken identity_uri   http://${Management_host_name}:35357
        crudini --set /etc/ceilometer/ceilometer.conf service_credentials os_auth_url   http://${Management_host_name}:5000/v2.0
        crudini --set /etc/ceilometer/ceilometer.conf keystone_authtoken admin_password ${USER_PASSWD}
	else
        crudini --set /etc/ceilometer/ceilometer.conf keystone_authtoken auth_uri       http://${Master_DataCenter_Manage_hostname}:5000/v2.0
        crudini --set /etc/ceilometer/ceilometer.conf keystone_authtoken identity_uri   http://${Master_DataCenter_Manage_hostname}:35357
        crudini --set /etc/ceilometer/ceilometer.conf service_credentials os_auth_url   http://${Master_DataCenter_Manage_hostname}:5000/v2.0
        crudini --set /etc/ceilometer/ceilometer.conf keystone_authtoken admin_password ${USER_PASSWD}
	fi
	
	[ -f /etc/ceilometer/pipeline.yaml.bak ]  || cp -a /etc/ceilometer/pipeline.yaml /etc/ceilometer/pipeline.yaml.bak
	rm -rf /etc/ceilometer/pipeline.yaml
	cp ${INSTALL_PATH}/etc/ceilometer/controller_pipeline.yaml /etc/ceilometer/pipeline.yaml
	
	chown -R root:ceilometer /etc/ceilometer/pipeline.yaml
	
	systemctl enable openstack-ceilometer-api.service
	systemctl enable openstack-ceilometer-notification.service
	systemctl enable openstack-ceilometer-central.service
	systemctl enable openstack-ceilometer-collector.service
	systemctl enable openstack-ceilometer-alarm-evaluator.service
	systemctl enable openstack-ceilometer-alarm-notifier.service
	
	systemctl start openstack-ceilometer-api.service
	systemctl start openstack-ceilometer-notification.service
	systemctl start openstack-ceilometer-central.service
	systemctl start openstack-ceilometer-collector.service
	systemctl start openstack-ceilometer-alarm-evaluator.service
	systemctl start openstack-ceilometer-alarm-notifier.service
	
	iptables -I INPUT  -p tcp --dport 161 -j ACCEPT
	iptables -I INPUT  -p udp --dport 161 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 162 -j ACCEPT
	iptables -I INPUT  -p udp --dport 162 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 161 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 161 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 162 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 162 -j ACCEPT
}


function write_install_ceilometer_tag ()
{
	normal_info "#######################################################################################"
	normal_info "###                   Install ceilometer service successful                         ###"
	normal_info "#######################################################################################"
	echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_ceilometer.tag
}