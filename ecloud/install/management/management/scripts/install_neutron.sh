#!/usr/bin/env bash

function install_neutron ()
{
	check_install_neutron_tag
	get_host_info
	check_yum_source
	check_network_info
	get_database_passwd
	create_neutron_database
	create_neutron_entity
	install_neutron_controller_service
	setting_neutron_controller_service
	verify_neutron_controller_service
	install_neutron_network_service
	setting_neutron_network_service
	setting_neutron_network_bridge
	verify_neutron_network_service
	write_install_neutron_tag
}

function check_install_neutron_tag ()
{
	if [ -f  ${install_tag_path}/install_keystone.tag ]
	then 
		info_log "Check keystone have installed ."
	else
	    warn_info "You should install keystone first."
		iaas_install_menu
	fi
	
	if [ -f  ${install_tag_path}/install_nova_controller.tag ]
	then 
		info_log "Check nova controller service have installed ."
	else
	    warn_info "You should install nova controller service first."
		iaas_install_menu
	fi

	if [ -f  ${install_tag_path}/install_neutron.tag ]
	then
	    warn_info "The install neutron operation has been performed."
		info_log "you had install neutron."	
		iaas_install_menu
	fi

	normal_info "#######################################################################################"
	normal_info "###                           Start install neutron service                         ###"
	normal_info "#######################################################################################"
}

