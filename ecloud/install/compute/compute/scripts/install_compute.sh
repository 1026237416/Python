#!/usr/bin/env bash

TOP_DIR=${TOP_DIR}
INSTALL_PATH=${INSTALL_PATH}
SHARE_DIR=${SHARE_DIR}
Management_host_ip=${Management_host_ip}
install_tag_path=${install_tag_path}
EVS_STORAGE_TYPE_NAME=${EVS_STORAGE_TYPE_NAME}
using_evs_storage=${using_evs_storage}
Compute_host_ip=${Compute_host_ip}
Compute_host_name=${Compute_host_name}

function install_compute ()
{
	check_install_compute_tag
	prepare_compute_system
	get_controller_info
	install_ntp_client
	install_compute_service
	install_compute_network_service
	install_compute_cinder_service
	install_compute_telemetry_service
	
	setting_start_onboot_service	
	write_install_compute_tag
}

function check_install_compute_tag ()
{
	#标签，判断系统是否已经执行过添加计算节点操作
	if [ -f  ${install_tag_path}/install_compute.tag ]
	then 
		error_info "This node already a compute node."
		info_log "This node already a compute node."
		exit
	else
		normal_info "#######################################################################################"
        normal_info "###                          Start install compute node                             ###"
        normal_info "#######################################################################################"
		
		if  [ ! -d ${install_tag_path} ]
		then 
			mkdir -p ${install_tag_path}  
		fi
	fi
}

function get_controller_info ()
{
    check_file_result=`ssh ${Management_host_ip} "[ -e '/root/keystonerc_admin' ]"; echo $?`
    if [ 0 != "${check_file_result}" ];
    then
        error_info "Can not find /root/keystonerc_admin file in ${Management_host_ip}."
        exit 1
    fi

    USER_PASSWD=`ssh ${Management_host_ip} "crudini --get /etc/keystone/keystone.conf DEFAULT admin_token"`
    OS_DB_PASSWD=`ssh ${Management_host_ip} "crudini --get /etc/keystone/keystone.conf DEFAULT admin_token"`
    ADMIN_TOKEN=`ssh ${Management_host_ip} "crudini --get /etc/keystone/keystone.conf DEFAULT admin_token"`
    REGION_NAME=`ssh ${Management_host_ip} "cat /root/keystonerc_admin | grep -w OS_REGION_NAME | cut -d= -f2"`
	
	Management_host_name=`ssh ${Management_host_ip} "hostname --fqdn"`
	check_command "Get Management node hostname ${Management_host_name}"
	info_log "Get Management node ${Management_host_ip} hostname is:\"${Management_host_name}\""

    if [ "${using_evs_storage}" == "y" ];
    then
        check_evs_info=`ssh ${Management_host_ip} "source /root/keystonerc_admin;cinder type-list | grep ${EVS_STORAGE_TYPE_NAME}"`
        if [ -z "${check_evs_info}" ];
        then
            error_info "Not find EVS backend storage in ${Management_host_ip},please check!"
            error_log "Not find EVS backend storage in ${Management_host_ip}"
            exit 1
        else
            info_log "Find EVS storage type in ${Management_host_ip},using EVS backend storage."
            evs_user=`ssh ${Management_host_ip} "crudini --get /etc/cinder/cinder.conf ${EVS_STORAGE_TYPE_NAME} rbd_user"`
            Evs_pool_name=`ssh ${Management_host_ip} "crudini --get /etc/cinder/cinder.conf ${EVS_STORAGE_TYPE_NAME} rbd_pool"`
            evs_uuid=`ssh ${Management_host_ip} "crudini --get /etc/cinder/cinder.conf ${EVS_STORAGE_TYPE_NAME} rbd_secret_uuid"`

            info_log "Get value evs_user is ${evs_user}"
            info_log "Get value Evs_pool_name is ${Evs_pool_name}"
            info_log "Get value evs_uuid is ${evs_uuid}"
        fi
    fi

	NOVA_DB_URL=`ssh ${Management_host_ip} "crudini --get /etc/nova/nova.conf database connection"`
	Redis_host=`ssh ${Management_host_ip} "crudini --get /etc/nova/nova.conf matchmaker_redis host"`
	RabbitMQ_host=`ssh ${Management_host_ip} "crudini --get /etc/nova/nova.conf oslo_messaging_rabbit rabbit_host"`
	RabbitMQ_hosts=`ssh ${Management_host_ip} "crudini --get /etc/nova/nova.conf oslo_messaging_rabbit rabbit_hosts"`

    auth_uri=`ssh ${Management_host_ip} "crudini --get /etc/neutron/neutron.conf keystone_authtoken auth_uri"`
	identity_uri=`ssh ${Management_host_ip} "crudini --get /etc/neutron/neutron.conf keystone_authtoken identity_uri"`
    nova_neutron_url=`ssh ${Management_host_ip} "crudini --get /etc/nova/nova.conf neutron url"`
    nova_neutron_admin_auth_url=`ssh ${Management_host_ip} "crudini --get /etc/nova/nova.conf neutron admin_auth_url"`

    cinder_DB_url=`ssh ${Management_host_ip} "crudini --get /etc/cinder/cinder.conf database connection"`
    metering_secret=`ssh ${Management_host_ip} "crudini --get /etc/ceilometer/ceilometer.conf publisher metering_secret"`

    info_log "Get value USER_PASSWD is ${USER_PASSWD}"
    info_log "Get value OS_DB_PASSWD is ${OS_DB_PASSWD}"
    info_log "Get value ADMIN_TOKEN is ${ADMIN_TOKEN}"
    info_log "Get value REGION_NAME is ${REGION_NAME}"
    info_log "Get value NOVA_DB_URL is ${NOVA_DB_URL}"
    info_log "Get value Redis_host is ${Redis_host}"
    info_log "Get value RabbitMQ_host is ${RabbitMQ_host}"
    info_log "Get value RabbitMQ_hosts is ${RabbitMQ_hosts}"
    info_log "Get value auth_uri is ${auth_uri}"
    info_log "Get value identity_uri is ${identity_uri}"
    info_log "Get value nova_neutron_url is ${nova_neutron_url}"
    info_log "Get value nova_neutron_admin_auth_url is ${nova_neutron_admin_auth_url}"
    info_log "Get value cinder_DB_url is ${cinder_DB_url}"
    info_log "Get value metering_secret is: ${metering_secret}"
}


