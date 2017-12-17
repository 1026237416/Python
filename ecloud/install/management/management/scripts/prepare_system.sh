#!/usr/bin/env bash

INSTALL_PATH=${INSTALL_PATH}

function prepare_system ()
{
    check_prepare_tag
	check_hostname
	set_local_ssh_access
	check_database_info
	get_database_passwd
	check_rabbitmq_info
	check_mongodb_info
	check_redis_info
	check_evs_info
	check_master_dc_info
	check_nic_info
	setting_yum_source
	install_basic_tools
	setting_sync_filesystem
	setting_DNS_server
	setting_NFS_server
	setting_NTP_server
	update_system

    write_prepare_tag
}

#***********************************************************************************************************************
#                           check install tag
#***********************************************************************************************************************
function check_prepare_tag ()
{
    if [ -f  ${install_tag_path}/prepare_system.tag ]
    then
        warn_info "The prepare system operation has been performed"
        info_log  "The prepare system operation has been performed."
        iaas_install_menu
    else
        normal_info "#######################################################################################"
        normal_info "###                         Start prepare system                                    ###"
        normal_info "#######################################################################################"
    fi
}


function check_hostname ()
{
	get_hostname=`cat /etc/hostname`
	if [ "${get_hostname}" = "localhost.localdomain" ];
	then
		echo "Your hostname is \"localhost\",you must setting hostname frist."
		read -p "please input hostname for system [Default:controller] :" setting_hostname
		if  [ -z ${setting_hostname}  ]
		then 
			echo "controller" > /etc/hostname
			info_log "echo "${CONTROLLER_IP}" > /etc/hostname"
		else
			echo "${setting_hostname}" > /etc/hostname
			info_log "echo "${install_number}" > /etc/hostname"
		fi
		hostname $(cat /etc/hostname)
	fi
	host_name=`hostname`
	if [ "${host_name}" == "localhost" ];
	then
	    hostname $(cat /etc/hostname)
	fi
	
	check_hosts=`cat /etc/hosts | grep "${Management_host_ip} ${get_hostname}"`
	if  [ -z "${check_hosts}" ]
	then 
		get_hostname=`cat /etc/hostname`
		echo "${Management_host_ip} ${get_hostname}" >> /etc/hosts
	fi
	
	Management_host_name=`hostname --fqdn`
	check_command "Get controller node hostname"
	info_log "Get Management node hostname is: ${Management_host_name}"
}


function set_local_ssh_access ()
{
	rm -rf /etc/ssh/ssh_config
	rm -rf /etc/ssh/sshd_config
	cp -r  ${INSTALL_PATH}/etc/ssh/ssh_config  /etc/ssh/ssh_config
	cp -r  ${INSTALL_PATH}/etc/ssh/sshd_config /etc/ssh/sshd_config
	
#	systemctl restart  sshd.service
	
	if [ ! -f ~/.ssh/id_rsa ]; 
	then
		info_log "SSH key id_rsa not exit,create it."
		ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa
		check_command "Create local SSH key"
		if [ ! -f ~/.ssh/id_rsa ];
		then
		    error_info "Create SSH Key failed,Please check."
		    exit 1
		fi
	fi
	echo "ServerAliveInterval 60" >> ~/.ssh/config
	
	set_ssh_access ${Management_host_ip}
}


function check_database_info ()
{
	set_ssh_access ${DataBase_host_ip}
	
	mariadb_status=`ssh ${DataBase_host_ip} "systemctl status mariadb.service" | grep "active (running)"`
	if [ -z "${mariadb_status}" ];
	then
		error_info "Please ensure the mariadb-server already installed and running in ${DataBase_host_ip}."
		error_info "Check host ${DataBase_host_ip} mariadb-server failed."
		exit 1
	fi
	
	DataBase_host_name=`ssh ${DataBase_host_ip} "cat /etc/hostname"`
	info_log "Get DataBase node ${DataBase_host_ip} hostname is:\"${DataBase_host_name}\""
	
	check_hosts_file=`cat /etc/hosts | grep "${DataBase_host_ip} ${DataBase_host_name}"`
	if [ -z "${check_hosts_file}" ];
	then
		echo "${DataBase_host_ip} ${DataBase_host_name}" >> /etc/hosts
	fi
}

