#!/usr/bin/env bash

function install_dashboard ()
{
	check_install_dashboard_tag
	check_yum_source
	install_dashboard_packages
	setting_dashboard_service
	write_install_dashboard_tag
}

function check_install_dashboard_tag ()
{
	if [ -f  ${install_tag_path}/install_keystone.tag ]
	then 
		info_log "Check keystone have installed ."
	else
		echo -e "\033[41;37mYou should install keystone first. \033[0m"
		iaas_install_menu
	fi

	if [ -f  ${install_tag_path}/install_dashboard.tag ]
	then 
		echo -e "\033[41;37mThe install dashboard operation has been performed.\033[0m"
		info_log "you had install dashboard."	
		iaas_install_menu
	fi

	normal_info "#######################################################################################"
	normal_info "###                        Start install dashboard service                          ###"
	normal_info "#######################################################################################"
}

function install_dashboard_packages()
{
	yum install -y openstack-dashboard httpd mod_wsgi memcached python-memcached
	check_command "Install dashboard packages"
}

function setting_dashboard_service()
{
	Management_host_name=`hostname --fqdn`

	rm -rf /etc/openstack-dashboard/local_settings 
	cp -a  ${INSTALL_PATH}/etc/dashboard/local_settings /etc/openstack-dashboard/local_settings
	
	setsebool -P httpd_can_network_connect on  >/dev/null
	chown -R apache:apache /usr/share/openstack-dashboard/static
	
	sed -i  "s/controller/$Management_host_name/g"  /etc/openstack-dashboard/local_settings
	
	systemctl enable httpd.service memcached.service
	systemctl restart httpd.service memcached.service 
}


function write_install_dashboard_tag ()
{
	normal_info "#######################################################################################"
	normal_info "###                           Install dashboard successful                          ###"
	normal_info "#######################################################################################"
	echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_dashboard.tag
}
