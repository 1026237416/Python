#!/usr/bin/env bash

function install_cinder ()
{
	check_install_cinder_tag
	get_host_info
	check_yum_source
	get_database_passwd
	create_cinder_database
	create_cinder_entity
	install_cinder_packages
	setting_cinder_service
	setting_cinder_backend_storages
	write_install_cinder_tag
}

function check_install_cinder_tag ()
{
	if [ -f  ${install_tag_path}/install_keystone.tag ]
	then 
		info_log "Check keystone have installed ."
	else
		echo -e "\033[41;37mYou should install keystone first. \033[0m"
		iaas_install_menu
	fi

	if [ -f  ${install_tag_path}/install_cinder.tag ]
	then 
		echo -e "\033[41;37mThe install cinder operation has been performed.\033[0m"
		info_log "you had install cinder."	
		iaas_install_menu
	fi

	if [ "${using_evs_storage}" = "y" ];
	then
		ceph_health=`ssh ${Evs_manage_ip} "ceph health"`
		if [ 'HEALTH_OK' != "$ceph_health" ];
		then
			echo "EvStorage status is not \"HEALTH_OK\",please check!"
			exit	
		fi
	fi
 
	normal_info "#######################################################################################"
	normal_info "###                            Start install cinder service                         ###"
	normal_info "#######################################################################################"
}

function create_cinder_database ()
{
	USER_PASSWD=`cat  /etc/keystone/admin_token`
	OS_DB_PASSWD=`cat /etc/keystone/admin_token`
	ADMIN_TOKEN=`cat  /etc/keystone/admin_token`
	REGION_NAME=`cat  /etc/keystone/RegionName`

	DATABASECINDER=`ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"show databases ;\"" | grep -w cinder`
	if [ ${DATABASECINDER}x = cinderx ]
	then
		info_log "The cinder database has create."
	else
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"CREATE DATABASE cinder;\"" 
		check_command "Create cinder databases"
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON cinder.* TO 'cinder'@'localhost' IDENTIFIED BY '${OS_DB_PASSWD}';\""
		check_command "Set cinder database local access Permissions"
		ssh ${DataBase_host_ip} "mysql -uroot -p${DATABASE_PASSWD} -e \"GRANT ALL PRIVILEGES ON cinder.* TO 'cinder'@'%' IDENTIFIED BY '${OS_DB_PASSWD}';\""
		check_command "Set cinder database remote access Permissions"
	fi
}

function create_cinder_entity ()
{
	source /root/keystonerc_admin
		
	USER_CINDER=`keystone user-list 2> /dev/null | grep cinder`
	if [ -z "${USER_CINDER}" ]
	then
		keystone user-create --name cinder --pass  ${USER_PASSWD}            2> /dev/null
		check_command "Create openstack cinder user"
		keystone user-role-add --user cinder --tenant services --role admin  2> /dev/null
		check_command "Add role to cinder user"
	else
		info_log "Check openstack cinder user has already exist."
	fi

	SERVICE_CINDER_V2=`keystone service-list 2> /dev/null | grep -w cinderv2 | grep ${REGION_NAME}`
	if [ -z "${SERVICE_CINDER_V2}" ]
	then
		keystone service-create --name cinderv2 --type volumev2 --description "${REGION_NAME} Block Storage V2 Service"  2> /dev/null
		check_command "Create openstack cinder v2 service"
	else
		info_log "openstack cinder v2 service of ${REGION_NAME} has already exist."
	fi
	
	SERVICE_CINDER=`keystone service-list 2> /dev/null | grep -w cinder | grep ${REGION_NAME}`
	if [ -z "${SERVICE_CINDER}" ]
	then
		keystone service-create --name cinder --type volume --description "${REGION_NAME} Block Storage V1 Service"  2> /dev/null
		check_command "Create openstack cinder service"
	else
		info_log "openstack cinder service of ${REGION_NAME} has already exist."
	fi

	SERVICE_CINDERV2_ID=`keystone service-list 2> /dev/null | grep ${REGION_NAME} | awk '/ volumev2 / {print $2}'`
	ENDPOINT_CINDERV2=`keystone endpoint-list  2> /dev/null | grep "${SERVICE_CINDERV2_ID}"`
	if [ -z "${ENDPOINT_CINDERV2}" ]
	then
		keystone endpoint-create                                                   \
            --service-id  ${SERVICE_CINDERV2_ID}                                   \
            --publicurl   http://${Management_host_name}:8776/v2/%\(tenant_id\)s   \
            --internalurl http://${Management_host_name}:8776/v2/%\(tenant_id\)s   \
            --adminurl    http://${Management_host_name}:8776/v2/%\(tenant_id\)s   \
            --region      ${REGION_NAME}                                           2> /dev/null
		check_command "Create openstack cinder v2 endpoint"
	else
		info_log "openstack cinder v2 endpoint of ${REGION_NAME} has already exist."
	fi
	
	SERVICE_CINDER_ID=`keystone service-list 2> /dev/null | grep ${REGION_NAME} | awk '/ volume / {print $2}'`
	ENDPOINT_CINDER=`keystone endpoint-list  2> /dev/null | grep "${SERVICE_CINDER_ID}"`
	if [ -z "${ENDPOINT_CINDER}" ]
	then
		keystone endpoint-create                                                   \
            --service-id  ${SERVICE_CINDER_ID}                                     \
            --publicurl   http://${Management_host_name}:8776/v1/%\(tenant_id\)s   \
            --internalurl http://${Management_host_name}:8776/v1/%\(tenant_id\)s   \
            --adminurl    http://${Management_host_name}:8776/v1/%\(tenant_id\)s   \
            --region      ${REGION_NAME}                                           2> /dev/null
		check_command "Create openstack cinder v1 endpoint"
	else
		info_log "openstack cinder v1 endpoint of ${REGION_NAME} has already exist."
	fi
}

