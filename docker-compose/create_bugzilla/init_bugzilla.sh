#!/usr/bin/env bash

echo MYSQL_HOST:${MYSQL_HOST}
echo MYSQL_ROOT_PWD:${MYSQL_ROOT_PWD}
echo MYSQL_USER:${MYSQL_USER}
echo MYSQL_PWD:${MYSQL_PWD}
echo MYSQL_PORT:${MYSQL_PORT}

if [ -n "${MYSQL_HOST}" ];then
    sed -i "s/localhost/${MYSQL_HOST}/" /var/www/html/bugzilla/localconfig
fi

if [ -n "${MYSQL_USER}" ];then
    sed -i "s/db_user = 'bugs'/db_user = '${MYSQL_USER}'/" /var/www/html/bugzilla/localconfig
fi

if [ -n "${MYSQL_PWD}" ];then
    sed -i "s/db_pass = ''/db_pass = '${MYSQL_PWD}'/" /var/www/html/bugzilla/localconfig
fi

if [ -n "${MYSQL_PORT}" ];then
    sed -i "s/db_port = ''/db_port = '${MYSQL_PORT}'/" /var/www/html/bugzilla/localconfig
fi

mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -uroot -p${MYSQL_ROOT_PWD} -e "create database bugs;"
mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -uroot -p${MYSQL_ROOT_PWD} -e "GRANT ALL PRIVILEGES ON *.* TO 'bugs'@'%' IDENTIFIED BY 'password' WITH GRANT OPTION;"
mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -uroot -p${MYSQL_ROOT_PWD} -e "GRANT ALL PRIVILEGES ON *.* TO 'bugs'@'localhost' IDENTIFIED BY 'password' WITH GRANT OPTION;"


/var/www/html/bugzilla/checksetup.pl <<EOF
${ADMINISTRATOR_EMAIL}
${ADMINISTRATOR_NAME}
${ADMINISTRATOR_PWD}
${ADMINISTRATOR_PWD}
EOF

sed -i 's/^Options -Indexes$/#Options -Indexes/g' /var/www/html/bugzilla/.htaccess