function install_ntp_client ()
{
	if [ -f  ${install_tag_path}/install_ntp.tag ]
	then 
		info_log "NTP client already installed."	
	else
		if [ "${Management_host_ip}" != "${Compute_host_ip}" ];
		then
			systemctl disable chronyd.service
			systemctl stop chronyd.service 
			ssh ${Management_host_ip} "systemctl start ntpd.service"
			yum -y install ntp 
			check_command "Install install ntp"
			if [ -f /etc/ntp.conf  ]
			then 
				cp -a /etc/ntp.conf /etc/ntp.conf_bak
				sed -i 's/^server/#server/' /etc/ntp.conf
				sed -i "21i server ${Management_host_name} iburst" /etc/ntp.conf
			fi 
			systemctl enable ntpd.service
			systemctl start ntpd.service  
			check_command "Enable on boot and start ntpd.service"
			sleep 3
			ntpq -c peers 
			ntpq -c assoc
			
			manage_date=`ssh ${Management_host_ip} "date \"+%Y-%m-%d %H:%M:%S\""`
			clock --set --date="$manage_date"
			hwclock --hctosys
				
			ntpdate -u ${Management_host_ip}
			echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_ntp.tag
		fi
	fi
}


function install_compute_service()
{
	install_nova_service
	setting_nova_service
}


function install_nova_service ()
{
	yum install -y openstack-nova-compute sysfsutils
	check_command "Install nova compute service"
}

