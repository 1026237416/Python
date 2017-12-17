#!/usr/bin/env bash

function iaas_install_menu()
{
#**************Install Menu Start*********************************************************************
	echo -e "\033[1;48;32mWelcome to the Ecloud Platform Installer. What would you like to do?\033[0m"
	
	if [ ! -f ${install_tag_path}/no_auto_install.tag ]
	then
		if [ -f  ${install_tag_path}/auto_install.tag ]
		then
			echo -e "\033[1;47;30m        a) Automatic deploy Ecloud Platform.\033[0m"
		else
			echo -e "\033[1;48;32m        a) Automatic deploy Ecloud Platform.\033[0m"
		fi
	fi

	if [ -f  ${install_tag_path}/prepare_system.tag ]
    then
        echo -e "\033[1;47;30m        1) prepare system.\033[0m"
    else
        echo -e "\033[1;48;32m        1) prepare system.\033[0m"
    fi
	
	if [ -f  ${install_tag_path}/install_keystone.tag ]
    then
        echo -e "\033[1;47;30m        2) install keystone.\033[0m"
    else
        echo -e "\033[1;48;32m        2) install keystone.\033[0m"
    fi

	if [ -f  ${install_tag_path}/install_glance.tag ]
    then
        echo -e "\033[1;47;30m        3) install glance.\033[0m"
    else
        echo -e "\033[1;48;32m        3) install glance.\033[0m"
    fi
	
	if [ -f  ${install_tag_path}/install_nova_controller.tag ]
    then
        echo -e "\033[1;47;30m        4) install nova_controller.\033[0m"
    else
        echo -e "\033[1;48;32m        4) install nova_controller.\033[0m"
    fi
	
	if [ -f  ${install_tag_path}/install_cinder.tag ]
    then
        echo -e "\033[1;47;30m        5) install cinder.\033[0m"
    else
        echo -e "\033[1;48;32m        5) install cinder.\033[0m"
    fi
	
	if [ -f  ${install_tag_path}/install_neutron.tag ]
    then
        echo -e "\033[1;47;30m        6) install neutron.\033[0m"
    else
        echo -e "\033[1;48;32m        6) install neutron.\033[0m"
    fi
	
	if [ -f  ${install_tag_path}/install_ceilometer.tag ]
    then
        echo -e "\033[1;47;30m        7) install ceilometer.\033[0m"
    else
        echo -e "\033[1;48;32m        7) install ceilometer.\033[0m"
    fi
	
	if [ -f  ${install_tag_path}/install_dashboard.tag ]
    then
        echo -e "\033[1;47;30m        8) install dashboard.\033[0m"
    else
        echo -e "\033[1;48;32m        8) install dashboard.\033[0m"
    fi
	
	if [ -f  ${install_tag_path}/install_ecloud.tag ]
    then
        echo -e "\033[1;47;30m        9) install Ecloud Platform.\033[0m"
    else
        echo -e "\033[1;48;32m        9) install Ecloud Platform.\033[0m"
    fi
	
	echo -e "\033[1;48;30m        0) quit.\033[0m"
#****************Install Menu End*********************************************************************
	
	if [ -f ${install_tag_path}/no_auto_install.tag ]
	then
		read -p "please input one key for install :" install_number
	else
		if [ ! -f  ${install_tag_path}/auto_install.tag ]
		then
			read -p "please input one key for install [Default: 'a']:" install_number
			if [ -z "${install_number}" ];
			then
				install_number=a
			fi
		else
			read -p "please input one key for install :" install_number
		fi
			
	fi    
  	
	case ${install_number} in
		0)
			info_log "exit intalll."
			exit
		;;
		1)
			source ${INSTALL_PATH}/scripts/prepare_system.sh
			prepare_system
			echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/no_auto_install.tag
			iaas_install_menu		
		;;
		2)
			source ${INSTALL_PATH}/scripts/install_keystone.sh
			install_keystone
			iaas_install_menu
		;;
		3)
			source ${INSTALL_PATH}/scripts/install_glance.sh
			install_glance
			iaas_install_menu
		;;
		4)
			source ${INSTALL_PATH}/scripts/install_nova_controller.sh
			install_nova_controller
			iaas_install_menu
		;;
		5)
			source ${INSTALL_PATH}/scripts/install_cinder.sh
			install_cinder
			iaas_install_menu
		;;
		6)
			source ${INSTALL_PATH}/scripts/install_neutron.sh
			install_neutron
			iaas_install_menu
		;;
		7)
			source ${INSTALL_PATH}/scripts/install_ceilometer.sh
			install_ceilometer
			iaas_install_menu
		;;
		8)
			source ${INSTALL_PATH}/scripts/install_dashboard.sh
			install_dashboard
			iaas_install_menu
		;;
		9)
			source ${INSTALL_PATH}/scripts/install_ecloud.sh
			install_ecloud
			iaas_install_menu
		;;
		a)
			
			source ${INSTALL_PATH}/scripts/prepare_system.sh
			source ${INSTALL_PATH}/scripts/install_keystone.sh
			source ${INSTALL_PATH}/scripts/install_glance.sh
			source ${INSTALL_PATH}/scripts/install_nova_controller.sh
			source ${INSTALL_PATH}/scripts/install_cinder.sh
			source ${INSTALL_PATH}/scripts/install_neutron.sh
			source ${INSTALL_PATH}/scripts/install_ceilometer.sh
			source ${INSTALL_PATH}/scripts/install_dashboard.sh
			source ${INSTALL_PATH}/scripts/install_ecloud.sh

			prepare_system
			echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/auto_install.tag
			install_keystone
			install_glance
			install_nova_controller
			install_cinder
			install_neutron
			install_ceilometer
			install_dashboard
			install_ecloud
	        reboot_os
			
			iaas_install_menu
		;;
		*)
			warn_info "Input error,Please input again"
			iaas_install_menu
		;;	
	esac
}

