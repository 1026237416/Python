# -*- coding: utf-8 -*-
import netaddr

a = ["10.10.199.1", "10.10.199.3", "10.10.199.4", "10.10.199.6", "10.10.199.7", "10.10.199.8", "10.10.199.10"]


def test(a):
    result = []
    ip_pool = {
        "start": a[0],
        "end": a[0]
    }
    result.append(ip_pool)
    for i in range(1, len(a)):
        if int(netaddr.IPAddress(a[i])) - int(netaddr.IPAddress(ip_pool["end"])) == 1:
            ip_pool["end"] = a[i]
        else:
            ip_pool = {
                "start": a[i],
                "end": a[i]
            }
            result.append(ip_pool)
    return result


print test(a)

"""
期望的输出结果
[
 {
   "start":"",
   "end":""
 }
]
"""


print int(netaddr.IPAddress("10.10.199.4"))


print netaddr.IPAddress(168478468)



