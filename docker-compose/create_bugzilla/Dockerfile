FROM centos:7.5.1804

MAINTAINER liping qianyeliange@163.com

RUN yum install -y deltarpm epel-release mod_ssl mod_ssl mod_perl \
    mod_perl-devel gcc gcc-c++ make kernel-devel mariadb-server   \
    mariadb mariadb-devel php-mysql perl-CPAN perl-devel \
    perl-ExtUtils-Embed patchutils

ADD 'https://ftp.mozilla.org/pub/mozilla.org/webtools/bugzilla-5.0.tar.gz' /var/www/html

RUN tar xzvf /var/www/html/bugzilla-5.0.tar.gz -C /var/www/html/bugzilla-5.0 && \
    mv /var/www/html/bugzilla-5.0 /var/www/html/bugzilla  && \
    cd /var/www/html/bugzilla && \
    ./checksetup.pl  && /usr/bin/perl install-module.pl --all && ./checksetup.pl

ENTRYPOINT ["/usr/sbin/init", "systemctl start httpd.service"]