function install_cinder_packages ()
{
	yum install -y openstack-cinder python-cinderclient python-oslo-db
	check_command "Install cinder packages"
}

function setting_cinder_service()
{
	[ -f /etc/cinder/cinder.conf.bak ]  || cp -a /etc/cinder/cinder.conf /etc/cinder/cinder.conf.bak
	rm -rf /etc/cinder/cinder.conf
	cp ${INSTALL_PATH}/etc/cinder/cinder.conf  /etc/cinder/cinder.conf

	crudini --set /etc/cinder/cinder.conf DEFAULT  my_ip ${Management_host_ip}
	crudini --set /etc/cinder/cinder.conf DEFAULT  glance_host ${Management_host_name}
	crudini --set /etc/cinder/cinder.conf DEFAULT  os_region_name ${REGION_NAME}
	crudini --set /etc/cinder/cinder.conf database connection  mysql://cinder:${OS_DB_PASSWD}@${DataBase_host_name}/cinder 

	crudini --set /etc/cinder/cinder.conf DEFAULT storage_availability_zone ${Management_host_name}
	crudini --set /etc/cinder/cinder.conf DEFAULT default_availability_zone nova
		
	crudini --set /etc/cinder/cinder.conf oslo_messaging_rabbit rabbit_host  ${RabbitMQ_host_name} 
	crudini --set /etc/cinder/cinder.conf oslo_messaging_rabbit rabbit_hosts ${RabbitMQ_host_name}:5672
	
	[ -f /etc/cinder/api-paste.ini.bak ]  || cp -a /etc/cinder/api-paste.ini /etc/cinder/api-paste.ini.bak
	rm -rf /etc/cinder/api-paste.ini
	cp ${INSTALL_PATH}/etc/cinder/api-paste.ini  /etc/cinder/api-paste.ini

	if [ "${Master_DataCenter}" == y ];
	then
        crudini --set /etc/cinder/api-paste.ini filter:authtoken auth_uri       http://${Management_host_name}:5000/v2.0
        crudini --set /etc/cinder/api-paste.ini filter:authtoken identity_uri   http://${Management_host_name}:35357
        crudini --set /etc/cinder/api-paste.ini filter:authtoken admin_password ${USER_PASSWD}
	else
	    crudini --set /etc/cinder/api-paste.ini filter:authtoken auth_uri       http://${Master_DataCenter_Manage_hostname}:5000/v2.0
        crudini --set /etc/cinder/api-paste.ini filter:authtoken identity_uri   http://${Master_DataCenter_Manage_hostname}:35357
        crudini --set /etc/cinder/api-paste.ini filter:authtoken admin_password ${USER_PASSWD}
	fi
	chown -R root:cinder /etc/cinder/cinder.conf
	chown -R root:cinder /etc/cinder/api-paste.ini

	su -s /bin/sh -c "cinder-manage db sync" cinder 
	check_command "Initialize cinder database"
	
	systemctl enable openstack-cinder-api.service
	systemctl enable openstack-cinder-scheduler.service
#	systemctl enable openstack-cinder-volume.service
	systemctl start openstack-cinder-api.service
	systemctl start openstack-cinder-scheduler.service
#	systemctl start openstack-cinder-volume.service

	source /root/keystonerc_admin
	sleep 5
	cinder service-list	
	sleep 5
	cinder list-extensions
	sleep 5	
}

