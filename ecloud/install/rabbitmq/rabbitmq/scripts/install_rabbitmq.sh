#!/usr/bin/env bash

function install_rabbitmq ()
{
	check_install_rabbitmq_tag
	prepare_rabbitmq_system
	install_rabbitmq_server
	setting_rabbitmq_server
	write_install_rabbitmq_tag
}


function check_install_rabbitmq_tag()
{
	if [ -f  ${install_tag_path}/install_rabbitmq.tag ]
    then
        echo -e "\033[41;37mThe prepare system operation has been performed.\033[0m"
        info_log "The prepare system operation has been performed."
        exit 1
    else
        normal_info "#######################################################################################"
        normal_info "###                       Start install RabbitMQ-server                             ###"
        normal_info "#######################################################################################"

        if  [ ! -d ${install_tag_path} ]
        then
            mkdir -p ${install_tag_path}
        fi
    fi
}


function install_rabbitmq_server()
{
	yum -y install rabbitmq-server
	check_command "Install rabbitmq-server"
}

function setting_rabbitmq_server()
{
	iptables -I INPUT -p udp --dport 1883  -j ACCEPT
	iptables -I INPUT -p tcp --dport 1883  -j ACCEPT
	iptables -I INPUT -p udp --dport 4369  -j ACCEPT
	iptables -I INPUT -p tcp --dport 4369  -j ACCEPT
	iptables -I INPUT -p udp --dport 5671  -j ACCEPT
	iptables -I INPUT -p tcp --dport 5671  -j ACCEPT
	iptables -I INPUT -p udp --dport 5672  -j ACCEPT
	iptables -I INPUT -p tcp --dport 5672  -j ACCEPT
	iptables -I INPUT -p udp --dport 8883  -j ACCEPT
	iptables -I INPUT -p tcp --dport 8883  -j ACCEPT
	iptables -I INPUT -p udp --dport 15672 -j ACCEPT
	iptables -I INPUT -p tcp --dport 15672 -j ACCEPT
	iptables -I INPUT -p udp --dport 25672 -j ACCEPT
	iptables -I INPUT -p tcp --dport 25672 -j ACCEPT
	iptables -I INPUT -p udp --dport 61613 -j ACCEPT
	iptables -I INPUT -p tcp --dport 61613 -j ACCEPT
	iptables -I INPUT -p udp --dport 61614 -j ACCEPT
	iptables -I INPUT -p tcp --dport 61614 -j ACCEPT
	iptables-save > /etc/sysconfig/iptables
	
	firewall-cmd --zone=public --add-port=1883/tcp  --permanent  1>/dev/null 2>&1 
	firewall-cmd --zone=public --add-port=4369/tcp  --permanent  1>/dev/null 2>&1 
	firewall-cmd --zone=public --add-port=5671/tcp  --permanent  1>/dev/null 2>&1 
	firewall-cmd --zone=public --add-port=5672/tcp  --permanent  1>/dev/null 2>&1 
	firewall-cmd --zone=public --add-port=8883/tcp  --permanent  1>/dev/null 2>&1 
	firewall-cmd --zone=public --add-port=15672/tcp --permanent  1>/dev/null 2>&1 
	firewall-cmd --zone=public --add-port=25672/tcp --permanent  1>/dev/null 2>&1 
	firewall-cmd --zone=public --add-port=61613/tcp --permanent  1>/dev/null 2>&1 
	firewall-cmd --zone=public --add-port=61614/tcp --permanent  1>/dev/null 2>&1 
	
	systemctl restart firewalld.service
#
#	systemctl enable rabbitmq-server.service
#	check_command "Enable rabbitmq-server start on boot"
#	systemctl start rabbitmq-server.service
#	check_command "Start rabbitmq-server"

    rm -rf /usr/lib/rabbitmq/lib/rabbitmq_server-3.3.5/sbin/rabbitmq-server
    rm -rf /usr/lib/rabbitmq/bin/rabbitmq-server

    cp ${INSTALL_PATH}/etc/rabbitmq-server /usr/lib/rabbitmq/lib/rabbitmq_server-3.3.5/sbin/rabbitmq-server
    ln -s /usr/lib/rabbitmq/lib/rabbitmq_server-3.3.5/sbin/rabbitmq-server /usr/lib/rabbitmq/bin/rabbitmq-server
    chmod 755 /usr/lib/rabbitmq/lib/rabbitmq_server-3.3.5/sbin/rabbitmq-server

    echo "ulimit -n 65535" >> /etc/rc.d/rc.local
    echo "rabbitmq-server&" >> /etc/rc.d/rc.local

    chmod +x /etc/rc.d/rc.local                         1>/dev/null 2>&1
	systemctl enable rc-local.service                   1>/dev/null 2>&1

    ulimit -n 65535
    rabbitmq-server&
#    echo ""
    sleep 10

	rabbitmqctl set_user_tags guest administrator
	rabbitmqctl set_permissions -p / guest ".*" ".*" ".*"
	check_command "Setting rabbitmq-server access Permissions"
}

function write_install_rabbitmq_tag ()
{
    normal_info "#######################################################################################"
    normal_info "###                         Install RabbitMQ-server Successful                      ###"
    normal_info "#######################################################################################"
	echo `date "+%Y-%m-%d %H:%M:%S"` >${install_tag_path}/install_rabbitmq.tag
}