function check_network_info()
{
	network_names=`crudini --get ${TOP_DIR}/install.conf network_info network_name`
	if [ -z ${network_names} ];
	then
		error_info "Can not find network info in configure file, please configure network info first"
		error_log "Can't find the config network information."
		exit
	fi
	info_log "Get all of network name is: ${network_names}"
	
	all_network_names=(${network_names//,/ })
	info_log "Change to array is: ${all_network_names[*]}"
	
	for network_name in "${all_network_names[@]}"
	do
		info_log "Check network ${network_name} info."
		bridge_name=`crudini --get ${TOP_DIR}/install.conf ${network_name} bridge_name`
		check_command "Get work ${network_name} information"
		
		if [ -z ${bridge_name} ];
		then
			error_info "Please configure the network ${network_name}'s bridge"
			error_log "Can't find ${network_name}'s bridge."
			exit
		fi
		info_log "Get ${network_name}'s bridge name is: ${bridge_name},check pass." 
		
		phy_nic=`crudini --get ${TOP_DIR}/install.conf ${network_name} physical_nic`
		if [ -z ${phy_nic} ];
		then
			error_info "Please configure network ${network_name} will be used Physical NIC"
			error_log "Can't find the config network ${network_name} will be used Physical NIC."
			exit
		fi
		info_log "Get all of network ${network_name} will be used Physical NIC is: ${phy_nic}"
		all_phy_nic=(${phy_nic//,/ })
		info_log "Change to array is: ${all_phy_nic[*]}"
		
		for phy_nic in "${all_phy_nic[@]}"
		do
			info_log "Check Physical NIC ${phy_nic} info"
			phy_nic_info=`ip addr | grep ${phy_nic}`
			if [ -z "${phy_nic_info}" ];
			then
				error_info "Can not find ${phy_nic} in host,please ensure the NIC ${phy_nic} exist."
				error_log "Can not find ${phy_nic} in host."
				exit
			fi
			info_log "Check Physical NIC ${phy_nic} pass."
		done
	done
}

function create_neutron_database ()
{
	USER_PASSWD=`cat  /etc/keystone/admin_token`
	OS_DB_PASSWD=`cat /etc/keystone/admin_token`
	ADMIN_TOKEN=`cat  /etc/keystone/admin_token`
	REGION_NAME=`cat  /etc/keystone/RegionName`
	
	DATABASE_NEUTRON=`ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"show databases ;\"" | grep -w neutron`
	if [ ${DATABASE_NEUTRON}x = neutronx ]
	then
		info_log "Neutron database had installed."
	else
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"CREATE DATABASE neutron;\"" 
		check_command "Create neutron databases"
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON neutron.* TO 'neutron'@'localhost' IDENTIFIED BY '${OS_DB_PASSWD}';\""
		check_command "Set neutron database local access Permissions"
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON neutron.* TO 'neutron'@'%' IDENTIFIED BY '${OS_DB_PASSWD}';\""
		check_command "Set neutron database remote access Permissions"
	fi
}

function create_neutron_entity ()
{
	source /root/keystonerc_admin
	
	USER_NEUTRON=`keystone user-list  2> /dev/null | grep -w neutron`
	if [ -z "${USER_NEUTRON}" ]
	then
		keystone user-create --name neutron --pass ${USER_PASSWD}  2> /dev/null
		check_command "Create openstack neutron user"
		keystone user-role-add --user neutron --tenant services --role admin 2> /dev/null
		check_command "Add role to neutron user"
	else
		info_log "Check openstack neutron user has already exist."
	fi

	SERVICE_NEUTRON=`keystone service-list 2> /dev/null | grep ${REGION_NAME} | grep -w neutron`
	if [ -z "${SERVICE_NEUTRON}" ]
	then
		keystone service-create --name neutron --type network --description "${REGION_NAME} Networking Service" 2> /dev/null
		check_command "Create openstack neutron service of ${REGION_NAME}"
	else
		info_log "openstack neutron service of ${REGION_NAME} has already exist."
	fi

	neutron_service_id=`keystone service-list 2> /dev/null | grep ${REGION_NAME} | awk '/ network / {print $2}'`
	ENDPOINT_NEUTRON=`keystone endpoint-list  2> /dev/null | grep ${neutron_service_id}`
	if [ -z "${ENDPOINT_NEUTRON}" ]
	then
		keystone endpoint-create                               \
            --service-id  ${neutron_service_id}                \
            --publicurl   http://${Management_host_name}:9696  \
            --internalurl http://${Management_host_name}:9696  \
            --adminurl    http://${Management_host_name}:9696  \
            --region      ${REGION_NAME}                       2> /dev/null
		check_command "Create openstack neutron endpoint of ${REGION_NAME}"
	else
		info_log "openstack neutron endpoint of ${REGION_NAME} has already exist."
	fi
}

function install_neutron_controller_service()
{
	yum install -y openstack-neutron openstack-neutron-ml2 python-neutronclient which
	check_command "Install network controller service"
}


function setting_neutron_controller_service ()
{
    rm -rf /usr/lib/python2.7/site-packages/neutron/db/securitygroups_db.py
	cp ${INSTALL_PATH}/etc/neutron/securitygroups_db.py /usr/lib/python2.7/site-packages/neutron/db/securitygroups_db.py

	[ -f /etc/neutron/neutron.conf.bak ]  || cp -a /etc/neutron/neutron.conf /etc/neutron/neutron.conf.bak
	rm -rf /etc/neutron/neutron.conf
	cp ${INSTALL_PATH}/etc/neutron/neutron.conf /etc/neutron/neutron.conf
	
	chown -R neutron:neutron /etc/neutron/neutron.conf
	
	crudini --set /etc/neutron/neutron.conf DEFAULT               nova_url            http://${Management_host_name}:8774/v2
	crudini --set /etc/neutron/neutron.conf DEFAULT               nova_region_name    ${REGION_NAME}
	crudini --set /etc/neutron/neutron.conf DEFAULT               nova_admin_password ${USER_PASSWD}
	crudini --set /etc/neutron/neutron.conf database              connection          mysql://neutron:${OS_DB_PASSWD}@${DataBase_host_name}/neutron
	crudini --set /etc/neutron/neutron.conf oslo_messaging_rabbit rabbit_host         ${RabbitMQ_host_name}
	crudini --set /etc/neutron/neutron.conf oslo_messaging_rabbit rabbit_hosts        ${RabbitMQ_host_name}:5672 
	crudini --set /etc/neutron/neutron.conf nova                  region_name         ${REGION_NAME}

	if [ "${Master_DataCenter}" == y ];
	then
        crudini --set /etc/neutron/neutron.conf DEFAULT               nova_admin_auth_url http://${Management_host_name}:5000/v2.0
        crudini --set /etc/neutron/neutron.conf keystone_authtoken    auth_uri            http://${Management_host_name}:5000/v2.0
        crudini --set /etc/neutron/neutron.conf keystone_authtoken    identity_uri        http://${Management_host_name}:35357
        crudini --set /etc/neutron/neutron.conf keystone_authtoken    admin_password      ${USER_PASSWD}
	else
        crudini --set /etc/neutron/neutron.conf DEFAULT               nova_admin_auth_url http://${Master_DataCenter_Manage_hostname}:5000/v2.0
        crudini --set /etc/neutron/neutron.conf keystone_authtoken    auth_uri            http://${Master_DataCenter_Manage_hostname}:5000/v2.0
        crudini --set /etc/neutron/neutron.conf keystone_authtoken    identity_uri        http://${Master_DataCenter_Manage_hostname}:35357
        crudini --set /etc/neutron/neutron.conf keystone_authtoken    admin_password      ${USER_PASSWD}

	fi
	chown -R root:neutron /etc/neutron/neutron.conf
	
	[ -f /etc/neutron/plugins/ml2/ml2_conf.ini.bak ]  || cp -a /etc/neutron/plugins/ml2/ml2_conf.ini /etc/neutron/plugins/ml2/ml2_conf.ini.bak
	rm -rf /etc/neutron/plugins/ml2/ml2_conf.ini
	cp ${INSTALL_PATH}/etc/neutron/ml2_conf.ini  /etc/neutron/plugins/ml2/ml2_conf.ini
	
	chown -R root:neutron /etc/neutron/plugins/ml2/ml2_conf.ini
	
	crudini --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2_type_flat flat_networks ${network_names}
	network_names=`crudini --get ${TOP_DIR}/install.conf network_info network_name`
	for network_name in ${network_names//,/ }
	do
		network_vlan_ranges=${network_vlan_ranges}${network_name}:1:4094,
	done
	network_vlan_ranges=${network_vlan_ranges%?}
	
	crudini --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2_type_vlan network_vlan_ranges ${network_vlan_ranges}
	
	crudini --set /etc/nova/nova.conf neutron url            http://${Management_host_name}:9696
	crudini --set /etc/nova/nova.conf neutron admin_password ${USER_PASSWD}
	crudini --set /etc/nova/nova.conf neutron region_name    ${REGION_NAME}
	crudini --set /etc/nova/nova.conf neutron metadata_proxy_shared_secret ${USER_PASSWD}

	if [ "${Master_DataCenter}" == y ];
	then
	    crudini --set /etc/nova/nova.conf neutron admin_auth_url http://${Management_host_name}:35357/v2.0
	else
	    crudini --set /etc/nova/nova.conf neutron admin_auth_url http://${Master_DataCenter_Manage_hostname}:35357/v2.0
	fi

	ln -s /etc/neutron/plugins/ml2/ml2_conf.ini /etc/neutron/plugin.ini
	
	su -s /bin/sh -c "neutron-db-manage --config-file /etc/neutron/neutron.conf --config-file /etc/neutron/plugins/ml2/ml2_conf.ini upgrade head" neutron
	check_command "Initialize neutron database"
	
	systemctl restart openstack-nova-api.service
	systemctl restart openstack-nova-scheduler.service
	systemctl restart openstack-nova-conductor.service
	systemctl restart openstack-nova-consoleauth.service
	systemctl restart openstack-nova-novncproxy.service
	
	systemctl enable neutron-server.service
	systemctl start neutron-server.service
}

function verify_neutron_controller_service ()
{
	source /root/keystonerc_admin
	neutron ext-list	
}

function install_neutron_network_service()
{
	yum install -y openstack-neutron openstack-neutron-ml2 openstack-neutron-openvswitch
	check_command "Install openstack neutron network service"
}

function setting_neutron_network_service()
{
	echo "net.ipv4.ip_forward=1"              >>/etc/sysctl.conf
	echo "net.ipv4.conf.all.rp_filter=0"      >>/etc/sysctl.conf
	echo "net.ipv4.conf.default.rp_filter=0"  >>/etc/sysctl.conf
	sysctl -p >>/dev/null
	
	[ -f /etc/neutron/l3_agent.ini.bak ]  || cp -a /etc/neutron/l3_agent.ini /etc/neutron/l3_agent.ini.bak
	rm -rf /etc/neutron/l3_agent.ini
	cp ${INSTALL_PATH}/etc/neutron/l3_agent.ini  /etc/neutron/l3_agent.ini
	
	[ -f /etc/neutron/dhcp_agent.ini.bak ]  || cp -a /etc/neutron/dhcp_agent.ini /etc/neutron/dhcp_agent.ini.bak
	rm -rf /etc/neutron/dhcp_agent.ini
	cp ${INSTALL_PATH}/etc/neutron/dhcp_agent.ini  /etc/neutron/dhcp_agent.ini
	echo "dhcp-option-force=26,1454" >> /etc/neutron/dnsmasq-neutron.conf
	pkill dnsmasq
	
	[ -f /etc/neutron/metadata_agent.ini.bak ]  || cp -a /etc/neutron/metadata_agent.ini /etc/neutron/metadata_agent.ini.bak
	rm -rf /etc/neutron/metadata_agent.ini
	cp ${INSTALL_PATH}/etc/neutron/metadata_agent.ini  /etc/neutron/metadata_agent.ini
	
	chown -R root:neutron /etc/neutron/l3_agent.ini
	chown -R root:neutron /etc/neutron/dhcp_agent.ini
	chown -R root:neutron /etc/neutron/metadata_agent.ini

	if [ "${Master_DataCenter}" == y ];
	then
	    crudini --set /etc/neutron/metadata_agent.ini DEFAULT auth_url http://${Management_host_name}:5000/v2.0
	else
	    crudini --set /etc/neutron/metadata_agent.ini DEFAULT auth_url http://${Master_DataCenter_Manage_hostname}:5000/v2.0
	fi

	crudini --set /etc/neutron/metadata_agent.ini DEFAULT auth_region      ${REGION_NAME}
	crudini --set /etc/neutron/metadata_agent.ini DEFAULT admin_password   ${USER_PASSWD}
	crudini --set /etc/neutron/metadata_agent.ini DEFAULT nova_metadata_ip ${Management_host_ip}
	crudini --set /etc/neutron/metadata_agent.ini DEFAULT metadata_proxy_shared_secret ${USER_PASSWD}
	
	[ -f /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini.bak ]  || cp -a /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini.bak
	rm -rf /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini
	cp ${INSTALL_PATH}/etc/neutron/ovs_neutron_plugin.ini /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini
	
	chown -R root:neutron /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini
	
	crudini --set /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini ovs local_ip ${Management_host_ip}
	crudini --set /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini ovs bridge_mappings
	
	network_names=`crudini --get ${TOP_DIR}/install.conf network_info network_name`
	for network_name in ${network_names//,/ }
	do
		bridge_name=`crudini --get ${TOP_DIR}/install.conf ${network_name} bridge_name`
		bridge_mappings=${bridge_mappings}${network_name}:${bridge_name},
	done
	bridge_mappings=${bridge_mappings%?}
	crudini --set /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini ovs bridge_mappings ${bridge_mappings}


	source /root/keystonerc_admin
	neutron security-group-rule-create --remote-ip-prefix 0.0.0.0/0 --direction ingress default
    neutron security-group-rule-create --remote-ip-prefix 0.0.0.0/0 --direction egress  default
    neutron security-group-rule-create --remote-group-id  default   --direction ingress default
    neutron security-group-rule-create --remote-group-id  default   --direction egress  default
	
	systemctl restart openstack-nova-api.service
	systemctl enable openvswitch.service
	systemctl start openvswitch.service
}

function setting_neutron_network_bridge ()
{
	network_names=`crudini --get ${TOP_DIR}/install.conf network_info network_name`
	info_log "Get all of network name is: ${network_names}"
	
	for network_name in ${network_names//,/ }
	do
		bridge_name=`crudini --get ${TOP_DIR}/install.conf ${network_name} bridge_name`
		info_log "Get ${network_name}'s bridge name is: ${bridge_name}."
		ovs-vsctl add-br ${bridge_name}
		
		phy_nic=`crudini --get ${TOP_DIR}/install.conf ${network_name} physical_nic`
		ovs-vsctl add-port ${bridge_name} ${phy_nic}
		ethtool -K ${phy_nic} gro off

		DEFR_INFO=`cat /etc/sysconfig/network-scripts/ifcfg-${phy_nic} | grep -w DEFROUTE`
		phy_nic_ip_type=`cat /etc/sysconfig/network-scripts/ifcfg-${phy_nic} | grep IPADDR`
		if [ -z ${phy_nic_ip_type} ];
		then
			echo "ONBOOT=yes"            >  /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo ${DEFR_INFO}            >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "PEERDNS=no"            >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "NM_CONTROLLED=no"      >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "NOZEROCONF=yes"        >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "DEVICE=${bridge_name}" >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "DEVICETYPE=ovs"        >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "OVSBOOTPROTO=dhcp"     >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "TYPE=OVSBridge"        >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
		else
			echo "ONBOOT=yes"            >  /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo  ${DEFR_INFO}           >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "PEERDNS=no"            >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "NM_CONTROLLED=no"      >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "NOZEROCONF=yes"        >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "DEVICE=${bridge_name}" >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "DEVICETYPE=ovs"        >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "OVSBOOTPROTO=none"     >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "TYPE=OVSBridge"        >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
		
			phy_nic_ip=`cat /etc/sysconfig/network-scripts/ifcfg-${phy_nic} | grep IPADDR`
			echo "${phy_nic_ip}"         >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			phy_nic_mask=`cat /etc/sysconfig/network-scripts/ifcfg-${phy_nic} | grep PREFIX`
			if [ -z ${phy_nic_mask} ]; 
			then
				phy_nic_mask=`cat /etc/sysconfig/network-scripts/ifcfg-${phy_nic} | grep NETMASK`
			fi
			echo "${phy_nic_mask}"        >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			phy_nic_gateway=`cat /etc/sysconfig/network-scripts/ifcfg-${phy_nic} | grep GATEWAY`
			echo "${phy_nic_gateway}"     >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
		fi		
		
		echo "DEVICE=${phy_nic}"         >  /etc/sysconfig/network-scripts/ifcfg-${phy_nic}
		echo "DEVICETYPE=ovs"            >> /etc/sysconfig/network-scripts/ifcfg-${phy_nic}
		echo "TYPE=OVSPort"              >> /etc/sysconfig/network-scripts/ifcfg-${phy_nic}
		echo "OVS_BRIDGE=${bridge_name}" >> /etc/sysconfig/network-scripts/ifcfg-${phy_nic}
		echo "ONBOOT=yes"                >> /etc/sysconfig/network-scripts/ifcfg-${phy_nic}
		echo "BOOTPROTO=none"            >> /etc/sysconfig/network-scripts/ifcfg-${phy_nic}
	done
	service network restart 
}

function verify_neutron_network_service()
{
	systemctl enable neutron-openvswitch-agent.service 
	systemctl enable neutron-l3-agent.service
	systemctl enable neutron-dhcp-agent.service
	systemctl enable neutron-metadata-agent.service
	systemctl enable neutron-ovs-cleanup.service
	
	systemctl start neutron-openvswitch-agent.service
	systemctl start neutron-l3-agent.service
	systemctl start neutron-dhcp-agent.service
	systemctl start neutron-metadata-agent.service
	
	sleep 5
	source /root/keystonerc_admin
	neutron agent-list	
}


function write_install_neutron_tag ()
{
	normal_info "#######################################################################################"
	normal_info "###                           Install neutron successful                            ###"
	normal_info "#######################################################################################"
	echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_neutron.tag
	
	systemctl restart neutron-server.service
	systemctl restart neutron-l3-agent.service
}