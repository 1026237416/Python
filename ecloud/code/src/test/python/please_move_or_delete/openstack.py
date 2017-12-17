# -*- coding: utf-8 -*-
__author__ = 'litao@easted.com.cn'


import novaclient.v2.client as nova_client
_nova = nova_client.Client(username="admin", tenant_id="2736a00fa13f44bda3b92a32933d20e9", api_key="password",
                           region_name="Region_26_021919", auth_url="http://10.10.3.26:5000/v2.0")

nics = []
nics.append({
    "net-id": '4cead2fb-ce5b-44f6-9a46-2b4dac733aba',
    "v4-fixed-ip": '192.168.52.4'
})

device_name = "vda"
volume_choice = "%s:vol" % '9f827924-1778-4fb1-bc95-f99a7052e127'
block_device_mapping = {device_name: "%s::1" % volume_choice}

_nova.servers.create(name="vm-litao22", image="",
                     flavor='60c28ed2-3781-4ea6-b77d-906f3f77cfed',
                     block_device_mapping=block_device_mapping,
                     nics=nics,
                     disk_config='AUTO', admin_pass="password",
                     availability_zone="nova:node1:node1")