function check_rabbitmq_info ()
{
	set_ssh_access ${RabbitMQ_host_ip}
	
	rabbitmq_status=`ssh ${RabbitMQ_host_ip} "ps -ef | grep rabbitmq-server | grep -v grep"`
	if [ -z "${rabbitmq_status}" ];
	then
		error_info "Please ensure the rabbitmq-server already installed and running in ${RabbitMQ_host_ip}."
		error_info "Check host ${RabbitMQ_host_ip} rabbitmq-server failed."
		exit 1
	fi
	
	RabbitMQ_host_name=`ssh ${RabbitMQ_host_ip} "cat /etc/hostname"`
	info_log "Get RabbitMQ node ${RabbitMQ_host_ip} hostname is:\"${RabbitMQ_host_name}\""
	
	check_hosts_file=`cat /etc/hosts | grep "${RabbitMQ_host_ip} ${RabbitMQ_host_name}"`
	if [ -z "${check_hosts_file}" ];
	then
		echo "${RabbitMQ_host_ip} ${RabbitMQ_host_name}" >> /etc/hosts
	fi
}


function check_mongodb_info()
{
	set_ssh_access ${MongoDB_host_ip}
	
	mongodb_status=`ssh ${MongoDB_host_ip} "systemctl status mongod.service" | grep "active (running)"`
	if [ -z "${mongodb_status}" ];
	then
		error_info "Please ensure the MongoDB-server already installed and running in ${MongoDB_host_ip}."
		error_info "Check host ${MongoDB_host_ip} MongoDB-server failed."
		exit 1
	fi
	
	MongoDB_host_name=`ssh ${MongoDB_host_ip} "cat /etc/hostname"`
	info_log "Get MongoDB node ${MongoDB_host_ip} hostname is:\"${MongoDB_host_name}\""
	
	check_hosts_file=`cat /etc/hosts | grep "${MongoDB_host_ip} ${MongoDB_host_name}"`
	if [ -z "${check_hosts_file}" ];
	then
		echo "${MongoDB_host_ip} ${MongoDB_host_name}" >> /etc/hosts
	fi
}

function check_redis_info ()
{
	set_ssh_access ${Redis_host_ip}
	
	redis_status=`ssh ${Redis_host_ip} "ps -ef | grep redis-server | grep -v grep"`
	if [ -z "${redis_status}" ];
	then
		error_info "Please ensure the Redis-server already installed and running in ${Redis_host_ip}."
		error_info "Check host ${Redis_host_ip} Redis-server failed."
		exit 1
	fi
	
	Redis_host_name=`ssh ${Redis_host_ip} "cat /etc/hostname"`
	info_log "Get Redis node ${Redis_host_ip} hostname is:\"${Redis_host_name}\""
	
	check_hosts_file=`cat /etc/hosts | grep "${Redis_host_ip} ${Redis_host_name}"`
	if [ -z "${check_hosts_file}" ];
	then
		echo "${Redis_host_ip} ${Redis_host_name}" >> /etc/hosts
	fi
}

function check_evs_info()
{
    if [ "${using_evs_storage}" = "y" ];
	then
        set_ssh_access ${Evs_manage_ip}

        evs_status=`ssh ${Evs_manage_ip} "ceph -v | grep 'ceph version'"`
        if [ -z "${evs_status}" ];
        then
            error_info "Please ensure the EVS storage has already installed and running in ${Evs_manage_ip}."
		    error_info "Check host ${Evs_manage_ip} ceph failed."
            exit 1
        fi

        evs_host_name=`ssh ${Evs_manage_ip} "cat /etc/hostname"`
        info_log "Get EvStorage node ${Evs_manage_ip} hostname is:\"${evs_host_name}\""

        check_hosts_file=`cat /etc/hosts | grep "${Evs_manage_ip} ${evs_host_name}"`
        if [ -z "${check_hosts_file}" ];
        then
            echo "${Evs_manage_ip} ${evs_host_name}" >> /etc/hosts
        fi
	fi
}

