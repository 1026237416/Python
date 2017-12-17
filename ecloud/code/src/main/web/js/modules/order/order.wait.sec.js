/**
 * Created by admin on 2015/12/21.
 */
define(['easyui','clientPaging',"module",'user','api','security','cal.host',"domReady"], function (easyui,clientPaging,module,user,api,security,cal_host,domReady) {
    var implement = new ef.Interface.implement();
    var userN;
    implement.datacenter_user = function (secretValue) {//密级数据获取 用户数据获取
        ef.getJSON({
            url: api.getAPI("order.wait.Detail.combo.datacenter"),//密级数据获取
            type: "get",//get,post,put,delete
            data: {
                "security": secretValue
            },
            success: function (response) {
                $('.sec_host_datacenter').combobox('loadData', response);//数据中心下拉表激活
            },
            error: function (error) {
                console.log(error);
            }
        });
    };
    implement.user = function (secretValue,type,core,memory) {
        ef.getJSON({
            url: api.getAPI("setting.user.datagrid_users"),//用户数据获取
            type: "get",//get,post,put,delete
            data: {
                "security": secretValue
            },
            success: function (response) {
                $('.sec_host_user').combogrid({
                    data: response,
                    onChange: function (newValue, oldValue) {
                        $('.sec_host_project').combobox({disabled: false});//激活项目
                        try {
                            newValue.length
                        } catch (err) {
                            newValue = oldValue;
                        }
                        var g = $(this).combogrid('grid');
                        var _data = ef.util.copyDeepProperty(response);
                        var arrs = [];
                        if (!newValue.length) {
                            arrs = _data;
                        } else {
                            $(_data).each(function (i, il) {
                                if (il.name.indexOf(newValue) != -1) {
                                    arrs.push(il);
                                }
                            });
                        }
                        _data = arrs;
                        g.datagrid("loadData", _data);
                    },
                    onShowPanel: function () {
                        var g = $('.sec_host_user').combogrid('grid');	// 获取数据表格对象
                        g.datagrid({onSelect: function () {
                            var r = g.datagrid("getSelected");
                            $('.sec_host_user').combogrid("setValue", r.name);
                            userN=r.id;
                            implement.project(r.id,type,core,memory);//根据选择用户调用项目获取数据
                        }});
                    },
                    onHidePanel: function () {
                        var username = [];
                        var g = $('.sec_host_user').combogrid('grid');
                        var row = g.datagrid('getRows');
                        $(row).each(function (i, il) {
                            username.push(il.name);
                        });
                        var un = $('.sec_host_user').combogrid("getValue");
                        if (username.indexOf(un) == -1) {
                            $('.sec_host_user').combogrid('clear');
                        }
                    }
                });
            },
            error: function (error) {
                console.log(error);
            }
        });
    };
    //宿主机
    implement.ip_host = function (tenantId, vlanId,core,memory,vlan) {
        ef.getJSON({
            url: api.getAPI("available_hosts"),
            type: "get",
            data:{
                tenant_id:tenantId,
                cores:core,
                memory:memory,
                vlan:vlanId,
                region:ef.localStorage.get("order.wait.region")
            },
            success: function (response) {
                $('#sec_host_host').combogrid({
                    data: response
                });
            },
            error: function (error) {
                console.log(error);
            }
        });
        ef.getJSON({
            url: api.getAPI("order.wait.Detail.combo.vlan") + "/" + vlanId + "/ips",
            type: "get",//get,post,put,delete
            data: {
                region:ef.localStorage.get("order.wait.region"),
                tenant: tenantId
            },
            success: function (response) {
                $(response).each(function (i,il) {
                    il.sufix = Number(ef.util.getIpSufix(il.ip));
                });
                response = ef.util.sort('sufix',response);
                console.log(response);
                response.splice(0,0,{ip:"DHCP",tenant:{id:tenantId}});
                $('#sec_host_IP').combobox('loadData', response);
            },
            error: function (error) {
                console.log(error);
            }
        });
    };
    implement.vlan_mount = function (tenantId,userId,type,core,memory) {
        if(type==0){
            ef.getJSON({
                url: api.getAPI("network.vlan.datagrid_vlan"),//根据项目获取VLAN数据
                type: "get",//get,post,put,delete
                data: {
                    region:ef.localStorage.get("order.wait.region"),
                    tenant: tenantId
                },
                success: function (response) {
                    $('#sec_host_VLAN').combobox('loadData', response).combobox({
                        onSelect: function (record) {
                            ef.localStorage.put("order.wait.vlan",record.id);
                            console.log(record);
                            $('#sec_host_host').combogrid({disabled: false});//激活宿主机
                            implement.ip_host(tenantId, record.id,core,memory,record.name);//调用宿主机获取宿主机数据
                        }
                    });
                },
                error: function (error) {
                    console.log(error);
                }
            });
        }
        if(type==1){
            ef.getJSON({
                url: api.getAPI("hostList"),
                type: "get",
                data:{
                    tenant_id:tenantId,
                    user_id:userId,
                    region:ef.localStorage.get("order.wait.region")
                },
                success: function (response) {
                    $(response).each(function (i,il) {
                        il.ip =cal_host.getRealIp(il);
                    });
                    $('#mount').combogrid({
                        data: response
                    });
                },
                error: function (error) {
                    console.log(error);
                }
            });
        }
    };

    implement.init = function (type,os,core,memory,vlan) {
        var secretValue;
        $(".sec_host_secret").combobox({
            editable: false,
            prompt: ef.util.getLocale("order.wait.Detail.prompt.secret"),//请选择密级
            textField: 'label',
            valueField: "value",
            onChange: function (newValue, oldValue) {
                $(".sec_host_datacenter").combobox({disabled:false});//激活数据中心
                secretValue = $(".sec_host_secret").combobox('getValue');
                implement.datacenter_user(secretValue);//获取数据中心、用户数据
            }
        });
        $(".sec_host_datacenter").combobox({
            editable: false,
            disabled: true,
            valueField:"region",
            prompt: ef.util.getLocale("order.wait.Detail.prompt.datacenter"),//请选择数据中心
            textField: 'displayname',
            onChange: function (newValue, oldValue) {
                $('#sec_host_image').combobox('clear').combobox({disabled: false});//激活镜像
                $(".table_save").combobox('clear').combobox({disabled: false});
                implement.image(type,newValue,os);//获取镜像数据
                implement.save(newValue);
                implement.user(secretValue,type,core,memory);
                $(".sec_host_user").combogrid({disabled: false});//激活用户
            },
            onSelect: function (record) {
                ef.localStorage.put("order.wait.region", record.region);
            }
        });
        $("#sec_host_image").combobox({
            editable: false,
            disabled: true,
            prompt: ef.util.getLocale("order.wait.Detail.prompt.image"),//请选择镜像
            textField: 'name',
            valueField:"id",
            onSelect: function (record) {
                if(record.default_pwd.length!=0){
                    $("#sec_host_ospwd").parent().show();
                    $("#sec_host_ospwd").textbox('clear').textbox('setValue',record.default_pwd);
                    $("#sec_host_text").textbox('clear').textbox('setValue',record.default_pwd);
                }
            }
        });
        $(".sec_host_user").combogrid({
            mode: 'local',
            panelWidth: 400,
            disabled: true,
            valueField:'id',
            prompt: ef.util.getLocale("order.wait.Detail.prompt.user"),//请选择用户
            textField: 'username',
            columns: [
                [
                    {field: 'name', title: ef.util.getLocale("setting.user.datagrid.uid"), width: "30%"},//用户名
                    {field: 'displayname', title: ef.util.getLocale("setting.user.datagrid.name"), width: "35%"},//姓名
                    {field: 'security', title: ef.util.getLocale("setting.user.datagrid.secrets"), width: "40%",formatter: function (val,row) {
                        return security.getSecurityByValue(val).label;
                    }}//密级
                ]
            ]
        });
        $(".sec_host_project").combobox({
            editable: false,
            disabled: true,
            valueField: 'id',
            prompt: ef.util.getLocale("order.wait.Detail.prompt.project"),//请选择项目
            textField: 'tenant'
        });
        $("#sec_host_VLAN").combobox({
            disabled: true,
            editable: false,
            prompt: ef.util.getLocale("order.wait.Detail.prompt.VLAN"),//请选择VLAN
            textField: 'name',
            valueField: 'id'
        });
        $("#sec_host_IP").combobox({
            editable: false,
            disabled: true,
            valueField: "ip",
            prompt: ef.util.getLocale("order.wait.Detail.prompt.IP"),//请选择IP
            textField: 'ip',
            loadFilter: function(data){
                var result = [];
                $(data).each(function(i,il)
                {
                    if(!il.used&&il.tenant.id&&il.tenant.id==ef.localStorage.get("order.wait.project"))
                    {
                        result.push(il);
                    }
                });
                return result;
            },
            onSelect: function (record) {
                if(record.ip=="DHCP"){
                    ef.localStorage.put("order.wait.ip", null);
                    return;
                }
                else{
                    ef.localStorage.put("order.wait.ip", record.ip);
                }
            }
        });
        $("#sec_host_host").combogrid({
            editable: false,
            panelWidth: 400,
            disabled: true,
            prompt: ef.util.getLocale("order.wait.Detail.prompt.host"),//宿主机
            textField: 'label',
            columns: [
                [
                    {field: 'name', title: ef.util.getLocale("host.comboxtoinput.name"), width: "30%"},//名称
                    {field: 'ip', title: ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.ipfield"), width: "35%"},//IP
                    {field: 'cpus', title: ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.formatfield"), width: "40%", formatter: function (val, row) {
                        return val + "核" + Math.ceil(row.memory_mb/1024) + "GB";
                    }}//配置
                ]
            ],
            onShowPanel: function () {
                var g = $('#sec_host_host').combogrid('grid');	// 获取数据表格对象
                g.datagrid({onSelect: function () {
                    var r = g.datagrid("getSelected");
                    $('#sec_host_host').combogrid("setValue", r.name);
                }});
            }
        });
        $("#mount").combogrid({
            editable: false,
            panelWidth: 400,
            disabled: true,
            prompt: ef.util.getLocale("order.wait.Detail.prompt.mount"),//请选择挂载的宿主机
            textField: 'label',
            columns: [
                [
                    {field: 'displayname', title: ef.util.getLocale("host.comboxtoinput.name"), width: "30%"},//名称
                    {field: 'ip', title: ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.ipfield"), width: "35%"},//IP
                    {field: 'cores', title: ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.formatfield"), width: "40%", formatter: function (val, row) {
                        return val + "核" + row.memory/1024 + "GB";
                    }}//配置
                ]
            ],
            onShowPanel: function () {
                var g = $('#mount').combogrid('grid');	// 获取数据表格对象
                g.datagrid({onSelect: function () {
                    var r = g.datagrid("getSelected");
                    $('#mount').combogrid("setValue", r.displayname);
                    ef.localStorage.put("order.wait.mount",r.id);
                }});
            }
        });
        $("#sec_host_ospwd").textbox({
            editable:false,
            icons: [{
                iconCls:'icon-eye',
                iconAlign:"right",
                handler: function(e){
                    $("#sec_host_ospwd").parent().hide();
                    $("#sec_host_text").parent().show();
                }
            }]
        });
        $("#sec_host_text").textbox({
            editable:false,
            icons: [{
                iconCls:'icon-eye-close',
                iconAlign:"right",
                handler: function(e){
                    $("#sec_host_ospwd").parent().show();
                    $("#sec_host_text").parent().hide();
                }
            }]
        });
        $("#sec_host_ospwd").parent().hide();
        $("#sec_host_text").parent().hide();
    };
    implement.project= function (userId,type,core,memory) {
        ef.getJSON({
            url: api.getAPI("setting.user.userlist")+"/"+userId+"/tenants",
            type: "get",//get,post,put,delete
            success: function (response) {
                var resp = [];
                $(response).each(function (i,il) {
                    resp.push({tenant:il.name,id:il.id});
                });
                $('.sec_host_project').combobox('loadData', resp).combobox({
                    onChange: function (newValue, oldValue) {
                        $('#sec_host_VLAN').combobox({disabled: false});
                        $('#sec_host_IP').combobox({disabled: false});
                        $("#mount").combogrid({disabled:false});
                        var tenantId = $('.sec_host_project').combobox('getValue');
                        implement.vlan_mount(tenantId,userId,type,core,memory);
                    },
                    onSelect: function (record) {
                        ef.localStorage.put("order.wait.project", record.id);
                    }
                });
            },
            error: function (error) {
                console.log(error);
            }
        });//项目
    };
    implement.image = function (type,region,os) {
        if(type==0){
            ef.getJSON({
                url: ef.util.url(api.getAPI("order.wait.Detail.combo.image"),{os:os,status:"online",region:region}),
                type: "get",//get,post,put,delete
                success: function (response) {
                    $('#sec_host_image').combobox('loadData', response);
                },
                error: function (error) {
                    console.log(error);
                }
            });//镜像
        }
    };
    implement.save = function (region) {
        ef.getJSON({
            url: api.getAPI("order.wait.Detail.save.ip"),
            type: "get",
            data:{region:region},
            success: function (response) {
                $(".table_save").combobox('loadData',response);
            },
            error: function (error) {
                console.log(error);
            }
        });//存储
    };
    implement.combo = function (os,strategy,type,status,core,memory,vlan) {
        implement.init(type,os,core,memory);
        $(".sec_host_secret").combobox('loadData', security.getSecurityList());//获取密级数据
    };
    implement.redraw = function () {
        ef.util.ready(function (dom) {
            function open(policy) {
                var secret = Number($(".sec_host_secret").combobox('getValue'));
                var region = $(".sec_host_datacenter").combobox('getValue');
                var tenant = $(".sec_host_project").combobox('getValue');
                var backup = $(".data_host_backup").val();
                var _row = $("#orderdetail_wait").datagrid('getRows');
                user = userN;
                var vol = [];
                $(_row).each(function (i, il) {
                    if(il.type!=0){
                        var item = {displayname: "", size: "", volume_type: ""};
                        item.displayname = il.displayname;
                        item.size = il.size;
                        item.volume_type = il.saveValue;
                        vol.push(item);
                    }
                });
                var Host_ALl = [];
                if (_pageData.type == 0) {
                    var image = $("#sec_host_image").combobox('getValue');
                    var vlan = $("#sec_host_VLAN").combobox('getValue');
                    var ip = $("#sec_host_IP").combobox('getValue');
                    Host_ALl.push({
                        "sys_volume":"Default",
                        "network":[{"vlan":vlan,"ip":ip}],
                        "image": image,
                        "host":$("#sec_host_host").combogrid('getValue'),
                        "create_policy":policy
                    });
                    var res = Host_ALl.concat(vol);
                    ef.getJSON(
                        {
                            url: api.getAPI("order") + "/approve" + "/" + _pageData.id,
                            type: "post",//get,post,put,delete
                            data: {
                                "type": 0,
                                "security":secret,
                                "region": region,
                                "image":image,
                                "user": user,
                                "tenant": tenant,
                                "des":backup,
                                "resources":res
                            },
                            success: function (response) {

                                ef.loading.hide();
                                ef.placard.tick(ef.util.getLocale("order.ready.create.success"));
                                ef.nav.goto("order.wait.html", "order.wait", null, null, "order.wait");
                            },
                            error: function (error) {
                                ef.loading.hide();
                            }
                        });
                }
                else if (_pageData.type == 1) {
                    ef.getJSON(
                        {
                            url: api.getAPI("order") + "/approve" + "/" + _pageData.id,
                            type: "post",//get,post,put,delete
                            data: {
                                "type": 1,
                                "security":secret,
                                "region": region,
                                "user": user,
                                "tenant": tenant,
                                "des":backup,
                                "resources": [{
                                    "displayname":ef.localStorage.get("order_wait_Detail_displayname"),
                                    "volume_type":$(".table_save").combobox('getValue'),
                                    "vm_id": ef.localStorage.get("order.wait.mount"),
                                    "size":Number(ef.localStorage.get("order_wait_Detail_size"))
                                }]
                            },
                            success: function (response) {
                                ef.loading.hide();
                                ef.nav.goto("order.wait.html", "order.wait", null, null, "order.wait");
                            },
                            error: function (error) {
                                ef.loading.hide();
                            }
                        });
                }
                secret=null;region=null;user=null;tenant=null;save=null;
            }
            var _data = dom.data("pageData");
            _data = ef.util.unescapeJSON(_data);
            var _pageData = null;
            if (_data) {
                _data = JSON.parse(_data);
                _pageData = _data;
                ef.getJSON(
                    {
                        url: api.getAPI("order") +"/"+_pageData.id,
                        type: "get",//get,post,put,delete
                        success: function (response) {
                            var resp = [],type,policy;
                            $(response).each(function (i, il) {
                                $(il.resources).each(function (e,el) {
                                    if(el.type==0){
                                        policy = el.create_policy;
                                    }
                                });
                            });
                            var _iconMenu = $(".orderwait-icon-box").iconmenu([
                                {
                                    iconClass: "icon-menus-icon-revoke",
                                    tip: ef.util.getLocale("global.button.revoke.label"),//"撤销",
                                    id: "1",
                                    "access": [8, 88],
                                    click: function () {
                                        var des = $(".data_host_backup").val();
                                        $.messager.confirm(ef.alert.warning, ef.util.getLocale("order.wait.message.revoke") + _pageData.id, function (ok) {//是否卸载云主机  所有相关备份文件同时删除
                                            if (ok) {
                                                ef.getJSON(
                                                    {
                                                        url: api.getAPI("order") + "/cancel" + "/" + _pageData.id,
                                                        type: "post",//get,post,put,delete
                                                        data:{des:des},
                                                        success: function (response) {
                                                            ef.nav.goto("order.wait.html", "order.wait", null, null, "order.wait");
                                                        }
                                                    });
                                            }
                                        });
                                    }
                                },
                                {
                                    iconClass: "icon-menus-icon-delecan",
                                    tip: ef.util.getLocale("global.button.open.label"),//"开通",
                                    id: "1",
                                    "access": [9, 88],
                                    click: function () {
                                        console.log(policy);
                                        ef.placard.hide();
                                        if($(".sec_host_secret").combobox('getValue')==0){
                                            ef.loading.hide();
                                            ef.placard.warn(ef.util.getLocale("order.wait.validate.secret"));
                                        }
                                        else if(!$(".sec_host_datacenter").combobox('getValue')){
                                            ef.loading.hide();
                                            ef.placard.warn(ef.util.getLocale("order.wait.validate.datacenter"));
                                        }
                                        else if(!$(".sec_host_user").combogrid('getValue')){
                                            ef.loading.hide();
                                            ef.placard.warn(ef.util.getLocale("order.wait.validate.user"));
                                        }
                                        else if(!$(".sec_host_project").combobox('getValue')){
                                            ef.loading.hide();
                                            ef.placard.warn(ef.util.getLocale("order.wait.validate.project"));
                                        }

                                        else if (_pageData.type == 1 ) {
                                            if(!$("#mount").combogrid('getValue')){
                                                ef.loading.hide();
                                                ef.placard.warn(ef.util.getLocale("order.wait.validate.vm"));
                                                return;
                                            }
                                            else if($(".table_save")&&!$(".table_save").combobox('getValue')){
                                                ef.loading.hide();
                                                ef.placard.warn(ef.util.getLocale("order.wait.validate.save"));
                                                return;
                                            }
                                            $.messager.confirm(ef.alert.warning, ef.util.getLocale("order.wait.message.open") + _pageData.id, function (ok) {//是否卸载云主机  所有相关备份文件同时删除
                                                if (ok) {
                                                    ef.loading.show();
                                                    open(policy);
                                                }
                                            });
                                        }
                                        else {
                                            if(!$("#sec_host_image").combobox('getValue')){
                                                ef.loading.hide();
                                                ef.placard.warn(ef.util.getLocale("order.wait.validate.image"));
                                            }

                                            else if(!$("#sec_host_VLAN").combobox('getValue')){
                                                ef.loading.hide();
                                                ef.placard.warn(ef.util.getLocale("order.wait.validate.vlan"));
                                            }
                                            else{
                                                $.messager.confirm(ef.alert.warning, ef.util.getLocale("order.wait.message.open") + _pageData.id, function (ok) {//是否开通工单
                                                    if (ok) {
                                                        ef.loading.show();
                                                        open(policy);
                                                    }
                                                });
                                            }
                                        }
                                    }
                                },
                                {
                                    iconClass: "icon-menus-icon-open",
                                    tip: ef.util.getLocale("global.button.refuse.label"),//"拒绝",
                                    id: "1",
                                    "access": [9, 88],
                                    click: function () {
                                        var des = $(".data_host_backup").val();
                                        $.messager.confirm(ef.alert.warning, ef.util.getLocale("order.wait.message.refuse") + _pageData.id, function (ok) {//是否拒绝工单
                                            if (ok) {
                                                ef.getJSON(
                                                    {
                                                        url: api.getAPI("order") + "/reject" + "/" + _pageData.id,
                                                        type: "post",//get,post,put,delete
                                                        data:{des:des},
                                                        success: function (response) {
                                                            ef.nav.goto("order.wait.html", "order.wait", null, null, "order.wait");
                                                            //ef.localStorage.put("order.wait.Detail.cancel",_pageData.id);
                                                        },
                                                        error: function (error) {
                                                            console.log(error)
                                                        }
                                                    });
                                            }
                                        });
                                    }
                                },
                                {
                                    iconClass: "icon-menus-icon-back",
                                    tip: ef.util.getLocale("global.button.return.label"),// "返回",
                                    id: "2",
                                    "access": [8, 9, 88],
                                    click: function () {
                                        ef.nav.goto("order.wait.html", "order.wait", null, null, "order.wait");
                                    }
                                }
                            ]);
                            $(response).each(function (i, il) {
                                type=il.type;
                                $(il.resources).each(function (e,el) {
                                    resp.push(el);
                                });
                                if(user.isSys()){
                                    if (user.getId() != il.creator.id) {
                                        _iconMenu.setStatus("1", true);
                                    }
                                }
                            });
                            $('#orderdetail_wait').datagrid({data: resp});
                            if (user.isSys() || user.isAudit()) {
                                $("#orderdetail_wait").datagrid({
                                    columns: [
                                        [
                                            {field: 'type', title: ef.util.getLocale("order.wait.table.type"), width: "30%", formatter: function (val, row, index) {//类型
                                                if (val == 0) {
                                                    return "云主机";
                                                }
                                                if (val == 1) {
                                                    return "云硬盘";
                                                }
                                            }},
                                            {field: 'displayname', title: ef.util.getLocale("host.comboxtoinput.name"), width: "35%"},//名称
                                            {field: 'cores', title: ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.formatfield"), width: "40%", formatter: function (val, row, index) {
                                                if(row.type!=0){
                                                    return row.size+"GB";
                                                }
                                                return val + "核" + row.memory/1024 + "GB";
                                            }}//配置
                                        ]
                                    ]
                                }).datagrid('clientPaging');
                            }
                            if (user.isSec() || user.isSuper()) {
                                $("#orderdetail_wait").datagrid({
                                    columns: [
                                        [
                                            {field: 'type', title: ef.util.getLocale("order.wait.table.type"), width: "25%", formatter: function (val, row, index) {//类型
                                                if (val == 0) {
                                                    return "云主机";
                                                }
                                                if (val == 1) {
                                                    return "云硬盘";
                                                }
                                            }},
                                            {field: 'displayname', title: ef.util.getLocale("host.comboxtoinput.name"), width: "25%"},//名称
                                            {field: 'cores', title: ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.formatfield"), width: "25%", formatter: function (val, row, index) {
                                                if(row.type!=0){
                                                    return row.size+"GB";
                                                }
                                                return val + "核" + row.memory/1024 + "GB";
                                            }},//配置
                                            {field: 'save', title: ef.util.getLocale("order.ready.info.grid.head.store"), width: "35%", formatter: function (value, row, index) {//存储
                                                if(row.type==0){
                                                    return "Default";
                                                }
                                                var dom = $('<span class="save"></span>');
                                                var domIn = $('<input class="table_save" style="height: 30px">');
                                                dom.append(domIn);
                                                domIn.combobox({
                                                    editable: false,
                                                    disabled: true,
                                                    panelHeight:100,
                                                    width:200,
                                                    prompt: ef.util.getLocale("order.wait.Detail.prompt.tablesave"),//请选择存储方式
                                                    textField: 'name',
                                                    valueField:'name',
                                                    onSelect: function (record) {
                                                        ef.localStorage.put("order.wait.save", record.name);
                                                        row.saveValue = record.name;
                                                    },
                                                    onChange:function(newValue,oldValue){

                                                    }
                                                });
                                                return dom;
                                            }}
                                        ]
                                    ]
                                }).datagrid('clientPaging');
                            }
                            if (user.isAudit()) {
                                $(".icon-menus-box").remove();
                                $(".block-lists").removeClass("padding_top50");
                            }
                            if (user.isSys() || user.isAudit()) {
                                $(".block-lists").css("margin-top", "-10px");
                                $("#sec_content_disk").remove();
                                $("#sec_content").remove();
                                $(response).each(function (j, el) {
                                    if (el.type == "0") {
                                        $(".data_sys_type").text(ef.util.getLocale("order.type.host"));
                                        $(".data_sys_allocation").text(ef.util.getLocale("order.wait.table.allocation."+ef.util.pluck(el.resources,"create_policy").join("")));
                                    }
                                    if (el.type == "1") {
                                        $(".data_sys_type").text(ef.util.getLocale("order.type.disk"));
                                        $("#transactor").remove();
                                        $("#occupying").remove();
                                        $("#strategy").remove();
                                    }
                                    $(".data_sys_backup").text(el.des).attr({title:el.des});
                                    $(".data_sys_os").text(ef.util.pluck(el.resources,"os").join(""));
                                    $(".data_sys_transactor").text(el.creator.displayname);
                                });
                            }
                            //分配策略宿主机部分
                            var allocation;
                            if (user.isSec() || user.isSuper()) {
                                if (_pageData.type == "1") {//云硬盘
                                    $("#sec_content").remove();
                                    $("#sec_content_disk").css("margin-top", "-10px");
                                }
                                if (_pageData.type == "0") {//云主机
                                    $("#sec_content_disk").remove();
                                    $("#table_wait").css("margin-top", "-20px")
                                }
                                $("#sys_content").remove();
                                var core,memory;
                                $(response).each(function (i, il) {
                                    $(".data_host_os").text(ef.util.pluck(il.resources,"os").join(""));
                                    ef.localStorage.put("order.wait.os",ef.util.pluck(il.resources,"os").join(""));
                                    $(".data_host_transactor").text(il.creator.displayname);
                                    $(".data_host_osuser").text();
                                    $(".data_host_backup").val(il.des);
                                    ef.localStorage.put("order_wait_Detail_displayname",ef.util.pluck(il.resources,"displayname").join(""));
                                    ef.localStorage.put("order_wait_Detail_size",ef.util.pluck(il.resources,"size").join(""));
                                    console.log(ef.util.pluck(il.resources,"size").join(""));
                                    core = ef.util.pluck(il.resources,"cores").join("");
                                    memory = ef.util.pluck(il.resources,"memory").join("");
                                });
                                var osOne = $(".data_host_os").text();
                                var osNew = osOne.toLocaleLowerCase();
                                if(osNew.indexOf('windows')==-1){
                                    $(".data_host_osuser").text("root");
                                }
                                else{
                                    $(".data_host_osuser").text("administrator");
                                }
                            }
                            var os = $(".data_host_os").text();
                            var status=$("#sec_host_image").text();
                            implement.combo(os,allocation,type,status,core,memory);
                        },
                        error: function (error) {
                            console.log(error);
                        }
                    });
            }
        });
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});