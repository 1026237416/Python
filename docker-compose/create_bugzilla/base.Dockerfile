FROM centos:7.5.1804

MAINTAINER liping qianyeliange@163.com

RUN yum install -y deltarpm epel-release mod_ssl mod_ssl mod_perl \
    mod_perl-devel gcc gcc-c++ make kernel-devel mariadb-server   \
    mariadb mariadb-devel php-mysql perl-CPAN perl-devel \
    perl-ExtUtils-Embed patchutils