function check_master_dc_info()
{
    if [ "${Master_DataCenter}" == n ];
	then
	    set_ssh_access ${Master_DataCenter_Manage_ip}
	    set_ssh_access ${Master_DataCenter_DataBase_ip}

        ssh ${Master_DataCenter_Manage_ip} "keystone --version  2> /dev/null"
        if [ "$?" != "0" ];
        then
            error_info "Check Master DataCenter Identify service failed, please check your Master DataCenter!"
            error_log "Check Master DataCenter Identify service failed,stop install."
            exit 1
        else
            normal_info "Check Master DataCenter Identify service successful."
            info_log "Check Master DataCenter Identify service successful,start next step."
        fi

        master_mariadb_status=`ssh ${Master_DataCenter_DataBase_ip} "systemctl status mariadb.service" | grep "active (running)"`
        if [ -z "${master_mariadb_status}" ];
        then
            error_info "Please ensure the mariadb-server already installed and running in ${DataBase_host_ip}."
		    error_log "Check host ${Master_DataCenter_DataBase_ip} mariadb.service failed,stop install."
            exit 1
        else
            normal_info "Check Master DataCenter Identify Database successful."
            info_log "Check Master DataCenter Identify Database successful,start next step."
        fi

        Master_Redis_status=`ssh ${Master_DataCenter_Redis_ip} "ps -ef | grep redis-server | grep -v grep"`
        if [ -z "${redis_status}" ];
        then
            error_info "Please ensure the Redis-server already installed and running in ${Master_DataCenter_Redis_ip}."
            error_info "Check host ${Master_DataCenter_Redis_ip} Redis-server failed."
            exit 1
        fi

        Master_DataCenter_Manage_hostname=`ssh ${Master_DataCenter_Manage_ip} "cat /etc/hostname"`
        info_log "Get Master DataCenter management node ${Master_DataCenter_Manage_ip} hostname is:\"${Master_DataCenter_Manage_hostname}\""
        Master_DataCenter_DataBase_hostname=`ssh ${Master_DataCenter_DataBase_ip} "cat /etc/hostname"`
        info_log "Get Master DataCenter DataBase node ${Master_DataCenter_DataBase_ip} hostname is:\"${Master_DataCenter_DataBase_hostname}\""
        Master_DataCenter_Redis_name=`ssh ${Master_DataCenter_Redis_ip} "cat /etc/hostname"`
        info_log "Get Master DataCenter DataBase node ${Master_DataCenter_Redis_ip} hostname is:\"${Master_DataCenter_Redis_name}\""

        check_hosts_file=`ssh ${Master_DataCenter_Manage_ip} "cat /etc/hosts | grep '${Management_host_ip} ${Management_host_name}'"`
        if [ -z "${check_hosts_file}" ];
        then
            ssh ${Master_DataCenter_Manage_ip} "echo '${Management_host_ip} ${Management_host_name}' >> /etc/hosts"
            check_command "Write local host info to master DC hosts file"
        fi

        check_hosts_file=`cat /etc/hosts | grep '${Master_DataCenter_Manage_ip} ${Master_DataCenter_Manage_hostname}'`
        if [ -z "${check_hosts_file}" ];
        then
            echo "${Master_DataCenter_Manage_ip} ${Master_DataCenter_Manage_hostname}" >> /etc/hosts
            check_command "Write master DC ${Master_DataCenter_Manage_ip} host info to hosts file"
        fi

        check_hosts_file=`cat /etc/hosts | grep '${Master_DataCenter_DataBase_ip} ${Master_DataCenter_DataBase_hostname}'`
        if [ -z "${check_hosts_file}" ];
        then
            echo "${Master_DataCenter_DataBase_ip} ${Master_DataCenter_DataBase_hostname}" >> /etc/hosts
            check_command "Write master DC ${Master_DataCenter_DataBase_ip} host info to hosts file"
        fi

        check_hosts_file=`cat /etc/hosts | grep '${Master_DataCenter_Redis_ip} ${Master_DataCenter_Redis_name}'`
        if [ -z "${check_hosts_file}" ];
        then
            echo "${Master_DataCenter_Redis_ip} ${Master_DataCenter_Redis_name}" >> /etc/hosts
            check_command "Write master DC ${Master_DataCenter_Redis_ip} host info to hosts file"
        fi
	fi
}