function setting_cinder_backend_storages()
{
	info_log "Start install cinder backend storage."
	
	#setting local lvm storage
	if [ "${using_local_storage}" = "y" ];
	then
		#using local Storage
		setting_local_lvm_storages
	fi
		
	if [ "${using_evs_storage}" = "y" ];
	then
		#using Easted vStorage
		setting_evs_storage
	fi
}

function setting_local_lvm_storages()
{
	source /root/keystonerc_admin
	cinder type-create lvm
	check_command "Create cinder lvm storage type"
	cinder type-key lvm set volume_backend_name=lvm
	check_command "Setting lvm storage"
}

function setting_evs_storage()
{
	yum install -y ceph-common ceph-fuse libvirt
	
	[ -f /etc/libvirt/libvirtd.conf.bak ]  || cp -a /etc/libvirt/libvirtd.conf /etc/libvirt/libvirtd.conf.bak
	[ -f /etc/sysconfig/libvirtd.bak ]     || cp -a /etc/sysconfig/libvirtd    /etc/sysconfig/libvirtd.bak
	
	rm -rf /etc/libvirt/libvirtd.conf
	rm -rf /etc/sysconfig/libvirtd
	
	cp ${INSTALL_PATH}/etc/cinder/libvirtd.conf  /etc/libvirt/libvirtd.conf
	cp ${INSTALL_PATH}/etc/cinder/libvirtd  /etc/sysconfig/libvirtd
	
	iptables -I OUTPUT -p tcp --dport 16509 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 16509 -j ACCEPT
	iptables -I INPUT  -p udp --dport 16509 -j ACCEPT
	iptables -I INPUT  -p udp --dport 16509 -j ACCEPT
	iptables-save > /etc/sysconfig/iptables
	
	systemctl restart libvirtd.service
    systemctl enable libvirtd.service

	pool_var=`ssh ${Evs_manage_ip} "ceph osd lspools | grep ${Evs_pool_name}"`
	if [ ! -n "$pool_var" ];
    then
		echo "Create storage pool in EvStorage"
		ssh ${Evs_manage_ip} "ceph osd pool create ${Evs_pool_name} 128 128"
		check_command "Create Storage pool '${Evs_pool_name}'"
		ssh ${Evs_manage_ip} "ceph auth get-or-create client.${Evs_pool_name} mon 'allow *' osd 'allow *'"
		check_command "Setting Storage pool '${Evs_pool_name} access Permissions"
		ssh ${Evs_manage_ip} "ceph auth get-or-create client.${Evs_pool_name} >> /etc/ceph/ceph.client.${Evs_pool_name}.keyring"
		check_command "Create Storage pool '${Evs_pool_name} access keyring"
	else
		info_log "${Evs_pool_name} pool already exist in EvStorage"
	fi
	
	if [ -d /etc/ceph/ ];
	then
		info_log "Create /etc/ceph/ diretctory"
		mkdir -p /etc/ceph/
	else
		info_log "/etc/ceph/ diretctory already"
	fi
	
	scp ${Evs_manage_ip}:/etc/ceph/ceph.client.admin.keyring            /etc/ceph/
	scp ${Evs_manage_ip}:/etc/ceph/ceph.conf                            /etc/ceph/
	scp ${Evs_manage_ip}:/etc/ceph/ceph.client.${Evs_pool_name}.keyring /etc/ceph/
	
	var=`ssh ${Evs_manage_ip} "[ -e '/root/ceph-${Evs_pool_name}-secrets.xml' ]" ; echo $?`
	if [ 0 = "$var" ];
	then
		scp -r ${Evs_manage_ip}:/root/ceph-${Evs_pool_name}-secrets.xml /root/ceph-${Evs_pool_name}-secrets.xml
		uuid=`cat /root/ceph-${Evs_pool_name}-secrets.xml | grep uuid | cut -d '>' -f2 | cut -d '<' -f1`
	else
		uuid=`uuidgen`
		touch /root/ceph-${Evs_pool_name}-secrets.xml 
		
		echo "<secret ephemeral='no' private='no'>"        >> /root/ceph-${Evs_pool_name}-secrets.xml 
		echo "<uuid>${uuid}</uuid>"                        >> /root/ceph-${Evs_pool_name}-secrets.xml 
		echo "<usage type='ceph'>"                         >> /root/ceph-${Evs_pool_name}-secrets.xml 
		echo "<name>client.${Evs_pool_name} secret</name>" >> /root/ceph-${Evs_pool_name}-secrets.xml 
		echo "</usage>"                                    >> /root/ceph-${Evs_pool_name}-secrets.xml 
		echo "</secret>"                                   >> /root/ceph-${Evs_pool_name}-secrets.xml 	

		scp -r /root/ceph-${Evs_pool_name}-secrets.xml ${Evs_manage_ip}:/root/ceph-${Evs_pool_name}-secrets.xml
	fi
	
	virsh secret-define --file /root/ceph-${Evs_pool_name}-secrets.xml
	virsh secret-set-value --secret ${uuid} --base64 $(ceph auth get-key client.${Evs_pool_name})
	
	cp -r ${INSTALL_PATH}/etc/cinder/evs-bin /bin/evs
	chmod +x /bin/evs
	
	crudini --set /etc/glance/glance-api.conf glance_store stores glance.store.rbd.Store,
	crudini --set /etc/glance/glance-api.conf glance_store default_store rbd
	crudini --set /etc/glance/glance-api.conf glance_store rbd_store_user ${Evs_pool_name}
	crudini --set /etc/glance/glance-api.conf glance_store rbd_store_pool ${Evs_pool_name}
	
	ENABLED_BACKENDS_VALUE=`crudini --get /etc/cinder/cinder.conf DEFAULT enabled_backends`
	if [ ! -n "$ENABLED_BACKENDS_VALUE" ];
    then
		crudini --set /etc/cinder/cinder.conf DEFAULT enabled_backends EVS_Storages
	else
		crudini --set /etc/cinder/cinder.conf DEFAULT enabled_backends ${ENABLED_BACKENDS_VALUE},EVS_Storages
	fi
	crudini --set /etc/cinder/cinder.conf DEFAULT backup_ceph_user ${Evs_pool_name}
	crudini --set /etc/cinder/cinder.conf DEFAULT backup_ceph_pool ${Evs_pool_name}
	crudini --set /etc/cinder/cinder.conf DEFAULT backup_driver    cinder.backup.drivers.ceph
	
	echo "[EVS_Storages]"                                    >> /etc/cinder/cinder.conf
	echo "volume_driver=cinder.volume.drivers.rbd.RBDDriver" >> /etc/cinder/cinder.conf
	echo "rbd_pool=${Evs_pool_name}"                         >> /etc/cinder/cinder.conf
	echo "volume_backend_name=EVS_Storages"                  >> /etc/cinder/cinder.conf
	echo "rbd_user=${Evs_pool_name}"                         >> /etc/cinder/cinder.conf
	echo "rbd_ceph_conf=/etc/ceph/ceph.conf"                 >> /etc/cinder/cinder.conf
	echo "rbd_secret_uuid=$uuid"                             >> /etc/cinder/cinder.conf
	echo "rados_connect_timeout=-1"                          >> /etc/cinder/cinder.conf
	
	source /root/keystonerc_admin
	cinder type-create EVS_Storages
	check_command "Create cinder EVS_Storages storage type"
	cinder type-key EVS_Storages set volume_backend_name=EVS_Storages
	check_command "Setting cinder EVS_Storages storage"
	systemctl enable  openstack-cinder-volume.service
	systemctl start   openstack-cinder-volume.service
	systemctl restart openstack-cinder-volume.service
	cinder type-list
#
#	info_log "Get create_nfs_file_system value is ${create_nfs_file_system}"
#	info_log "Get share_file_system_type value is ${share_file_system_type}"
#
#	if [ "${create_nfs_file_system}" == "n" ];
#    then
#        if [ "${share_file_system_type}" == "evs" ];
#        then
#            info_log "Start setting EVS share file system"
#            mkdir -p ${SHARE_DIR}                                               1>/dev/null 2>&1
#            chmod 777 -R ${SHARE_DIR}
#            info_log "Create ${SHARE_DIR}/instances and set it permission."
#
#            share_evs_manage_host=$(echo ${share_file_system_path} | cut -d" " -f1)
#            share_evs_manage_dir=$(echo ${share_file_system_path}  | cut -d" " -f2)
#            share_evs_manage_ip=$(echo ${share_evs_manage_host}    | cut -d: -f1)
#            share_evs_manage_port=$(echo ${share_evs_manage_host}  | cut -d: -f2)
#            info_log "Get share evs manage host info is: ${share_evs_manage_host}"
#            info_log "Get share evs manage dir is ${share_evs_manage_dir}"
#            info_log "Get share evs manage ip address is: ${share_evs_manage_ip}"
#            info_log "Get share evs manage ip port is: ${share_evs_manage_port}"
#
#            if [ "${share_evs_manage_ip}" == "${Evs_manage_ip}" ];
#            then
#                # 共享文件系统与cinder后端存储使用同一套EVS存储
#                # 1、检查ceph管理节点上的共享目录是否存在，不存在则创建该目录
#                var=`ssh ${Evs_manage_ip} "[ -d '${share_evs_manage_dir}' ]" ; echo $?`
#                if [ 0 = "$var" ];
#                then
#                    info_log "Find host${Evs_manage_ip} the path:${share_evs_manage_dir} already exist."
#                else
#                    ssh ${Evs_manage_ip} "mkdir -p ${share_evs_manage_dir}"
#                    info_log "Creat the host ${Evs_manage_ip} ${share_evs_manage_dir} diretctory"
#                fi
#
#                # 2、ceph管理节点挂载共享目录，并设置为开机自动挂载
#                check_share_result=`ssh ${Evs_manage_ip} "df -h | grep -w ceph-fuse | grep -w ${share_evs_manage_dir}"`
#                info_log "Check EVS management node share info is: ${check_share_result}"
#                if [ -z "${check_share_result}" ];
#                then
#                    info_log "Check Evs management node not share '${share_evs_manage_dir}',start share it."
#                    ssh ${Evs_manage_ip} "ceph-fuse -m ${share_evs_manage_host} ${share_evs_manage_dir}"
#                    ssh ${Evs_manage_ip} "echo 'ceph-fuse -m ${share_evs_manage_host} ${share_evs_manage_dir}' >> /etc/rc.d/rc.local"
#                    ssh ${Evs_manage_ip} "chmod +x /etc/rc.d/rc.local"                 1> /dev/null 2>&1
#                    ssh ${Evs_manage_ip} "systemctl enable rc-local.service"           1> /dev/null 2>&1
#                fi
#
#                # 3、将EVS的共享目录挂载到管理节点的共享目录SHARE_DIR上
#                ceph-fuse -m ${share_evs_manage_host} ${SHARE_DIR}
#                echo "ceph-fuse -m ${share_evs_manage_host} ${SHARE_DIR}"    >> /etc/rc.d/rc.local
#                chmod +x /etc/rc.d/rc.local                                  1> /dev/null 2>&1
#                systemctl enable rc-local.service                            1> /dev/null 2>&1
#                mkdir -p ${SHARE_DIR}/instances                              1> /dev/null 2>&1
#                chmod 777 -R ${SHARE_DIR}/instances
#                chown -R nova:nova ${SHARE_DIR}/instances
#
#            else
#                #共享文件存储和cinder后端存储不是使用同一套EVS存储
#                echo "ceph-fuse -m ${share_evs_manage_host} ${SHARE_DIR}"                     >> /etc/rc.d/rc.local
#                chmod +x /etc/rc.d/rc.local                                                   1>/dev/null 2>&1
#                systemctl enable rc-local.service                                             1>/dev/null 2>&1
#                ceph-fuse -m ${share_evs_manage_host} ${SHARE_DIR}
#                display_info "Mount ${share_file_system_path}"
#                mount_result=`df -h | grep "${SHARE_DIR}"`
#                if [ -n "${mount_result}" ];
#                then
#                    echo "Done"
#                    info_log "mount ${share_file_system_path} successful."
#                else
#                    echo "faild"
#                    error_info "Mount ${share_file_system_path} successful.please check"
#                    info_log "Mount ${Management_host_name}:${SHARE_DIR} successful.please check"
#                fi
#            fi
#        fi
#    fi
}



function write_install_cinder_tag ()
{
	normal_info "#######################################################################################"
	normal_info "###                         Install cinder successful                               ###"
	normal_info "#######################################################################################"
	echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_cinder.tag
	info_log "Write finish install cinder service tag"
}