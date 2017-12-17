/**
 * Created by wangahui1 on 15/11/4.
 */
require.config(
    {
        baseUrl: "js",
        paths: {
            "jquery": ["./libs/jquery/jquery.min-1-12"],
            "resize":["./libs/jquery/jquery.resize"],//dom的resize扩展
            "i18n": "./libs/jquery/jquery.i18n.properties-1.0.9",//国际化库,
            "locale": "locale",//本地国际化
            "idle":"./modules/idle",//心跳消息
            "role": "./modules/role",//公用角色模块,
            "user": "./modules/user",//公用用户模块,
            "security":"./modules/security",//密级模块
            "strategy":"./modules/strategy",
            "setting.password":"./modules/setting/setting.password",//修改密码
            "ip_list2": "./modules/global/ip_list2",//ip列表
            "host_list2": "./modules/global/host_list2",//主机列表
            "signature": "./modules/signature",//签署模块
            "backbone": "./libs/backbone/backbone",//Backbone MVC Framework
            "underscore": "./libs/backbone/underscore-1.8.2",
            "mockjax": "./libs/mock/jquery.mockjax",//Mock拦截
            "mockjson": "./libs/mock/jquery.mockjson",//Mock Json
            "mousewheel":"./libs/jquery/jquery.mousewheel-3.1.12",//鼠标滚轮插件
            "framework.shell":"./framework/output/framework.min",
            "contextmenu": './libs/jquery/jquery.smartmenu',//右键菜单插件
            "easyui": "./libs/easyui/jquery.easyui.min",
            "upload":"./libs/jquery/ajaxfileupload",
            "clientPaging": "./libs/easyui/jquery.easyui.clientpaging",//easyui客户端分页插件
            "easyui.lang.zh": "./libs/easyui/locale/easyui-lang-zh_CN",//easyui全局中文本地化
            "echart": "./libs/charts/echarts/echarts.min",//echart图表插件
            "echart3": "./libs/charts/echarts.min",
            "echart2": "./libs/charts/echarts",
            "vis":"./libs/charts/vis/vis.min-4-16-1",//vis库
            "codemirror":"./libs/codemirror/codemirror",
            "anyword-hint":"./libs/codemirror/anyword-hint",
            "active-line":"./libs/codemirror/active-line",
            "show-hint":"./libs/codemirror/show-hint",
            "shell-hint":"./libs/codemirror/shell-hint",
            "python-hint":"./libs/codemirror/python-hint",
            "helper":"./libs/codemirror/helper",
            "shell":"./libs/codemirror/shell",
            "python":"./libs/codemirror/python",
            "xml":"./libs/codemirror/xml",
            "way":"./libs/way/way.min",//双向绑定way.js
            "domReady": "./libs/require/domReady",//view加载完毕时候调用
            "iScroll":"./libs/iscroll-4/iscroll",
            "dashboard": "./modules/index/dashboard",//首页
            "cal.host": "./modules/cal/cal.host",//计算－云主机
            "cal.host.create.basic":"./modules/cal/cal.host.create.basic",//计算-云主机-新建第一页
            "cal.host.create.config":"./modules/cal/cal.host.create.config",//计算-云主机-新建第二页
            "cal.host.create.network":"./modules/cal/cal.host.create.network",//计算-云主机-新建第三页
            "cal.host.create.finish":"./modules/cal/cal.host.create.finish",//计算-云主机-新建第四页
            "cal.hostDetail.backup": "./modules/cal/cal.hostDetail.backup",//计算－云主机-备份
            "cal.host.hostDetail.ip": "./modules/cal/cal.host.hostDetail.ip",//计算－云主机-ip
            "cal.hostDetail.delete": "./modules/cal/cal.hostDetail.delete",//计算－云主机-删除
            "cal.hostDetail.template": "./modules/cal/cal.hostDetail.template",//计算－云主机-创建模板
            "cal.hostDetail.move": "./modules/cal/cal.hostDetail.move",//计算－云主机-迁移
            "cal.disk": "./modules/cal/cal.disk",//计算－硬盘
            "cal.disk.adddisk": "./modules/cal/cal.disk.adddisk",//计算－硬盘-新建云硬盘
            "cal.disk.editdisk": "./modules/cal/cal.disk.editdisk",//计算－硬盘-编辑云硬盘
            "cal.disk.backup": "./modules/cal/cal.disk.backup",//计算－硬盘-云硬盘备份
            "cal.disk.user": "./modules/cal/cal.disk.user",//计算－硬盘-云硬盘分配用户
            "cal.backup": "./modules/cal/cal.backup",//计算-备份
            "cal.backupDetail": "./modules/cal/cal.backupDetail",
            "cal.disk.editbackup":"./modules/cal/cal.disk.editbackup",
            "cal.image": "./modules/cal/cal.image",//计算-
            "cal.image.addImage":"./modules/cal/cal.image.addImage",//新建镜像
            "cal.image.editImage":"./modules/cal/cal.image.editImage",//编辑镜像
            "cal.hostslave": "./modules/cal/cal.hostslave",//计算－宿主机
            "cal.hostslave.hostslaveDetail": "./modules/cal/cal.hostslave.hostslaveDetail",//计算-宿主机-详情
            "cal.snapshot": "./modules/cal/cal.snapshot",//计算-快照
            "cal.snapshot.snapshotDetail": "./modules/cal/cal.snapshot.snapshotDetail",//计算-快照-详情
            "network.vlan": "./modules/network/network.vlan",//网络-vlan
            "network.addVlan": "./modules/network/network.addVlan",//网络-vlan-新建
            "network.vlanDetail": "./modules/network/network.vlanDetail",//网络-vlan
            "network.addvalanDetail": "./modules/network/network.addvalanDetail",//网络-vlan-主机列表添加
            "network.addSubnet": "./modules/network/network.addSubnet",//网络-vlan-新建子网
            "network.subnetDetail": "./modules/network/network.subnetDetail",//网络-vlan-子网详情
            "network.topo": "./modules/network/network.topo",//网络-拓扑
            "network.createnet":"./modules/network/network.createnet",//新建网络公共部分
            "network.addVlan2":"./modules/network/network.addVlan2",//新建网络第2个页面
            "warn.host": "./modules/warn/warn.host",//告警-云主机
            //"warn.slave": "./modules/warn/warn.slave",//告警-宿主机
            "log": "./modules/log/log",//日志
            "order.wait": "./modules/order/order.wait",//工单代办
            "order.wait.sec": "./modules/order/order.wait.sec",
            "order.ready": "./modules/order/order.ready",//工单已办
            "order.ready.detail":"./modules/order/order.ready.detail",
            "setting.user": "./modules/setting/setting.user",//配置-用户
            "setting.addUser": "./modules/setting/setting.addUser",//配置-用户-新建
            "setting.userDetail": "./modules/setting/setting.userDetail",//配置-用户-详情
            "setting.project": "./modules/setting/setting.project",//配置-项目
            "setting.tenanteDetail": "./modules/setting/setting.tenanteDetail",//配置-项目-详情
            "setting.addtenanteDetail": "./modules/setting/setting.addtenanteDetail",//配置-项目-详情-用户列表添加
            "setting.addHost":"./modules/setting/setting.addHost",//配置-项目-详情-主机列表添加
            "setting.addcontrolDetail": "./modules/setting/setting.addcontrolDetail",//配置-项目-详情-访问控制列表添加
            "setting.addProject": "./modules/setting/setting.addProject",//配置-项目-新建
            "setting.project.host":"./modules/setting/setting.project.host",
            "setting.project.ip":"./modules/setting/setting.project.ip",
            "setting.param": "./modules/setting/setting.param",//配置-全局参数
            "setting.sysinfo": "./modules/setting/setting.sysinfo",//配置-系统信息
            "setting.upload": "./modules/setting/setting.upload",//配置-系统信息上传
            "setting.password.reset":"./modules/setting/setting.password.reset",//修改密码
            "setting.service":"./modules/setting/setting.service",//服务列表
            "cal.host.hostDetail": "./modules/cal/cal.host.hostDetail",//计算-云主机-详情
            "cal.host.addHost": "./modules/cal/cal.host.addHost",//计算-云主机-新建
            "cal.hostDetail.quato": "./modules/cal/cal.hostDetail.quato",//计算-云主机-详情-修改配额
            "security.group":"./modules/setting/setting.security.group",//安全组
            "security.group.create":"./modules/setting/setting.group.create",
            "alarm":"./modules/alarm",
            "cal.recycle":"./modules/cal/cal.recycle",
            "recycle.vm":"./modules/cal/recycle.vm",
            "recycle.disk":"./modules/cal/recycle.disk",
            "manor.template":"./modules/manor/manor.template",
            "manor.instance":"./modules/manor/manor.instance",
            "manor.instance.detail":"./modules/manor/manor.instance.detail",
            "manor.instance.crate.node":"./modules/manor/manor.instance.crate.node",
            "manor.instance.crate.script":"./modules/manor/manor.instance.crate.script",
            "manor.instance.crate.start":"./modules/manor/manor.instance.crate.start",
            "manor.instance.create.reboot":"./modules/manor/manor.instance.create.reboot",
            "manor.template.create":"./modules/manor/manor.template.create",
            "manor.instance.create":"./modules/manor/manor.instance.create",
            "manor.template.create.step.set":"./modules/manor/manor.template.create.step.set",
            "manor.template.create.flow.param":"./modules/manor/manor.template.create.flow.param",
            "manor.template.create.flow.param.two":"./modules/manor/manor.template.create.flow.paramTwo",
            "manor.template.create.flow.param.three":"./modules/manor/manor.template.create.flow.param.three",
            "manor.template.create.flow.param.four":"./modules/manor/manor.template.create.flow.param.four",
            "manor.template.create.flow.param.five":"./modules/manor/manor.template.create.flow.param.five",
            "manor.template.create.flow.param.six":"./modules/manor/manor.template.create.flow.param.six",
            "manor.template.detail":"./modules/manor/manor.template.detail",
            "manor.template.detail.flow":"./modules/manor/manor.template.detail.flow",
            "manor.template.detail.flow.create":"./modules/manor/manor.template.detail.flow.create",
            "manor.instance.detail.info":"./modules/manor/manor.instance.detail.info",
            "manor.instance.view.monitor":"./modules/manor/manor.instance.view.monitor",
            "mustache":"./libs/mustache/mustache"
            //"mos":"./modules/global/mos"
        },
        waitSeconds:0,
        shim: {
            "i18n": ["jquery"],
            "iScroll":{
                exports:"iScroll"
            },
            "backbone": {
                exports: "Backbone"
            },
            "underscore": {
                exports: "_"
            },
            "mockjax": ["jquery"],
            "mockjson": ["jquery"],
            "easyui": ["jquery"],
            "codemirror":{
                exports:"CodeMirror"
            },
            "helper":
            {
              deps:["codemirror"]
            },
            "xml":{exports:"xml"},
            //"other":
            //{
            //    deps:['jquery'],
            //    exports:'other',
            //    init:function()
            //    {
            //        return {
            //            test:test,
            //            other:other
            //        }
            //    }
            //},
            "easyui.lang.zh": ['jquery'],
            "app": {
                deps: ["framework.shell"]
            },
            "framework.shell":
            {
                deps:["jquery",'locale','easyui',"easyui.lang.zh","mockjax","backbone","underscore","contextmenu","mousewheel"],
                exports:"ef"
            },
            //"security":["framework"],
            //"role":["framework"],
            "locale": ["i18n"],
            "api": {
                deps: ["framework.shell","api.config","mockjax"],
                exports: "api"
            },
            "setting.tenant": {
                exports: "tenant",
                deps: ['jquery', 'easyui', "clientPaging"]

            },
            "setting.project": {
                exports: "setting.project",
                deps: ['jquery', 'easyui', "clientPaging"]
            },
            "setting.tenanteDetail": {
                exports: "setting.tenanteDetail",
                deps: ['jquery', 'easyui', "clientPaging"]
            },
            "setting.user": {
                exports: "setting.user",
                deps: ['jquery', 'easyui', "clientPaging"]
            }, "setting.userDetail": {
                deps: ['jquery', 'easyui', "clientPaging"]
            },
            "log": {
                deps: ['jquery', 'easyui', 'clientPaging']

            },
            "setting.addProject": [
                "css!../theme/default/css/addProject"
            ],
            "setting.addtenanteDetail": {
                deps: ['jquery', 'easyui', 'clientPaging']
            },
            "setting.addcontrolDetail": {
                deps: ['jquery', 'easyui', 'clientPaging']
            }
            //,
            //"app"://css加载
            //    [
            //        "css!./libs/easyui/themes/easted/easyui",
            //        "css!./libs/easyui/themes/icon",
            //        "css!../theme/default/css/global",
            //        "css!./libs/easyui/themes/easted/smartMenu",
            //        "css!../theme/default/css/components",
            //        "css!../theme/default/css/index",
            //        "css!../theme/default/css/index",
            //        "css!../theme/default/css/user",
            //        "css!../theme/default/css/layout",
            //        ""
            ////    ],
            //"dashboard":
            //    ["css!../theme/default/css/dashborard"]
        },
        map: {
            '*': {
                'css': 'libs/require/css'
            }
        }
    })(["app"]);
