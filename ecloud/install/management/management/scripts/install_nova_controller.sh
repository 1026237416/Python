#!/usr/bin/env bash

function install_nova_controller ()
{
	check_install_nova_controller_tag
	get_host_info
	check_yum_source
	get_database_passwd
	create_nova_database
	create_nova_entity
	install_nova_controller_packages
	setting_nova_controller
	verify_nova_service
	
#	setting_xml_share_dir
	write_install_nova_controller_tag
}

function check_install_nova_controller_tag ()
{
	if [ -f  ${install_tag_path}/install_keystone.tag ]
	then 
		info_log "Check keystone have installed ."
	else
		echo -e "\033[41;37mYou should install keystone first. \033[0m"
		iaas_install_menu
	fi

	if [ -f  ${install_tag_path}/install_nova_controller.tag ]
	then 
		echo -e "\033[41;37mThe install nova_controller operation has been performed.\033[0m"
		info_log "you had install nova_controller."	
		iaas_install_menu
	fi

	normal_info "#######################################################################################"
	normal_info "###                     Start install nova_controller service                       ###"
	normal_info "#######################################################################################"
}

function create_nova_database ()
{
	USER_PASSWD=`cat  /etc/keystone/admin_token`
	OS_DB_PASSWD=`cat /etc/keystone/admin_token`
	ADMIN_TOKEN=`cat  /etc/keystone/admin_token`
	REGION_NAME=`cat  /etc/keystone/RegionName`

	DATABASENOVA=`ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"show databases ;\"" | grep -w nova`
	if [ ${DATABASENOVA}x = novax ]
	then
		info_log "nova database had installed."
	else
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"CREATE DATABASE nova;\"" 
		check_command "Create nova databases"
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON nova.* TO 'nova'@'localhost' IDENTIFIED BY '${OS_DB_PASSWD}';\""
		check_command "Set nova database local access Permissions"
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON nova.* TO 'nova'@'%' IDENTIFIED BY '${OS_DB_PASSWD}';\""
		check_command "Set nova database remote access Permissions"
	fi
}

function create_nova_entity ()
{
	source /root/keystonerc_admin
		
	USER_NOVA=`keystone user-list 2> /dev/null | grep nova | awk -F "|" '{print$3}' | awk -F " " '{print$1}'`
	if [ ${USER_NOVA}x = novax ]
	then
		info_log "Check openstack nova user has already exist."
	else
		keystone user-create --name nova --pass  ${USER_PASSWD}                2> /dev/null
		check_command "Create openstack nova user"
		keystone user-role-add --user nova --tenant services --role admin      2> /dev/null
		check_command "Add role to nova user"
	fi

	SERVICE_NOVA=`keystone service-list 2> /dev/null | grep nova | grep ${REGION_NAME} | awk -F "|" '{print$3}' | awk -F " " '{print$1}'`
	if [  ${SERVICE_NOVA}x = novax ]
	then 
		info_log "openstack nova service has already exist."
	else
		keystone service-create --name nova --type compute --description "${REGION_NAME} Compute Service"   2> /dev/null
		check_command "Create openstack nova service"
	fi
	compute_service_id=`keystone service-list 2> /dev/null | grep ${REGION_NAME} | awk '/ compute / {print $2}'`

	ENDPOINT_GLANCE=`keystone endpoint-list 2> /dev/null | grep ${compute_service_id}`
	if [ -z "${ENDPOINT_GLANCE}" ]
	then
		keystone endpoint-create \
            --service-id  ${compute_service_id}                                   \
            --publicurl   http://${Management_host_name}:8774/v2/%\(tenant_id\)s  \
            --internalurl http://${Management_host_name}:8774/v2/%\(tenant_id\)s  \
            --adminurl    http://${Management_host_name}:8774/v2/%\(tenant_id\)s  \
            --region      ${REGION_NAME}                    2> /dev/null
		check_command "Create openstack nova endpoint"
	else
		info_log "openstack nova endpoint has already exist."
	fi
}

function install_nova_controller_packages()
{
	yum install -y openstack-nova-api openstack-nova-cert openstack-nova-conductor openstack-nova-console openstack-nova-novncproxy openstack-nova-scheduler python-novaclient
	check_command "Install nova controller packages"
}

