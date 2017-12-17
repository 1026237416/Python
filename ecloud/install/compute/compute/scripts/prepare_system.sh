#!/usr/bin/env bash
INSTALL_PATH=${INSTALL_PATH}
Management_host_ip=${Management_host_ip}
Compute_host_ip=${Compute_host_ip}
TOP_DIR=${TOP_DIR}

function prepare_compute_system ()
{
    set_controller_ssh_access
	setting_yum_source
	check_compute_hostname
	sync_compute_hosts
	install_config_tools
	check_network_info
	update_OS
	setting_firewall
}


function set_controller_ssh_access ()
{
	rm -rf /etc/ssh/ssh_config
	rm -rf /etc/ssh/sshd_config
	cp -r  ${INSTALL_PATH}/etc/ssh_config  /etc/ssh/ssh_config
	cp -r  ${INSTALL_PATH}/etc/sshd_config /etc/ssh/sshd_config
	
#	systemctl restart sshd.service
	
	if [ ! -f ~/.ssh/id_rsa ]; 
	then
		info_log "SSH key id_rsa not exit,create it."
		ssh-keygen -t rsa -P '' -f ~/.ssh/id_rsa
		if [ ! -f ~/.ssh/id_rsa ];
		then
		    error_info "Create SSH Key failed,Please check."
		    error_log "Create SSH Key failed,Please check.stop install."
		    exit 1
		fi
	fi
	echo "ServerAliveInterval 60" >> ~/.ssh/config
	
	ssh -o NumberOfPasswordPrompts=0 ${Management_host_ip} "date" > /dev/null 2>&1
    if [ $? = 0 ];
	then
        info_log "Check to ${Management_host_ip} SSH no password access already clear."
    else
        ssh-copy-id  ${Management_host_ip}
		ssh -o NumberOfPasswordPrompts=0 ${Management_host_ip} "date"
		if [ $? = 0 ];
		then
			info_log "Set to ${Management_host_ip} SSH no password access successful."
		else
			error_info "Set to $Management_host_ip SSH no password access faild,please check."
			error_log "Set to $Management_host_ip SSH no password access faild,please check."
			exit 1
		fi
    fi
	#检查管理节点到当前计算节点之间的无密码访问
	if [ "${Management_host_ip}" != "${Compute_host_ip}" ];
	then
		ssh ${Management_host_ip} "cat /root/.ssh/id_rsa.pub" >> /root/.ssh/authorized_keys	
		ssh ${Management_host_ip} "ssh ${Compute_host_ip} 'date'" > /dev/null 2>&1
		if [ $? = 0 ];
		then
			info_log "Set to ${Management_host_ip} SSH no password access successful."
		else
			error_info "Set to $Management_host_ip SSH no password access faild,please check."
			error_log "Set to $Management_host_ip SSH no password access failed,please check."
			exit 1
		fi
	fi
	
	Management_host_name=`ssh ${Management_host_ip} "hostname --fqdn"`
	check_command "Get Management node hostname ${Management_host_name}"
}