function check_nic_info ()
{
	NIC_INFO=`ifconfig -a | grep BROADCAST | awk -F : '{print$1}'`
	count=0
	DEF_R_NIC=()
	for NIC in ${NIC_INFO[@]}
	do
		if [ -f /etc/sysconfig/network-scripts/ifcfg-${NIC} ];
		then
		    DEF_INFO=`cat /etc/sysconfig/network-scripts/ifcfg-${NIC} | grep -w DEFROUTE`
		    if [ ! -z "${DEF_INFO}" ];
		    then
                DEF_INFO_YES=`cat /etc/sysconfig/network-scripts/ifcfg-${NIC} | grep -w DEFROUTE | grep -w yes`
                if [ ! -z "${DEF_INFO_YES}" ];
                then
                    count=$(($count+1))
                    DEF_R_NIC=(${DEF_R_NIC[*]} ${NIC})
                fi
            else
                error_info "Can not find NIC ${NIC} Default route info,please check!"
                error_log "Can not find NIC ${NIC} Default route info"
                exit
            fi
		else
		    error_info "Can not find configure file of NIC ${NIC},please check!"
		    error_log "Can not find configure file of NIC ${NIC}"
		    exit
		fi
	done
	
	case ${count} in
	0)
		echo -e "\033[41;37mNot Find Default route in this host,please check!  \033[0m"
		error_log "Not Find Default route in this host"
		exit
	;;
	1)
		info_log "Check default route done."
	;;
	*)
		error_info "Find this host has more than one Default route:\"${DEF_R_NIC[*]}\",please check!"
		error_log "Find this host has more than one Default route"
		exit
	;;
	esac
}