function setting_nova_controller ()
{
	[ -f /etc/nova/nova.conf.bak ]  || cp -a /etc/nova/nova.conf /etc/nova/nova.conf.bak
	rm -rf /etc/nova/nova.conf
	cp ${INSTALL_PATH}/etc/nova/nova.conf /etc/nova/nova.conf
	
	crudini --set /etc/nova/nova.conf DEFAULT metadata_host ${Management_host_ip}	
	crudini --set /etc/nova/nova.conf DEFAULT metadata_listen ${Management_host_ip}
	crudini --set /etc/nova/nova.conf DEFAULT novncproxy_base_url http://${Management_host_ip}:6080/vnc_auto.html
	crudini --set /etc/nova/nova.conf DEFAULT vncserver_proxyclient_address ${Management_host_name}
	crudini --set /etc/nova/nova.conf DEFAULT os_region_name ${REGION_NAME}
	
	crudini --set /etc/nova/nova.conf cinder os_region_name ${REGION_NAME}
	crudini --set /etc/nova/nova.conf glance api_servers ${Management_host_name}:9292
	
	crudini --set /etc/nova/nova.conf database connection  mysql://nova:${OS_DB_PASSWD}@${DataBase_host_name}/nova

	if [ "${Master_DataCenter}" == y ];
	then
        crudini --set /etc/nova/nova.conf keystone_authtoken auth_uri       http://${Management_host_name}:5000/v2.0
        crudini --set /etc/nova/nova.conf keystone_authtoken identity_uri   http://${Management_host_name}:35357
        crudini --set /etc/nova/nova.conf keystone_authtoken admin_password ${USER_PASSWD}
    else
        crudini --set /etc/nova/nova.conf keystone_authtoken auth_uri       http://${Master_DataCenter_Manage_hostname}:5000/v2.0
        crudini --set /etc/nova/nova.conf keystone_authtoken identity_uri   http://${Master_DataCenter_Manage_hostname}:35357
        crudini --set /etc/nova/nova.conf keystone_authtoken admin_password ${USER_PASSWD}
    fi
	
	crudini --set /etc/nova/nova.conf oslo_messaging_rabbit rabbit_host  ${RabbitMQ_host_name}
	crudini --set /etc/nova/nova.conf oslo_messaging_rabbit rabbit_hosts ${RabbitMQ_host_name}:5672
	
	crudini --set /etc/nova/nova.conf matchmaker_redis host ${Redis_host_name}
	
	chown -R root:nova /etc/nova
	
	su -s /bin/sh -c "nova-manage db sync" nova 
	check_command "Initialize nova database"

	iptables -I INPUT  -p udp --dport 8774 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 8774 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 8774 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 8774 -j ACCEPT
	
	iptables -I INPUT  -p udp --dport 6080 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 6080 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 6080 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 6080 -j ACCEPT
	
	iptables -I INPUT  -p udp --dport 5672 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 5672 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 5672 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 5672 -j ACCEPT

	firewall-cmd --zone=public --add-port=5672/tcp --permanent  1>/dev/null 2>&1
	firewall-cmd --zone=public --add-port=8774/tcp --permanent  1>/dev/null 2>&1
	firewall-cmd --zone=public --add-port=6080/tcp --permanent  1>/dev/null 2>&1
	systemctl restart firewalld.service

	iptables-save > /etc/sysconfig/iptables

	systemctl enable openstack-nova-api.service
	systemctl enable openstack-nova-cert.service
	systemctl enable openstack-nova-console.service
	systemctl enable openstack-nova-scheduler.service
	systemctl enable openstack-nova-conductor.service
	systemctl enable openstack-nova-novncproxy.service 
	systemctl enable openstack-nova-consoleauth.service
	
	systemctl start openstack-nova-api.service
	systemctl start openstack-nova-cert.service
	systemctl start openstack-nova-console.service
	systemctl start openstack-nova-scheduler.service
	systemctl start openstack-nova-conductor.service
	systemctl start openstack-nova-novncproxy.service
	systemctl start openstack-nova-consoleauth.service

	systemctl restart openstack-nova-api.service
	systemctl restart openstack-nova-cert.service
	systemctl restart openstack-nova-console.service
	systemctl restart openstack-nova-scheduler.service
	systemctl restart openstack-nova-conductor.service
	systemctl restart openstack-nova-novncproxy.service
	systemctl restart openstack-nova-consoleauth.service 
}

function verify_nova_service ()
{
	source /root/keystonerc_admin 
	nova service-list 
	check_command "Check Nova service"
	NOVA_STATUS=`nova service-list | awk -F "|" '{print$7}'  | grep -v State | grep -v ^$ | grep down`
	if [  -z ${NOVA_STATUS} ]
	then
		info_log  "nova status is ok"
		normal_info "Check nova service status OK"
	else
		openstack-service restart nova
	 fi
}