#********************************************************************
#                           setting yum sources
#********************************************************************
function setting_yum_source ()
{
	cp -r /etc/yum.repos.d /etc/yum.repos.d.bak
	rm -rf /etc/yum.repos.d/*
	info_log "Delete local repo file."

	echo "[compute]"                   >  /etc/yum.repos.d/compute.repo
	echo "name=compute"                >> /etc/yum.repos.d/compute.repo
	echo "baseurl=file:///mnt/compute" >> /etc/yum.repos.d/compute.repo
	echo "gpgcheck=0"                  >> /etc/yum.repos.d/compute.repo
	echo "enabled=1"                   >> /etc/yum.repos.d/compute.repo
	echo "proxy=_none_"                >> /etc/yum.repos.d/compute.repo

	tar xzvfm ${INSTALL_PATH}/packages/compute.tar.gz -C /mnt
	check_command "Unpacking yum source"
}


function check_compute_hostname ()
{
	IP_NAME=Compute$(echo ${Compute_host_ip} | cut -d "." -f 3)$(echo ${Compute_host_ip} | cut -d "." -f 4)
	get_hostname=`cat /etc/hostname`
	if [ "${get_hostname}" = "localhost.localdomain" ];
	then
		echo "Your hostname is \"localhost\",you must setting hostname frist."
		read -p "please input hostname for system [Default:compute${IP_NAME}] :" setting_hostname
		if  [ -z ${setting_hostname}  ]
		then
			echo "${IP_NAME}" > /etc/hostname
			info_log "echo \"compute${IP_NAME}\" > /etc/hostname"
		else
			echo "${setting_hostname}" > /etc/hostname
			info_log "echo "${setting_hostname}" > /etc/hostname"
		fi
		hostname $(cat /etc/hostname)
	fi
	get_hostname=`cat /etc/hostname`
	if [ "${get_hostname}" == "localhost" ];
	then
	    hostname $(cat /etc/hostname)
	    get_hostname=`cat /etc/hostname`
	fi

	check_hosts=`ssh ${Management_host_ip} "cat /etc/hosts" | grep "${Compute_host_ip} ${get_hostname}"`
	if  [ -z "${check_hosts}" ]
	then
		ssh ${Management_host_ip} "echo \"${Compute_host_ip} ${get_hostname}\" >> /etc/hosts"
	fi
	
	if [ "${Management_host_ip}" != "${Compute_host_ip}" ];
	then
		scp -r ${Management_host_ip}:/etc/hosts /etc/hosts
	fi
	
	Compute_host_name=`hostname --fqdn`
	check_command "Get local hostname"
}

function sync_compute_hosts()
{
	ssh ${Management_host_ip} "source /root/keystonerc_admin; nova service-list"
	check_command "Get nova service info"
	NODE_INFO=`ssh ${Management_host_ip} "source /root/keystonerc_admin; nova service-list | grep -w nova-compute| cut -d'|' -f4 | sed 's/^[ \t]*//g' | sed 's/[ \t]*$//g'"`
	if [ -z "${NODE_INFO}" ];
	then
		info_log "Now no compute node."
	else
		for HOST in ${NODE_INFO[@]}
		do
			if [ "${HOST}" != "${Compute_host_name}" ]; 
			then
				ssh ${Management_host_ip} "scp -r /etc/hosts ${HOST}:/etc/hosts"
			fi
		done
	fi

#	sed -i "1i\search ecloud.easted.com.cn"         /etc/resolv.conf
#	sed -i "2i\nameserver ${Management_host_ip}" /etc/resolv.conf
#
#	check_dns_value=`ssh ${Management_host_ip} "cat /var/named/ecloud.easted.com.cn.zone | grep ${Compute_host_ip} | grep ${Compute_host_name}"`
#	if [ -z "${check_dns_value}" ];
#	then
#	    ssh ${Management_host_ip} "echo \"${Compute_host_name}      IN  A   ${Compute_host_ip}\"  >> /var/named/ecloud.easted.com.cn.zone"
#	    ssh ${Management_host_ip} "systemctl restart named.service"
#	fi
}


function install_config_tools ()
{
	CHECK_VALUE=`rpm -qa | grep crudini`
	if [ -z "${CHECK_VALUE}" ];
	then
		yum install -y crudini
		check_command "Install openstack tools crudini"
	else
		info_log "Openstack tools crudini already installed"
	fi
}