function setting_nova_service ()
{
	if [ "${Management_host_ip}" != "${Compute_host_ip}" ];
	then
		[ -f  /etc/nova/nova.conf.bak  ] || mv /etc/nova/nova.conf /etc/nova/nova.conf.bak
		rm -rf /etc/nova/nova.conf
		cp ${INSTALL_PATH}/etc/compute_nova.conf   /etc/nova/nova.conf
		
		crudini --set /etc/nova/nova.conf DEFAULT metadata_host                 ${Management_host_ip}
		crudini --set /etc/nova/nova.conf DEFAULT sql_connection                ${NOVA_DB_URL}
		crudini --set /etc/nova/nova.conf DEFAULT vncserver_proxyclient_address ${Compute_host_name}
		crudini --set /etc/nova/nova.conf DEFAULT novncproxy_base_url           http://${Management_host_ip}:6080/vnc_auto.html

		crudini --set /etc/nova/nova.conf cinder os_region_name ${REGION_NAME}
		crudini --set /etc/nova/nova.conf glance api_servers    ${Management_host_name}:9292
		
		crudini --set /etc/nova/nova.conf matchmaker_redis host ${Redis_host}
		crudini --set /etc/nova/nova.conf oslo_messaging_rabbit rabbit_host  ${RabbitMQ_host}
		crudini --set /etc/nova/nova.conf oslo_messaging_rabbit rabbit_hosts ${RabbitMQ_hosts}
	fi
	
	HARDWARE=`egrep -c '(vmx|svm)' /proc/cpuinfo`
	if [ ${HARDWARE}  -eq 0 ]
	then 
		crudini --set  /etc/nova/nova.conf libvirt virt_type  qemu 
	else
		crudini --set  /etc/nova/nova.conf libvirt virt_type  kvm
	fi	
	
	chown -R root:kvm /dev/kvm
	chmod -R 666 /dev/kvm
	chown root:nova /etc/nova/nova.conf
	
	[ -f /etc/libvirt/libvirtd.conf.bak ] || cp -a /etc/libvirt/libvirtd.conf /etc/libvirt/libvirtd.conf.bak
	[ -f /etc/sysconfig/libvirtd.bak ]    || cp -a /etc/sysconfig/libvirtd    /etc/sysconfig/libvirtd.bak
	
	rm -rf /etc/libvirt/libvirtd.conf
	rm -rf /etc/sysconfig/libvirtd
	
	cp ${INSTALL_PATH}/etc/libvirtd.conf  /etc/libvirt/libvirtd.conf
	cp ${INSTALL_PATH}/etc/libvirtd       /etc/sysconfig/libvirtd
	
	systemctl enable libvirtd.service
	systemctl enable openstack-nova-compute.service
	systemctl start libvirtd.service
	systemctl start openstack-nova-compute.service
}

function install_compute_network_service ()
{
	if [ "${Management_host_ip}" != "${Compute_host_ip}" ];
	then
		install_neutron_service
		setting_neutron_service
		setting_neutron_bridge
	fi
}

function install_neutron_service ()
{
	yum install -y openstack-neutron openstack-neutron-ml2 openstack-neutron-openvswitch 
	check_command "Install openstack compute network"
}

