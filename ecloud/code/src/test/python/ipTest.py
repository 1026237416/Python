import netaddr

if __name__ == '__main__':
    cidr_ip_range = tuple(netaddr.IPNetwork("192.0.0.64/25"))
    print cidr_ip_range
    print netaddr.iprange_to_cidrs(cidr_ip_range[0],cidr_ip_range[-1])

    print "############"
    print int(netaddr.IPAddress("10.0.255.0"))
    print int(netaddr.IPAddress("10.0.254.0"))
    print int(netaddr.IPAddress("10.10.199.255"))
    print int(netaddr.IPAddress("10.10.200.0"))

    # print cidr_ip_range
