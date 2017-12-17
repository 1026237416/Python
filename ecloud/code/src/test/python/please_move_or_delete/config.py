# -*-coding:utf-8-*-
__author__ = 'tao'

# config.py
# Author: D. Wang

from oslo_config import cfg
# ����������ģʽ
# ����������ģʽ
enabled_apis_opt = cfg.ListOpt('enabled_apis',
                               default=['ec2', 'osapi_compute'],
                               help='List of APIs to enable by default.')
# ������������һ��ģʽ
common_opts = [
    cfg.StrOpt('bind_host',
               default='0.0.0.0',
               help='IP address to listen on.'),

    cfg.IntOpt('bind_port',
               default=9292,
               help='Port number to listen on.')
]
# ������
rabbit_group = cfg.OptGroup(
    name='rabbit',
    title='RabbitMQ options'
)
# �������е�ģʽ��ͨ��������������Ϊǰ׺���Ǳ��룩
rabbit_ssl_opt = cfg.BoolOpt('use_ssl',
                             default=False,
                             help='use ssl for connection')
# �������еĶ�������ģʽ
rabbit_Opts = [
    cfg.StrOpt('host',
               default='localhost',
               help='IP/hostname to listen on.'),
    cfg.IntOpt('port',
               default=5672,
               help='Port number to listen on.')
]

# ��������CONF�������䵱����
CONF = cfg.CONF
# ע�ᵥ��������ģʽ
CONF.register_opt(enabled_apis_opt)

# ע�Ậ�ж���������ģʽ
CONF.register_opts(common_opts)

# ������������������ע��ǰע�ᣡ
CONF.register_group(rabbit_group)

# ע���������к��ж���������ģʽ������ָ��������
CONF.register_opts(rabbit_Opts, rabbit_group)

# ע���������еĵ�������ģʽ��ָ��������
CONF.register_opt(rabbit_ssl_opt, rabbit_group)

# ��������ӡʹ���������ֵ
if __name__ =="__main__":
# ����CONF(default_config_files=['my.conf'])
    CONF(default_config_files=['my.conf'])
    # for i in CONF.enabled_apis:
    #      print ("DEFAULT.enabled_apis: " + i)
    print("DEFAULT.bind_host: " + CONF.bind_host)
    print ("DEFAULT.bind_port: " + str(CONF.bind_port))
    print("rabbit.use_ssl: "+ str(CONF.rabbit.use_ssl))
    print("rabbit.host: " + CONF.rabbit.host)
    print("rabbit.port: " + str(CONF.rabbit.port))