function setting_neutron_service ()
{	
	SYSCT=`cat /etc/sysctl.conf | grep net.ipv4.conf.all.rp_filter |awk -F "=" '{print$1}'`
	if [ ${SYSCT}x = net.ipv4.conf.default.rp_filterx ]
	then
		info_log "/etc/sysctl.conf had config."
	else
		echo "net.ipv4.conf.all.rp_filter=0"         >>  /etc/sysctl.conf        
		echo "net.ipv4.conf.default.rp_filter=0"     >>  /etc/sysctl.conf
		echo "net.bridge.bridge-nf-call-iptables=1"  >>  /etc/sysctl.conf
		# echo "net.bridge.bridge-nf-call-ip6tables=1" >>  /etc/sysctl.conf
	fi
	
	sysctl -p >/dev/null
	
	[ -f /etc/neutron/neutron.conf.bak ]             || mv /etc/neutron/neutron.conf /etc/neutron/neutron.conf.bak
	[ -f /etc/neutron/plugins/ml2/ml2_conf.ini.bak ] || mv /etc/neutron/plugins/ml2/ml2_conf.ini /etc/neutron/plugins/ml2/ml2_conf.ini.bak 
	
	rm -rf /etc/neutron/neutron.conf
	rm -rf /etc/neutron/plugins/ml2/ml2_conf.ini

	cp ${INSTALL_PATH}/etc/compute_neutron.conf /etc/neutron/neutron.conf
	cp ${INSTALL_PATH}/etc/compute_ml2_conf.ini /etc/neutron/plugins/ml2/ml2_conf.ini
	
	chown root:neutron /etc/neutron/neutron.conf
	chown root:neutron /etc/neutron/plugins/ml2/ml2_conf.ini
	
	sed -i '/^connection/d' /etc/neutron/neutron.conf 
	
	crudini --set  /etc/neutron/neutron.conf DEFAULT               nova_region_name ${REGION_NAME}
	
	crudini --set  /etc/neutron/neutron.conf keystone_authtoken    auth_uri         ${auth_uri}
	crudini --set  /etc/neutron/neutron.conf keystone_authtoken    identity_uri     ${identity_uri}

	crudini --set  /etc/neutron/neutron.conf oslo_messaging_rabbit rabbit_host      ${RabbitMQ_host}
	crudini --set  /etc/neutron/neutron.conf oslo_messaging_rabbit rabbit_hosts     ${RabbitMQ_hosts}
	
	crudini --set /etc/nova/nova.conf neutron url            ${nova_neutron_url}
	crudini --set /etc/nova/nova.conf neutron admin_auth_url ${nova_neutron_admin_auth_url}
	crudini --set /etc/nova/nova.conf neutron admin_password ${USER_PASSWD}
	crudini --set /etc/nova/nova.conf neutron os_region_name ${REGION_NAME}
	
	network_names=`crudini --get ${TOP_DIR}/install.conf network_info network_name`
	all_network_names=(${network_names//,/ })
	
	crudini --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2_type_flat flat_networks ${network_names}
	for network_name in "${all_network_names[@]}"
	do
		network_vlan_ranges=${network_vlan_ranges}${network_name}:1:4094,
	done
	network_vlan_ranges=${network_vlan_ranges%?}
	
	crudini --set /etc/neutron/plugins/ml2/ml2_conf.ini ml2_type_vlan network_vlan_ranges ${network_vlan_ranges}
	
	ln -s /etc/neutron/plugins/ml2/ml2_conf.ini /etc/neutron/plugin.ini
	
	[ -f  /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini.bak ] || mv /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini.bak 
	rm -rf /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini
	cp ${INSTALL_PATH}/etc/ovs_neutron_plugin.ini /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini
	
	chown root:neutron /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini
	
	crudini --set /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini ovs local_ip ${Compute_host_ip}
	crudini --set /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini ovs bridge_mappings
	
	network_names=`crudini --get ${TOP_DIR}/install.conf network_info network_name`
	all_network_names=(${network_names//,/ })
	for network_name in "${all_network_names[@]}"
	do
		bridge_name=`crudini --get ${TOP_DIR}/install.conf ${network_name} bridge_name`
		bridge_mappings=${bridge_mappings}${network_name}:${bridge_name},
	done
	bridge_mappings=${bridge_mappings%?}
	crudini --set /etc/neutron/plugins/openvswitch/ovs_neutron_plugin.ini ovs bridge_mappings ${bridge_mappings}

	systemctl enable openvswitch.service
	systemctl start openvswitch.service
	systemctl restart openstack-nova-compute.service
	systemctl enable neutron-openvswitch-agent.service
	systemctl start neutron-openvswitch-agent.service	
}

function setting_neutron_bridge ()
{
	network_names=`crudini --get ${TOP_DIR}/install.conf network_info network_name`
	info_log "Get all of network name is: ${network_names}"
	
	all_network_names=(${network_names//,/ })
	info_log "Change to array is: ${all_network_names[*]}"
	
	for network_name in "${all_network_names[@]}"
	do
		bridge_name=`crudini --get ${TOP_DIR}/install.conf ${network_name} bridge_name`
		info_log "Get ${network_name}'s bridge name is: ${bridge_name}."
		ovs-vsctl add-br ${bridge_name}
		
		phy_nic=`crudini --get ${TOP_DIR}/install.conf ${network_name} physical_nic`
		ovs-vsctl add-port ${bridge_name} ${phy_nic}
		ethtool -K ${phy_nic} gro off

		DEFR_INFO=`cat /etc/sysconfig/network-scripts/ifcfg-${phy_nic} | grep -w DEFROUTE`
		phy_nic_ip_type=`cat /etc/sysconfig/network-scripts/ifcfg-${phy_nic} | grep IPADDR`
		if [ -z "${phy_nic_ip_type}" ];
		then
			echo "ONBOOT=yes"            >  /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "${DEFR_INFO}"          >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "PEERDNS=no"            >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "NM_CONTROLLED=no"      >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "NOZEROCONF=yes"        >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "DEVICE=${bridge_name}" >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "DEVICETYPE=ovs"        >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "OVSBOOTPROTO=dhcp"     >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "TYPE=OVSBridge"        >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
		else
			echo "ONBOOT=yes"            >  /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
			echo "${DEFR_INFO}"          >> /etc/sysconfig/network-scripts/ifcfg-${bridge_name}
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
			if [ -z "${phy_nic_mask}" ];
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

function install_compute_cinder_service ()
{
	install_cinder_service
	setting_cinder_service
}

function install_cinder_service ()
{
	yum install --skip-broken -y openstack-cinder targetcli python-oslo-db 
	check_command "Install openstack compute cinder service"
}

function setting_cinder_service ()
{
	if [ "${Management_host_ip}" != "${Compute_host_ip}" ];
	then
		[ -f  /etc/cinder/cinder.conf.bak ] || mv /etc/cinder/cinder.conf /etc/cinder/cinder.conf.bak 	
		rm -rf /etc/cinder/cinder.conf
		cp ${INSTALL_PATH}/etc/compute_cinder.conf /etc/cinder/cinder.conf
		
		chown root:cinder /etc/cinder/cinder.conf
		
		crudini --set /etc/cinder/cinder.conf DEFAULT glance_host ${Management_host_name}
		crudini --set /etc/cinder/cinder.conf DEFAULT os_region_name ${REGION_NAME}
		
		crudini --set /etc/cinder/cinder.conf DEFAULT storage_availability_zone ${Compute_host_name}
		crudini --set /etc/cinder/cinder.conf DEFAULT default_availability_zone nova
		
		crudini --set /etc/cinder/cinder.conf database connection ${cinder_DB_url}
		
		crudini --set /etc/cinder/cinder.conf keystone_authtoken auth_uri ${auth_uri}
		crudini --set /etc/cinder/cinder.conf keystone_authtoken identity_uri ${identity_uri}
		crudini --set /etc/cinder/cinder.conf keystone_authtoken admin_password ${USER_PASSWD} 
		
		crudini --set /etc/cinder/cinder.conf oslo_messaging_rabbit rabbit_host  ${RabbitMQ_host}
		crudini --set /etc/cinder/cinder.conf oslo_messaging_rabbit rabbit_hosts ${RabbitMQ_hosts}
	fi
	
	rm -rf /usr/lib/python2.7/site-packages/glanceclient/common/http.py
	cp ${INSTALL_PATH}/etc/http.py /usr/lib/python2.7/site-packages/glanceclient/common/http.py
	
	systemctl enable openstack-cinder-volume.service 
	systemctl enable target.service
	systemctl start openstack-cinder-volume.service
	systemctl start target.service
	
	if [ "${using_evs_storage}" == "y" ];
	then
		setting_evs_storages
	fi
}

function setting_evs_storages()
{
	if [ "${Management_host_ip}" != "${Compute_host_ip}" ];
	then
		yum install -y ceph-common ceph-fuse libvirt
		
		if [ -d /etc/ceph/ ];
		then
			info_log "Create /etc/ceph/ diretctory"
			mkdir -p /etc/ceph/
		else
			info_log "/etc/ceph/ diretctory already"
		fi
		
		scp -r ${Management_host_ip}:/etc/ceph/ceph.client.admin.keyring       /etc/ceph/
		scp -r ${Management_host_ip}:/etc/ceph/ceph.conf                       /etc/ceph/
		scp -r ${Management_host_ip}:/etc/ceph/ceph.client.${evs_user}.keyring /etc/ceph/
		
		scp -r ${Management_host_ip}:/root/ceph-${evs_user}-secrets.xml /etc/ceph/ceph-${evs_user}-secrets.xml
		
		virsh secret-define --file /etc/ceph/ceph-${evs_user}-secrets.xml
		virsh secret-set-value --secret ${evs_uuid} --base64 $(ceph auth get-key client.${evs_user})
		
		cp -r ${INSTALL_PATH}/etc/evs-bin /bin/evs
		chmod +x /bin/evs
	fi
	
	crudini --set /etc/nova/nova.conf libvirt inject_password      true
	crudini --set /etc/nova/nova.conf libvirt inject_key           true
	crudini --set /etc/nova/nova.conf libvirt inject_partition     -1
	crudini --set /etc/nova/nova.conf libvirt images_type          rbd
	crudini --set /etc/nova/nova.conf libvirt images_rbd_pool      ${Evs_pool_name}
	crudini --set /etc/nova/nova.conf libvirt images_rbd_ceph_conf /etc/ceph/ceph.conf
	crudini --set /etc/nova/nova.conf libvirt rbd_user             ${evs_user}
	crudini --set /etc/nova/nova.conf libvirt rbd_secret_uuid      ${evs_uuid}
	
	systemctl restart openstack-cinder-volume.service
}

function install_compute_telemetry_service ()
{
	install_compute_ceilometer_service
	setting_compute_ceilometer_service
}

function install_compute_ceilometer_service ()
{
	yum install -y openstack-ceilometer-compute python-ceilometerclient python-pecan net-snmp net-snmp-utils 
	check_command "Install openstack compute ceilometer service"
}

function setting_compute_ceilometer_service ()
{
	if [ "${Management_host_ip}" != "${Compute_host_ip}" ];
	then
		[ -f  /etc/ceilometer/ceilometer.conf.bak ] || mv /etc/ceilometer/ceilometer.conf /etc/ceilometer/ceilometer.conf.bak 	
		rm -rf /etc/ceilometer/ceilometer.conf
		cp ${INSTALL_PATH}/etc/compute_ceilometer.conf /etc/ceilometer/ceilometer.conf
		
		chown root:ceilometer /etc/ceilometer/ceilometer.conf
		
		crudini --set /etc/ceilometer/ceilometer.conf DEFAULT   os_region_name  ${REGION_NAME}
		crudini --set /etc/ceilometer/ceilometer.conf publisher metering_secret ${metering_secret}
		
		crudini --set /etc/ceilometer/ceilometer.conf service_credentials os_password ${USER_PASSWD}
		crudini --set /etc/ceilometer/ceilometer.conf service_credentials os_auth_url ${auth_uri}
		crudini --set /etc/ceilometer/ceilometer.conf service_credentials os_region_name ${REGION_NAME}
		
		crudini --set /etc/ceilometer/ceilometer.conf oslo_messaging_rabbit rabbit_host  ${RabbitMQ_host}
		crudini --set /etc/ceilometer/ceilometer.conf oslo_messaging_rabbit rabbit_hosts ${RabbitMQ_hosts}
		
		mv /etc/ceilometer/pipeline.yaml /etc/ceilometer/pipeline.yaml.bak
		cp ${INSTALL_PATH}/etc/pipeline.yaml /etc/ceilometer/pipeline.yaml
		chown -R root:ceilometer /etc/ceilometer/pipeline.yaml
	fi
	
	mv /etc/snmp/snmpd.conf           /etc/snmp/snmpd.conf.bak
	cp ${INSTALL_PATH}/etc/snmpd.conf /etc/snmp/snmpd.conf

    CHECK_METER_VALUE=`ssh ${Management_host_ip} "cat /etc/ceilometer/pipeline.yaml" | grep -w ${Compute_host_ip}`
    if [ -z "${CHECK_METER_VALUE}" ];
	then
        SNMP_VALUE=resources:
	    SNMP_VALUE="$SNMP_VALUE \n          - snmp:\/\/${Compute_host_ip}"
        ssh ${Management_host_ip} "sed -i \"s/resources:/$SNMP_VALUE/g\" /etc/ceilometer/pipeline.yaml"
	fi
	
	systemctl enable openstack-ceilometer-compute.service
	systemctl start openstack-ceilometer-compute.service
	
	systemctl restart snmpd.service 
	systemctl enable  snmpd.service
	systemctl restart snmptrapd.service
	systemctl enable  snmptrapd.service 
	openstack-service restart ceilometer
	openstack-service restart nova
	openstack-service restart neutron

	ssh ${Management_host_ip} "systemctl restart snmpd.service"
	ssh ${Management_host_ip} "systemctl restart snmptrapd.service "
	ssh ${Management_host_ip} "openstack-service restart ceilometer"
	ssh ${Management_host_ip} "openstack-service restart nova"
	ssh ${Management_host_ip} "openstack-service restart neutron"
}

function setting_start_onboot_service ()
{
	if [ "${Management_host_ip}" != "${Compute_host_ip}" ];
	then
		cp ${INSTALL_PATH}/etc/C_ecloud_service   /bin/ecloud_service
	else
		cp ${INSTALL_PATH}/etc/C-M_ecloud_service /bin/ecloud_service
	fi
	
	sed -i "1iManagement_node=${Management_host_name}" /bin/ecloud_service
	chmod +x /bin/ecloud_service
	
	echo "sh /bin/ecloud_service&"  >> /etc/rc.d/rc.local
	chmod +x /etc/rc.d/rc.local                         1>/dev/null 2>&1  
	systemctl enable rc-local.service                   1>/dev/null 2>&1
}

function write_install_compute_tag ()
{
	echo -e "\033[32m ################################################################################### \033[0m"
	echo -e "\033[32m ###                    Install computer node Successful                         ### \033[0m"
	echo -e "\033[32m ################################################################################### \033[0m"
    echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_compute.tag

    systemctl stop NetworkManager           > /dev/null 2>&1
	systemctl stop iptables.service         > /dev/null 2>&1
	systemctl stop firewalld.service        > /dev/null 2>&1
	systemctl disable NetworkManager        > /dev/null 2>&1
	systemctl disable iptables.service      > /dev/null 2>&1
	systemctl disable firewalld.service     > /dev/null 2>&1
}
