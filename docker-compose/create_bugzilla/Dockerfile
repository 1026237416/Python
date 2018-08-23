FROM bugzilla_base:0.1

MAINTAINER liping qianyeliange@163.com

ADD 'https://ftp.mozilla.org/pub/mozilla.org/webtools/bugzilla-5.0.tar.gz' /var/www/html

RUN tar xzvf /var/www/html/bugzilla-5.0.tar.gz -C /var/www/html && rm -rf /var/www/html/bugzilla-5.0.tar.gz

RUN mv /var/www/html/bugzilla-5.0 /var/www/html/bugzilla

WORKDIR /var/www/html/bugzilla

RUN /usr/bin/perl install-module.pl --all

ADD init_bugzilla.sh /var/www/html/bugzilla

ADD bugzilla.conf /etc/httpd/conf.d

ENTRYPOINT ["/var/www/html/bugzilla/init_bugzilla.sh", "/run-httpd.sh"]