function check_network_info()
{
    if [ "${Management_host_ip}" != "${Compute_host_ip}" ];
	then
        NIC_INFO=`ifconfig -a | grep BROADCAST | grep -v br- | grep -v virbr0 | grep -v ovs | awk -F : '{print$1}'`
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
                    exit 1
                fi
            else
                error_info "Can not find configure file of NIC ${NIC},please check!"
                error_log "Can not find configure file of NIC ${NIC}"
                exit 1
            fi
        done

        case ${count} in
        1)
            info_log "Check default route done."
        ;;
        *)
            error_info "Find this host has more than one Default route:\"${DEF_R_NIC[*]}\",please check!"
            error_log "Find this host has more than one Default route"
            exit 1
        ;;
        esac
	fi

	network_names=`crudini --get ${TOP_DIR}/install.conf network_info network_name`
	if [ -z ${network_names} ];
	then
		error_info "Not find Network information, Please configure the 'network_name' information in install.cong first"
		error_log "Can't find the config network information."
		exit 1
	fi
	info_log "Get all of network name is: ${network_names}"

	all_network_names=(${network_names//,/ })
	info_log "Change to array is: ${all_network_names[*]}"

	for network_name in "${all_network_names[@]}"
	do
		info_log "Check network ${network_name} info."
		bridge_name=`crudini --get ${TOP_DIR}/install.conf ${network_name} bridge_name`

		if [ -z ${bridge_name} ];
		then
			error_info "Please configure the network ${network_name}'s bridge information"
			error_log  "Can't find ${network_name}'s bridge."
			exit 1
		fi
		info_log "Get ${network_name}'s bridge name is: ${bridge_name},check pass."

		phy_nic=`crudini --get ${TOP_DIR}/install.conf ${network_name} physical_nic`
		if [ -z ${phy_nic} ];
		then
			error_info "Please configure network ${network_name} Physical NIC information"
			error_log "Can't find the config network ${network_name} will be used Physical NIC."
			exit 1
		fi
		info_log "Get network ${network_name} will be used Physical NIC is: ${phy_nic}"
	done
}

function update_OS()
{
	echo "================================================================================================"
	echo "                                  Update compute node                                              "
	echo "================================================================================================"
	
	sed -i 's/SELINUX=.*/SELINUX=disabled/g' `grep ^SELINUX= -rl /etc/selinux/config`
	info_log "Set /etc/selinux/config file SELINUX=enforcing to SELINUX=disabled."
	setenforce 0
	info_log "Close  selinux service"
	
	info_log "Update compute node."
	yum -y update --skip-broken
		
	systemctl stop NetworkManager           > /dev/null 2>&1
	systemctl stop iptables.service         > /dev/null 2>&1
	systemctl stop firewalld.service        > /dev/null 2>&1
	systemctl disable NetworkManager        > /dev/null 2>&1
	systemctl disable iptables.service      > /dev/null 2>&1
	systemctl disable firewalld.service     > /dev/null 2>&1
	
	yum install -y openstack-selinux
	check_command "Install openstack-selinux"
}

function setting_firewall()
{
    iptables -I INPUT -p tcp --dport 111 -j ACCEPT
    iptables -I INPUT -p tcp --dport 2049 -j ACCEPT
    iptables -I INPUT -p udp --dport 111 -j ACCEPT
    iptables -I INPUT -p udp --dport 2046 -j ACCEPT
    iptables-save > /etc/sysconfig/iptables

    firewall-cmd --zone=public --add-port=111/tcp --permanent  1>/dev/null 2>&1
    firewall-cmd --zone=public --add-port=2049/tcp --permanent  1>/dev/null 2>&1
    firewall-cmd --zone=public --add-port=2046/tcp --permanent  1>/dev/null 2>&1
    systemctl restart firewalld.service

    iptables -I INPUT -p udp --dport 123 -j ACCEPT
    iptables -I INPUT -p tcp --dport 123 -j ACCEPT
    iptables-save > /etc/sysconfig/iptables



	iptables -I OUTPUT -p tcp --dport 16509 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 16509 -j ACCEPT
	iptables -I INPUT  -p udp --dport 16509 -j ACCEPT
	iptables -I INPUT  -p udp --dport 16509 -j ACCEPT

	iptables -I OUTPUT -p udp --dport 5000  -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 5000  -j ACCEPT
	iptables -I INPUT  -p udp --dport 5000  -j ACCEPT
	iptables -I INPUT  -p tcp --dport 5000  -j ACCEPT

	iptables -I OUTPUT -p udp --dport 35357 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 35357 -j ACCEPT
	iptables -I INPUT  -p udp --dport 35357 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 35357 -j ACCEPT

	iptables -I OUTPUT -p udp --dport 5672  -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 5672  -j ACCEPT
	iptables -I INPUT  -p udp --dport 5672  -j ACCEPT
	iptables -I INPUT  -p tcp --dport 5672  -j ACCEPT

	iptables -I OUTPUT -p udp --dport 8774  -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 8774  -j ACCEPT
	iptables -I INPUT  -p udp --dport 8774  -j ACCEPT
	iptables -I INPUT  -p tcp --dport 8774  -j ACCEPT
	iptables-save > /etc/sysconfig/iptables

	firewall-cmd --zone=public --add-port=16509/tcp --permanent  1>/dev/null 2>&1
	firewall-cmd --zone=public --add-port=5000/tcp --permanent   1>/dev/null 2>&1
	firewall-cmd --zone=public --add-port=35357/tcp --permanent  1>/dev/null 2>&1
	firewall-cmd --zone=public --add-port=5672/tcp --permanent   1>/dev/null 2>&1
	firewall-cmd --zone=public --add-port=8774/tcp --permanent   1>/dev/null 2>&1
	systemctl restart firewalld.service

	iptables -I INPUT  -p tcp --dport 161 -j ACCEPT
	iptables -I INPUT  -p udp --dport 161 -j ACCEPT
	iptables -I INPUT  -p tcp --dport 162 -j ACCEPT
	iptables -I INPUT  -p udp --dport 162 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 161 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 161 -j ACCEPT
	iptables -I OUTPUT -p tcp --dport 162 -j ACCEPT
	iptables -I OUTPUT -p udp --dport 162 -j ACCEPT
	iptables-save > /etc/sysconfig/iptables

    iptables -I OUTPUT -p tcp --dport 16509 -j ACCEPT
    iptables -I OUTPUT -p tcp --dport 16509 -j ACCEPT
    iptables -I INPUT  -p udp --dport 16509 -j ACCEPT
    iptables -I INPUT  -p udp --dport 16509 -j ACCEPT
    iptables-save > /etc/sysconfig/iptables
}