function setting_xml_share_dir ()
{
    if [ "${create_nfs_file_system}" == "y" ];
    then
        check_result=`systemctl status nfs.service | grep "active (exited)"`
        if [ -z "${check_result}" ];
        then
            error_info "Start NFS server faild, please check!"
            error_log "Start NFS server faild."
        else
            mkdir -p ${SHARE_DIR}/instances 1>/dev/null 2>&1
            chmod 777 -R ${SHARE_DIR}
            check_result=`cat /etc/exports | grep "${SHARE_DIR}"`
            if [ -n "${check_result}" ];
            then
                info_log "${SHARE_DIR} alredy exist in /etc/exports."
            else
                echo "${SHARE_DIR} *(rw,insecure,sync,no_root_squash)" >> /etc/exports
            fi

            display_info "Share ${SHARE_DIR}"
            exportfs -a
            share_value=`showmount -e | grep "${SHARE_DIR}"`
            if [ -n "${share_value}" ];
            then
                echo "Done"
                info_log "Share ${SHARE_DIR} successful."
            else
                echo "faild"
                echo "Share ${SHARE_DIR} faild,please check it."
                info_log "Share ${SHARE_DIR} faild."
            fi
        fi
    else
        case ${share_file_system_type} in
        nfs)
            mkdir -p ${SHARE_DIR}/instances 1>/dev/null 2>&1
            chmod 777 -R ${SHARE_DIR}
            display_info "Mount ${share_file_system_path}"
            mount -t nfs ${share_file_system_path} ${SHARE_DIR}
            mount_result=`df -h | grep "${SHARE_DIR}"`
            if [ -n "${mount_result}" ];
            then
                echo "Done"
                info_log "mount ${share_file_system_path} to local ${SHARE_DIR} successful."
                chown -R nova:nova ${SHARE_DIR}/instances
                check_result=`cat "/etc/fstab" | grep "${share_file_system_path}"`
                if [ -n "${check_result}" ];
                then
                    info_log "Value ${share_file_system_path} already exist in /etc/fstab"
                else
                    echo "${share_file_system_path}       ${SHARE_DIR}       nfs     defaults        0 0" >> /etc/fstab
                fi
            else
                echo "faild"
                echo "Mount ${share_file_system_path} successful.please check"
                info_log "Mount ${share_file_system_path} successful.please check"
            fi
        ;;
        evs)
            info_log "Needn't create NFS,User config using EVS share file system."
            if [ "${using_evs_storage}" = "n" ];
            then
                check_command_result=`ceph-fuse --version | grep "command not found"`
                if [ -z "${check_command_result}" ];
                then
                    info_log "Not find ceph-fuse command"
                else
                    mkdir -p ${SHARE_DIR}/instances                                               1>/dev/null 2>&1
                    chmod 777 -R ${SHARE_DIR}
                    echo "ceph-fuse -m ${share_file_system_path} ${SHARE_DIR}"                    >> /etc/rc.d/rc.local
                    chmod +x /etc/rc.d/rc.local                                                   1>/dev/null 2>&1
                    systemctl enable rc-local.service                                             1>/dev/null 2>&1
                    ceph-fuse -m ${share_file_system_path} ${SHARE_DIR}
                    display_info "Mount ${share_file_system_path}"
                    mount_result=`df -h | grep "${SHARE_DIR}"`
                    if [ -n "${mount_result}" ];
                    then
                        echo "Done"
                        info_log "mount ${share_file_system_path} successful."
                    else
                        echo "faild"
                        error_info "Mount ${share_file_system_path} successful.please check"
                        info_log "Mount ${Management_host_name}:${SHARE_DIR} successful.please check"
                    fi
                fi
            fi
        ;;
        other)
            info_log "Needn't create NFS,User config using other share file system."
            mkdir -p ${SHARE_DIR}/instances 1>/dev/null 2>&1
            chmod 777 -R ${SHARE_DIR}
        ;;
        *)
            error_info "Your install.conf file error,'share_file_system_type' only [nfs/evs/other],please check it!"
        ;;
        esac
    fi
}

function write_install_nova_controller_tag ()
{
	normal_info "#######################################################################################"
	normal_info "###                         Install nova_controller successful                      ###"
	normal_info "#######################################################################################"
	echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_nova_controller.tag
}