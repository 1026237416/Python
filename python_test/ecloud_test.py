from oslo_config import cfg  
from oslo_config import types

PortType = types.Integer(1, 65535)
common_opts = [
    cfg.StrOpt('bind_host',
               default = '0.0.0.0',
               help = 'IP address to listen on.'  ),
    cfg.Opt('bind_port',
            type=PortType,
            default=9292,
            help='Port number to listen on.')                          
]

def add_common_opts(conf):
    conf.register_opts(common_opts)
    
def get_bind_host(conf):
    return conf.bind_host

def get_bind_port(conf):
    return conf.bind_port

cf = cfg.CONF

add_common_opts(cf)
print(get_bind_host(cf))
