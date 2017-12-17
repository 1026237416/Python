# -*- coding: utf-8 -*-
__author__ = 'litao@easted.com.cn'
import novaclient.v2.client as nova_client

_nova = nova_client.Client(username="admin", tenant_id="d420f31d877848db8dd017e5123e6845", api_key="password",
                           region_name="Region_56_0419114531", auth_url="http://10.10.130.56:5000/v2.0")

nics = [{"port-id": "1"}, {"port-id": "2"}]

nics = [{"net-id": "59589e7b-b925-41a4-80f6-cefc9e9d7c04", "v4-fixed-ip": "10.10.113.2"},{"net-id": "59589e7b-b925-41a4-80f6-cefc9e9d7c04", "v4-fixed-ip": "10.10.113.3"}]


_nova.servers.create(name="litao2", flavor=1, image="01c09e24-0381-4bba-879c-2118a27290a8", min_count=2, nics=nics)


_nova.hypervisors.list()