#***********************************************************************************************************************
#                           setting yum sources
#***********************************************************************************************************************
function setting_yum_source ()
{
	
	cp -r  /etc/yum.repos.d /etc/yum.repos.d.bak
	rm -rf /etc/yum.repos.d/*
	info_log "Delete local repo file."
	echo "[iaas]" > /etc/yum.repos.d/iaas.repo
	echo "name=iaas" >> /etc/yum.repos.d/iaas.repo
	echo "baseurl=file:///mnt/iaas" >> /etc/yum.repos.d/iaas.repo
	echo "gpgcheck=0" >> /etc/yum.repos.d/iaas.repo
	echo "enabled=1" >> /etc/yum.repos.d/iaas.repo
	echo "proxy=_none_" >> /etc/yum.repos.d/iaas.repo
	
	tar xzvfm ${INSTALL_PATH}/packages/iaas/iaas.tar.gz -C /mnt
	check_command "Unpacking yum source"
}


function install_basic_tools ()
{
	CHECK_VALUE=`rpm -qa | grep crudini`
	if [ -z "${CHECK_VALUE}" ];
	then
		yum install -y crudini
		check_command "Install openstack setting tools crudini"
	else
		info_log "Openstack setting tools crudini already installed"
	fi
	
	CHECK_VALUE=` rpm -qa | grep mariadb-5`
	if [ -z "${CHECK_VALUE}" ];
	then
		yum install -y mariadb
		check_command "Install openstack DataBase client"
	else
		info_log "Openstack DataBase client already installed"
	fi
	
	CHECK_VALUE=` rpm -qa | grep python-pip`
	if [ -z "${CHECK_VALUE}" ];
	then
		yum install -y python-pip
		check_command "Install python-pip"
	else
		info_log "Openstack python-pip already installed"
	fi
}


function setting_sync_filesystem()
{
    create_sync_filesystem=n
    if [ "${create_sync_filesystem}" == "y" ];
    then
        check_result=`rpm -qa | grep rsync`
        if [ -z "${check_result}" ];
        then
            yum install -y rsync
            check_command "install rsync"
        fi

        check_result=`rpm -qa | grep inotify-tools`
        if [ -z "${check_result}" ];
        then
            yum install -y inotify-tools
            check_command "install inotify-tools"
        fi

        rm -rf /etc/rsyncd.conf
        cp ${INSTALL_PATH}/rsync/rsyncd.conf /etc/rsyncd.conf

        systemctl stop    firewalld.service
        systemctl disable firewalld.service

        echo "rsync --daemon" >> /etc/rc.d/rc.local
        chmod +x /etc/rc.d/rc.local                         1>/dev/null 2>&1
        systemctl enable rc-local.service                   1>/dev/null 2>&1
        rsync --daemon&

        cp ${INSTALL_PATH}/rsync/synchosts /etc/rc.d/init.d/synchosts
        chmod 777 /etc/rc.d/init.d/synchosts
        service synchosts start &
    fi
}


#***********************************************************************************************************************
#                           Create DNS server
#***********************************************************************************************************************
function setting_DNS_server ()
{
    create_DNS_server=n
    if [ "${create_DNS_server}" == "y" ];
    then
	    info_log "Start Configure DNS server."

	    yum install -y bind-chroot bind-utils
	    check_command "Install DNS basic package"

        iptables -I INPUT  -p tcp --dport 53 -j ACCEPT
        iptables -I INPUT  -p tcp --dport 53 -j ACCEPT
        iptables -I OUTPUT -p udp --dport 53 -j ACCEPT
        iptables -I OUTPUT -p udp --dport 53 -j ACCEPT
        iptables-save > /etc/sysconfig/iptables

        firewall-cmd --zone=public --add-port=53/tcp --permanent  1>/dev/null 2>&1
        firewall-cmd --zone=public --add-port=53/udp --permanent  1>/dev/null 2>&1
        systemctl restart firewalld.service

        setenforce 0

        mv /etc/named.conf /etc/named.conf.bak
        cp ${INSTALL_PATH}/etc/dns/named.conf /etc/named.conf
        cp ${INSTALL_PATH}/etc/dns/ecloud.easted.com.cn.zone  /var/named/ecloud.easted.com.cn.zone

        systemctl start  named.service
        systemctl enable named.service

        sed -i "1i\search ecloud.easted.com.cn"         /etc/resolv.conf
        sed -i "2i\nameserver ${Management_host_ip}" /etc/resolv.conf

        echo "ns            IN  A   ${Management_host_ip}"              >> /var/named/ecloud.easted.com.cn.zone
        echo "${Management_host_name}   IN  A   ${Management_host_ip}"  >> /var/named/ecloud.easted.com.cn.zone

        add_DNS_host_info ${DataBase_host_ip} ${DataBase_host_name}
        add_DNS_host_info ${MongoDB_host_ip}  ${MongoDB_host_name}
        add_DNS_host_info ${RabbitMQ_host_ip} ${RabbitMQ_host_name}
        add_DNS_host_info ${Redis_host_ip}    ${Redis_host_name}

        if [ "${using_evs_storage}" = "y" ];
	    then
	        add_DNS_host_info ${Evs_manage_ip} ${evs_host_name}
	    fi

	    if [ "${Master_DataCenter}" == n ];
	    then
	        add_DNS_host_info ${Master_DataCenter_Manage_ip} ${Master_DataCenter_Manage_hostname}
	        add_DNS_host_info ${Master_DataCenter_DataBase_ip} ${Master_DataCenter_DataBase_hostname}
	        add_DNS_host_info ${Master_DataCenter_Redis_ip} ${Master_DataCenter_Redis_name}
	    fi
    fi
    systemctl restart named.service
}


setting_NFS_server()
{
    create_NFS_server=n
    if [ "y" == "${create_NFS_server}" ];
    then
        if [ "${create_nfs_file_system}" == "y" ];
        then
            yum install -y rpcbind nfs-utils
            check_command "Install NFS basic package"

            iptables -I INPUT -p tcp --dport 111 -j ACCEPT
            iptables -I INPUT -p tcp --dport 2049 -j ACCEPT
            iptables -I INPUT -p udp --dport 111 -j ACCEPT
            iptables -I INPUT -p udp --dport 2046 -j ACCEPT
            iptables-save > /etc/sysconfig/iptables

            firewall-cmd --zone=public --add-port=111/tcp --permanent  1>/dev/null 2>&1
            firewall-cmd --zone=public --add-port=2049/tcp --permanent  1>/dev/null 2>&1
            firewall-cmd --zone=public --add-port=2046/tcp --permanent  1>/dev/null 2>&1
            systemctl restart firewalld.service

            service rpcbind start
            service nfs start
            check_command "Start nfs service"
            systemctl enable rpcbind.service
            ln -s /usr/lib/systemd/system/nfs.service /etc/systemd/system/multi-user.target.wants/nfs.service
            ln -s /usr/lib/systemd/system/nfs-server.service /etc/systemd/system/multi-user.target.wants/nfs-server.service

            sleep 3
            check_result=`systemctl status nfs.service | grep "active (exited)"`
            if [ -z "${check_result}" ];
            then
                echo "Start NFS server faild, please check!!!"
                error_log "Start NFS server faild."
                exit
            fi
        fi
    fi
}


#***********************************************************************************************************************
#                           Cteate NTP server
#***********************************************************************************************************************
function setting_NTP_server ()
{
	#1、移除自带的ntpdate包
	systemctl disable chronyd.service 
	systemctl stop chronyd.service 
	yum remove -y ntpdate
	#2、安装NTP服务
	yum install -y ntp
	check_command "Install NTP server"
	#3、配置ntp服务器
	mv /etc/ntp.conf /etc/ntp.conf.bak
	cp ${INSTALL_PATH}/etc/ntp/ntp.conf /etc/ntp.conf
	systemctl start ntpd.service
	systemctl enable  ntpd.service
	iptables -I INPUT -p udp --dport 123 -j ACCEPT
	iptables -I INPUT -p tcp --dport 123 -j ACCEPT
	iptables-save > /etc/sysconfig/iptables
	ntpq -p
}

function update_system()
{
	normal_info "#######################################################################################"
	normal_info "###                            Update management node                               ###"
	normal_info "#######################################################################################"
	
	sed -i 's/SELINUX=.*/SELINUX=disabled/g' `grep ^SELINUX= -rl /etc/selinux/config`
	info_log "Set local /etc/selinux/config file SELINUX=enforcing to SELINUX=disabled."
	setenforce 0
	info_log "Close local selinux service"
	
	info_log "Update management node."
	yum -y update --skip-broken  | tee -a ${LOG_FILE}
	check_command "Update system"
	info_log "Update management OK"
	systemctl stop NetworkManager           > /dev/null 2>&1
	systemctl stop iptables.service         > /dev/null 2>&1
	systemctl stop firewalld.service        > /dev/null 2>&1
	systemctl disable NetworkManager        > /dev/null 2>&1
	systemctl disable iptables.service      > /dev/null 2>&1
	systemctl disable firewalld.service     > /dev/null 2>&1
}

#***********************************************************************************************************************
#                           write install tag
#***********************************************************************************************************************
function write_prepare_tag ()
{
	normal_info "#######################################################################################"
	normal_info "###                      Prepare system successful                                  ###"
	normal_info "#######################################################################################"
    echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/prepare_system.tag
}