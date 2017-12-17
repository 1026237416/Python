# -*- coding: utf-8 -*-
__author__ = 'yangkefeng@easted.com.cn'

DEFAULT_SECURITY_GROUP = "default"
DIRECTION_IN, DIRECTION_OUT = "ingress", "egress"
PROTOCOL_TCP = "TCP"
PROTOCOL_PORT_DICT = {"DNS": 53, "HTTP": 80, "HTTPS": 8443,
                      "IMAP": 143, "IMAPS": 993, "LDAP": 389,
                      "MS SQL": 1433, "MYSQL": 3306, "POP3": 110,
                      "POP3S": 995, "RDP": 3389, "SMTP": 25,
                      "SMTPS": 465, "SSH": 22, None: None}

ALL_PROTOCOLS = {"ALL TCP": "TCP", "ALL UDP": "UDP", "ALL ICMP": "ICMP"}
ALL_ICMP = "ICMP"
SG_SUPPORTED_PROTOCOLS = tuple(set([None, "TCP", "UDP", "ICMP", "ICMPV6"] +
                                   PROTOCOL_PORT_DICT.keys() +
                                   ALL_PROTOCOLS.keys()))
REVERSE_PROTOCOL_PORT_DICT = {v: k for k, v in PROTOCOL_PORT_DICT.iteritems()}
DEFAULT_SECURITY_RULES = [
    {
            "direction": "egress",
            "from_port": None,
            "protocol": None,
            "to_port": None,
            "cidr": "0.0.0.0/0",
            "ethertype": "IPv4"
    },
    {
            "direction": "egress",
            "from_port": None,
            "protocol": None,
            "to_port": None,
            "cidr": None,
            "ethertype": "IPv4"
    },
    {
            "direction": "ingress",
            "from_port": None,
            "protocol": None,
            "to_port": None,
            "cidr": "0.0.0.0/0",
            "ethertype": "IPv4"
    },
    {
            "direction": "ingress",
            "from_port": None,
            "protocol": None,
            "to_port": None,
            "cidr": None,
            "ethertype": "IPv4"
    }
]
