/**
 * api的配置文件在此处
 * */
define("api.config", function () {
    return [
        //心跳消息
        {
           "name":"app.idle",
            "url":"/idle",
            "proxy":"app.idle.json"
        },
        //服务列表模块
        {
            "name":"service.list",
            "url":"/services",
            "proxy":"data/service_list.json"
        },
        {
            "name":"service.status",
            "url":"/status",
            "proxy":"data/service.status.json"
        },
        //云主机模块
        {
            "name":"cal.host.getConfig",//新建云主机第二个页面关于cpu和内存的api名称
            "url":"/hyhyhyhy",
            "proxy":"data/cal.host.create.config.json"
        },
        {
            "name": "cal.host.getHostlist",//请求api名称
            "url": "/vm",//要请求的api真实地址
            "proxy": "data/datagrid_hostlist.json"//本地数据地址
        },
        {
            "name":"cal.host/detail",
            "url":"/vm/undefined",//本地测试详情
            "proxy":"data/host_detail.json"
        },
        {
            "name": "hostList",//请求api名称
            "url": "/vms",//要请求的api真实地址
            "proxy": "data/datagrid_hostlist.json"//本地数据地址
        },
        {
            "name": "cal.host.combobox.username",
            "url": "cal.host.combobox.username",
            "proxy": "data/mash.json"
        },
        {
            "name": "cal.host.combobox.project",
            "url": "cal.host.combobox.project",
            "proxy": "data/datagrid_tenantlist.json"
        },
        {
            "name": "cal.disk.combobox.status",
            "url": "cal.disk.combobox.status",
            "proxy": "data/diskstatus.json"
        },
        {
            "name": "cal.host.combobox.status",
            "url": "cal.host.combobox.status",
            "proxy": "data/hoststatus.json"
        },
        {

            "name": "cal.host.combobox.allocation",//分配策略
            "url": "cal.host.combobox.allocation",
            "proxy": "data/host_allocationstrategy.json"
        },
        {
            "name": "cal.host.datagrid_disklist",//云主机列表
            "url": "cal.host.datagridlist",
            "proxy": "data/datagrid_disklist.json"
        },
        {
            "name": "cal.host.hostDetail.hostdetailwarn",//云主机详情-告警
            "url": "hostDetail.hostdetailwarn",
            "proxy": "data/datagrid_hostdetailwarn.json"
        },
        {
            "name": "cal.host.hostDetail.hostdetaillog",//云主机详情-操作日志
            "url": "hostDetail.hostdetaillog",
            "proxy": "data/datagrid_hostdetaillog.json"
        },
        {
            "name":"cal.host.allotuser",//云主机列表-分配用户
            "url":"/vm/user",
            "proxy":"data/cal.host_allotuser"
        },
        {
            "name":"cal.host.migrate",
            "url":"/hosts",
            "proxy":"data/datagrid_migrate.json"
        },
        {
            "name":"cal.host.migrateok",
            "url":"/vm",
            "proxy":"data/migrate.ok.json"
        },
        {
            "name": "log.getLoglist",//日志列表
            "url": "/log",
            "proxy": "data/datagrid_log.json"
        },
        {
            "name": "log.combobox.action",
            "url": "log.combobox.action",
            "proxy": {
                "name1": "data/log_vm.json",
                "name2": "data/log_disk.json",
                "name3": "data/log_user.json",
                "name4": "data/log_tenant.json",
                "name5": "data/log_network.json",
                "name6": "data/log_order.json",
                "name7": "data/log_host.json",
                "name8": "data/log_security_group.json",
                "name9": "data/log_global_settings.json",
                "name10":"data/log_strategy.json",
                "name11":"data/log_image.json",
                "name12":"data/log_kind.json",//_proxyKey
                "name13":"data/log_backup.json",
                "name14":"data/log_template.json",
                "name15":"data/log_instance.json",
                "name16":"data/log_alarm.json"
            }
        },
        {
            "name": "log.combobox.user",
            "url": "log.combobox.user",
            "proxy": {
                "name1": "data/log_all_user_sys.json",
                "name2": "data/log_all_user_sec.json",
                "name3": "data/log_all_user_audit.json"
            }
        },
        {
            "name": "log.combobox.opt",
            "url":   "log.combobox.opt",
            "proxy": "data/mash.json"
        },
        {
            "name": "log.combobox.sel",
            "url":   "log.combobox.sel",
            "proxy": "data/log_kind.json"
        },
        {
            "name": "setting.user.combobox.username",
            "url": "setting.user.combobox.username",
            "proxy": "data/mash.json"
        },
        {
            "name": "setting.user.combobox.project",
            "url": "setting.user.combobox.project",
            "proxy": "data/datagrid_tenantlist.json"
        },
        {
            "name":"getUser",
            "url":"/user",
            "proxy":"data/getUserById.json"
        },
        {
            "name": "setting.user.datagrid_users",
            "url": "/users",
            "proxy": "data/datagrid_userlist.json"
        },
        {
            "name": "setting.user.userlist",
            "url": "/user",
            "proxy": "data/datagrid_userlist.json"
        },
        //新建云主机的vlan
        {
            "name":"network.vlan.datagrid_vlan",
            "url":"/networks",
            "proxy":"data/datagrid_valnlist.json"
        },
        {
            "name":"network.vlan.datagrid_vlan_child",
            "url":"/subnets",
            "proxy":"data/datagrid_valnlist.json"
        },
        {
            "name":"network.host.datagrid_host",
            "url":"/phynetworks",
            "proxy":"data/datagrid_hostlist.json"
        },
        {
            "name":"network.vlan.addVlan.IP",
            "url":"network.vlan.addVlan.IP",
            "proxy":"data/ip_new.json"
        },
        {
            "name":"network.vlan.addVlan.host",
            "url":"/hosts",
            "proxy":"data/datagrid_vlanhostlist.json"
        },
        {
            "name":"hostslave.storage",
            "url":"/hosts",
            "proxy":"data/hostslave_storage.json"
        },
        {
            "name":"hostalaveDetail",
            "url":"/host",
            "proxy":"data/datagrid_vlanhostlist.json"
        },
        {
            "name":"network.vlan.addvlanDetail.host",
            "url":"network.vlan.addvlanDetail.host",
            "proxy":"data/hostlist.json"
        },
        {
            "name":"network.vlan.vlanDetail.IP",
            "url":"network.vlan.vlanDetail.IP",
            "proxy":"data/ip_range.json"
        },
        {
            "name":"network.vlan.vlanDetail.host",
            "url":"network.vlan.vlanDetail.host",
            "proxy":"data/datagrid_vlandetailhost.json"
        },
        //新建云主机项目列表 todo
        {
            "name":"setting.project.datagrid_tenants",
            "url":"/tenants",
            "proxy":"data/datagrid_tenantlist.json"
        },
        //新建云主机项目详情列表----- todo
        {
            "name":"setting.project.datagrid_host",
            "url":"/tenant",
            "proxy":"data/setting.mytest.json"
        },
        //新建云主机项目的用户 todo /tenant/{tenant_id}/users
        {
            "name":"setting.project.datagrid_project",
            "url":"/tenant",
            "proxy":"data/datagrid_tenantlist.json"
        },
        {
            "name":"setting.project.addtenanteDetail.table",
            "url":"setting.project.addtenanteDetail.table",
            "proxy":"data/datagrid_tenantuserlist.json"
        },
        {
            "name":"setting.project.tenanteDetail.table",
            "url":"/topo/vlan/relation",
            "proxy":"data/topo.json"
        },
        {
            "name":"order.wait.sec.user.select",
            "url":"/user",
            "proxy":"data/order.wait.Detail.user.json"
        },
        {
            "name":"login",
            "url":"/login",
            "proxy":"data/role.json"
        },
        {
            "name":"order.wait.datagrid_list",
            "url":"/workorders",
            "proxy":"data/datagrid_order.wait.json"
        },
        {
            "name":"order",
            "url":"/workorder",
            "proxy":"data/datagrid_order.wait.json"
        },
        {
            "name":"order.wait.Detail.combo.datacenter",
           "url":"/region",
           // "url":"order.wait.Detail.combo.datacenter",
            "proxy":"data/order.wait.Detail.datacenter.json"
        },
        //新建云主机镜像列表 todo /images?region=''&os=''&status='online'
        {
            "name":"order.wait.Detail.combo.image",
            "url":"/images",
            "proxy":"data/order.wait.Detail.image.json"
        },
        {
            "name":"order.wait.Detail.combo.project",
            "url":"/tenant",
            "proxy":"data/order.wait.Detail.project.json"
        },
        //新建云主机选择网络下的宿主机 todo thomas
        {
            "name":"order.wait.Detail.combo.vlan",
            "url":"/network",
            "proxy":"data/order.wait.Detail.VLAN.json"
        },
        //新建云主机选择网络下的宿主机new todo thomas
        {
            "name":"cal.host.create.network.svm",
            "url":"/hosts/available",
            "proxy":"data/cal.host.create.network.svm.json"
        },
        //选择网络下的ip 废弃
        {
            "name":"order.wait.Detail.combo.ip.xx",
            "url":"/network",
            "proxy":"data/order.wait.Detail.IP.json"
        },
        {
            "name":"order.wait.Detail.combo.ip",
            "url":"/subnet",
            "proxy":"data/order.wait.Detail.IP.json"
        },
        {
            "name":"order.wait.Detail.host.ip",
            "url":"/hosts",
            "proxy":"data/order.wait.Detail.host.json"
        },
        {
            "name":"order.wait.Detail.save.ip",
            "url":"/volume_types",
            "proxy":"data/order.wait.Detail.save.json"
        },
        {
            "name":"order.type.search",//工单类型搜索
            "url":"data/order.wait.search.type.json",
            "proxy":"data/order.wait.search.type.json"
        },
        {
            "name":"order.state.search",//工单状态搜索
            "url":"data/order.search.status.json",
            "proxy":"data/order.search.status.json"
        },
        {//设置项目下的vlan
            "name":"setting.project.vlan",
            "url":"/network/tenant",///{tenant_id}/vlan
            "proxy":"data/setting.project.vlan"
        },
        {//设置项目下的ip
            "name":"setting.project.ip",
            "url":"/network",//{network_id}/tenant/{tenant_id}/ips
            "proxy":"data/setting.project.vlan"
        },
        {//登出
            "name":"logout",
            "url":"/logout",
            "proxy":"getlog.json"
        },
        {//vnc
            "name":"getvnc",
            "url":"/vm",//vm/{vm_id}/vnc
            "proxy":"getvnc.json"
        },
        //镜像列表 todo thomas
        {
            "name":"image",
            "url":"/images",
            "proxy":"image.json"
        },
        {
            "name":"imageOperate",
            "url":"/image",
            "proxy":"image.json"
        },
        {//修改密码
            "name":"modify.password",
            "url":"/user",//user/{uid}/password
            "proxy":"modifyProxy.json"
        },
        {//修改自己密码
            "name":"modify.password.self",
            "url":"/password",
            "proxy":"modifyProxy.json"
        },
        {
            "name":"cal.disk",
            "url":"/volume",
            "proxy":""
        },
        {
            "name":"cal.disk.mount",
            "url":"/vm/volume/attach",
            "proxy":"data/volume.attach"
        },
        {
            "name":"cal.disk.user",
            "url":"/volume_user",
            "proxy":"data/datagrid_disklist.json"
        },
        {
            "name":"cal.disk.datagrid",
            "url":"/volumes",
            "proxy":"data/datagrid_disklist.json"
        },
        {
            "name":"Monitoring",
            "url":"/meters"
        },
        {//安全组
            "name":"cal.security.group",
            "url":"/security_groups",
            "proxy":"data/cal_security_group.json"
        },
        {//安全组新s
            "name":"cal.security.group.list",
            "url":"/security/rules",
            "proxy":"data/cal.security.group.list.json"
        },
        {//新建安全组
            "name":"security.group.create",
            "url":"/security_group/rule",
            "proxy":"data/cal_security_group.json"
        },
        {//新建全局安全组规则
            "name":"security.group.create.global",
            "url":"/security/rule",
            "proxy":""
        },
        {//删除安全组
            "name":"security.project.control.rule",
            "url":"/security",
            "proxy":"data/cal_security_group.json"
        },
        {//全局参数列表
            "name":"global.param",
            "url":"/settings",
            "proxy":"data/global.param.json"
        },
        {//修改单个全局参数
            "name":"global.param.set",
            "url":"/setting",
            "proxy":"data/global.param.json"
        },
        {//获取卷类型
            "name":"volumn.type",
            "url":"/volume_types",
            "proxy":"volumn.type.json"
        },
        {//日志
            "name":"dashboard.log",
            "url":"/log",
            "proxy":"data/log.json"
        },
        {//监控
            "name":"monitor",
            "url":"/meters",
            "proxy":"data/monitor.json"
        },
        {//Dashbaord统计
            "name":"dashbarod.statistic",
            "url":"/statistic",
            "proxy":"data/statistic.json"
        },
        {//Dashbaord统计
            "name":"alarm",
            "url":"/alarms",
            "proxy":"data/statistic.json"
        },
        {//Dashbaord统计
            "name":"alarmAction",
            "url":"/alarm",
            "proxy":"data/statistic.json"
        },
        {//备份列表
            "name":"backup.list",
            "url":"/snapshots",
            "proxy":"data/datagrid_backupdisk.json"
        },
        {//备份详情页里的备份列表
            "name":"backup.list.name",
            "url":"/snapshots",
            "proxy":"data/datagrid_backupvms.json"
        },
        {//备份详情页里的备份编辑
            "name":"backup.edit",
            "url":"/snapshot",
            "proxy":"data/datagrid_backupvms.json"
        },
        {//备份列表之云主机
            "name":"backup_vm.list",
            "url":"/snapshots/summary",
            "proxy":"data/datagrid_backupvm.json"
        },
        {
            "name":"backup_operate",
            "url":"/snapshot",
            "proxy":"data/datagrid_backupvm.json"
        },
        {//创建备份
            "name":"backupCreating",
            "url":"/snapshot",
            "proxy":"data/datagrid_backupdisk.json"
        },
        {//系统信息
        "name":"sysInfo",
        "url":"/license",
        "proxy":"assets/copyright.json"
        },
        //可用宿主机
        {
            "name":"available_hosts",
            "url":"available_hosts",
            "proxy":""
        },
        //在回收站中显示云主机
        {
            "name":"listVMInRecycle",
            "url":"/recycle/vms",
            "proxy":"data/datagrid_recycle.json"
        },
        //在回收站中删除云主机
        {
            "name":"deleteVMInRecycle",
            "url":"/recycle/vms?vms=uuid1,uuid2",
            "proxy":""
        },
        //清空回收站云主机
        {
            "name":"emptyVMInRecycle",
            "url":"/recycle/vm/empty",
            "proxy":""
        },
        //恢复回收站中的云主机
        {
            "name":"recoveryVMInRecycle",
            "url":"/recycle/vm/{vm_id}/restore",
            "proxy":""
        },
        //在回收站中显示云硬盘
        {
            "name":"listDiskInRecycle",
            "url":"/recycle/volumes",
            "proxy":"data/datagrid_recycle_disk.json"
        },
        //在回收站中恢复云硬盘
        {
            "name":"recoveryDiskInRecycle",
            "url":"/recycle/volumes",
            "proxy":"data/datagrid_recycle_disk.json"
        },
        //在回收站中清空云硬盘
        {
            "name":"emptyDiskInRecycle",
            "url":"/recycle/volumes/empty",
            "proxy":"data/datagrid_recycle_disk.json"
        },
        //在回收站中删除云硬盘
        {
            "name":"deleteDiskInRecycle",
            "url":"/recycle/volumes",
            "proxy":"data/datagrid_recycle_disk.json"
        },
        //更新模版
        {
            "name":"manorTemplateDetail",
            "url":"/manor/templates",
            "proxy":"data/manor.template.update.json"
        },
        //应用模板
        {
            "name":"manorTemplate",
            "url":"manor",
            "proxy":"data/manor.template.json"
        },
        //应用实例列表
        {
            "name":"manorInstance",
            "url":"/manor/instances",
            "proxy":"data/manor_list.json"
        },
        // 在列表中删除数据 todo /manor/app/{app serial}
        {
            "name":"deleteInstance",
            "url":"/manor/app/"
        },
        // 创建实例 todo /manor/templates/execute/{templates name}下拉框中选择的name值
        //          todo /{action name}action中的type为deploy的name值
        {
            "name":"createInstance",
            "url":"/manor/templates/execute/"
        },
        //创建实例项目列表
        {
            "name":"manorProList",
            "url":"/tenants",
            "proxy":"data/manor_pro_list.json"
        },
        //创建实例网络列表 todo ?region={region}&tenant={tenant_id}&name={name}
        {
            "name":"manorVlanList",
            "url":"/network",
            "proxy":"data/manor_vlan_list.json"
        },
        {
            "name":"subnet.delete.port",
            "url":"/vm/nic"
        },
        //创建实例模板列表
        {
            "name":"manorTempList",
            "url":"/manor/templates",
            "proxy":"data/manor_temp_list.json"
        },
        //创建实例镜像
        {
            "name":"manorImage",
            "url":"/images",
            "proxy":"data/manor_image_list.json"
        },
        //实例详情node节点信息 todo /manor/app/resources/app serial
        {
            "name":"manorNodeDetail",
            "url":"/manor/app/resources/",
            "proxy":"data/manor_node_detail.json"
        },
        //实例详情模板 todo /manor/app/templates/app serial
        {
            "name":"manorTempDetail",
            "url":"/manor/app/templates/",
            "proxy":"data/manor_temp_detail.json"
        },
        {
            "name":"manorIcon",
            "url":"/manor/manorIcon",
            "proxy":"data/manor_icon.json"

        },
        {
            "name":"manor.instance.list",//实例列表
            "url":"/manor/instances",
            "proxy":"data/manor_instance_list.json"
        },
        {
            "name":"manor.instance",//单个实例
            "url":"/manor/app/",
            "proxy":"manor.instance.json"
        },
        {
            "name":"manor.instance.source",//获取单个实例下的资源
            "url":"/manor/app/resources/",
            "proxy":"manor.instance.source.json"

        },
        { //socket获取应用状态
            "name":"manor.instance.state",
            "url":"/manor/socket/app/status",
            "proxy":"manor.socket.state.json"
        },
        {//socket获取脚本执行结果
            "name":"manor.instance.execute.socket",
            "url":"/manor/socket/app/message",
            "proxy":"manor.instance.execute.json"
        },
        { //首页cards info
            "name":"dashboard.cards.info",
            "url":"/socket/dashboard",
            "proxy":""
        },
        { //云主机详情页 socket
            "name":"cal.host.detail.socket",
            "url":"/socket/compute/detail",
            "proxy":""
        },
        { //宿主机 socket
            "name":"cal.slave.socket",
            "url":"/socket/host",
            "proxy":""
        },
        { //宿主机详情页 socket
            "name":"cal.slave.detail.socket",
            "url":"/socket/host/detail",
            "proxy":""
        },
        { //云主机列表 socket
            "name":"cal.host.list.socket",
            "url":"/socket/compute",
            "proxy":""
        },
        { //云硬盘列表 socket
            "name":"cal.disk.list.socket",
            "url":"/socket/volume",
            "proxy":""
        },
        { //快照详情 socket
            "name":"cal.backup.detail.socket",
            "url":"/socket/snapshot",
            "proxy":""
        },
        { //镜像列表 socket
            "name":"cal.image.list.socket",
            "url":"/socket/image",
            "proxy":""
        },
        { //网络列表 socket
            "name":"network.vlan.socket",
            "url":"/socket/network",
            "proxy":""
        },
        { //网络详情 socket
            "name":"network.detail.socket",
            "url":"/socket/network/detail",
            "proxy":""
        },
        { //服务列表 socket
            "name":"setting.service.socket",
            "url":"/socket/service",
            "proxy":""
        },
        {
            "name":"manor.instance.create",
            "url":"/manor/templates/execute/",
            "proxy":"manor.instance.create.json"
        },
        {
            "name":"manor.instance.resource",
            "url":"/manor/app/resources/",
            "proxy":"manor.instance.resource.json"
        },
        {
            "name":"manor.instance.template",
            "url":"/manor/app/templates/",
            "proxy":"manor.instance.template.json"
        },
        {
            "name":"manor.instance.modify",
            "url":"/manor/app/",
            "proxy":"manor.instance.modify.json"
        },
        {
            "name":"manor.instance.execute",
            "url":"/manor/templates/execute/",
            "proxy":"manor.instance.execute.json"
        },
        {
            "name":"image.upload",
            "url":"/images/upload",
            "proxy":""
        },
        {
            "name":"image.download",
            "url":"/download/image",
            "proxy":""
        },
        {
            "name":"phynetworks",
            "url":"/phynetworks",
            "proxy":""
        },
        {
            "name":"subnets",
            "url":"/subnets",
            "proxy":""
        },
        {
            "name":"subnet",
            "url":"/subnet",
            "proxy":""
        },
        {
            "name":"hostOs",
            "url":"/os",
            "proxy":"data/host.os.json"
        },
        {
            "name":"ShostOs",
            "url":"/sos",
            "proxy":"data/host.Sos.json"
        },{
            "name":"tenant.Detail.Sockte",
            "url":"/socket/tenant/detail",
            "proxy":"d"
        }
    ];
});