define(['user', 'clientPaging', 'domReady', "module", 'api', 'setting.project', "network.topo", "network.vlanDetail", "security", "role", "cal.host","setting.project.ip"], function (user, clientPaging, domReady, module, api, project, networkTopo, vlanDetail, security, role, calHost,ip) {
    var implement = new ef.Interface.implement();
    /**设置topo中数据vlan为选中
     * 如果参数为一个，则设置其所有为选中
     * 如果参数为两个，则设置第二个参数中所有和第一个参数中项相同的都设置为选中
     * */
    implement.setSelectData = function (selects, response) {
        if (arguments.length == 1) {
            $(selects).each(function (j, jl) {
                jl.selected = true;
            });
            return selects;
        }
        $(selects).each(function (i, il) {
            $(response).each(function (j, jl) {
                if (il.id == jl.id) {
                    jl.selected = true;
                }
            });
        });
        return response;
    };
    /**获取宿主机列表
     * @param {String} vlanId vlan的id
     * @param {String} tenantId 项目的id
     * @param {Boolean} isForce 是否是强制读取服务`
     * @param {Function} callback 获取数据后的回调处理函数
     * */
    implement.addDialog = function () {
        new ef.Dialog('tenantDetail.host', {
            title: ef.util.getLocale("setting.project.adddialog.tip"),
            width: 900,
            height:570,
            closed: false,
            cache: false,
            nobody: false,
            modal: true,
            href: "views/addtenanteDetail.html",
            onResize: function () {
                $(this).dialog('center');
            },
            onLoad: function () {
                require(['setting.addtenanteDetail'], function (addtenanteDetail) {
                    addtenanteDetail.redraw();
                })
            },
            onClose: function () {
                implement.tenantDetail(ef.localStorage.get("setting.project.Detail.id"),false);
            }
        })
    };
    implement.addControl=function(){
        new ef.Dialog('ControlDetail.host', {
            title: ef.util.getLocale("setting.project.adddialog.control.tip"),
            width: 900,
            height: 570,
            closed: false,
            cache: false,
            nobody: false,
            modal: true,
            href: "views/addcontrolDetail.html",
            onResize: function () {
                $(this).dialog('center');
            },
            onLoad: function () {
                require(['setting.addcontrolDetail'], function (addcontrolDetail) {
                    addcontrolDetail.redraw();
                })
            },
            onClose: function () {
                require.undef("setting.addcontrolDetail");
                implement.dataControl();
            }
        });
    };
    //增加host弹框
    implement.addhostDialog=function(){
        new ef.Dialog('tenantHost.host',{
            title: ef.util.getLocale("setting.project.addhostDialog.tip"),
            width:900,
            height:570,
            closed:false,
            cache:false,
            modal:true,
            href:"views/addtenantHost.html",
            onResize:function(){
                $(this).dialog('center');
            },
            onLoad:function(){
                require(['setting.addHost'],function(addHost){
                    addHost.redraw();
                })
            },
            onClose: function () {
                //implement.host_datagrid();
            }
        })
    };
    //删除主机某一条
    implement.deleteHostRow=function(){
        var row=$('#tenanthostList').datagrid('getSelected');
        ef.getJSON(
            {
                url:api.getAPI("setting.project.datagrid_host")+"/"+ef.localStorage.get("setting.project.Detail.id")+"/host/"+row.id,
                type:"delete",
                isForce:this.isForce,
                success:function()
                {
                    //implement.host_datagrid();
                    ef.loading.hide();
                    //ef.placard.tick(ef.util.getLocale("setting.project.placard.delesuccess"));
                },
                error:function(error){
                    ef.placard.show(error.msg);
                    ef.loading.hide();
                }
            });
    };
    //获取宿主机列表数据
    implement.host_datagrid=function(){
        ef.getJSON({
            //"order.wait.Detail.host.ip"
            url:api.getAPI("setting.project.datagrid_host")+"/"+ef.localStorage.get("setting.project.Detail.id")+"/hosts",
            type:"get",
            useLocal:false,
            success:function(response){
                ef.loading.hide();
                var a=1;
                if (response.length!=0) {
                    $("#dialog-table-zj").hide();
                    $(".zj_control").show();
                }
                else {
                $("#plain-datagrid-zj").hide();
                $(".zj_control").hide();
                $("#dialog-table-zj").show().click(function () {
                    if(user.isSys()||user.isSuper()){
                        $("#dialog-table-zj").hide();
                        $(".zj_control").show();
                        $("#plain-datagrid-zj").show();
                        implement.host_table();
                    }
                });
                }
                ef.localStorage.put("tenant_host_rules",response);
                $('#tenanthostList').datagrid({data:response}).datagrid("clientPaging");
                implement.hostWebSocket();
            },
            error:function(){}
        });
    };
    //主机表格列项
    implement.host_table=function(){
        $('#tenanthostList').datagrid(
            {
                singleSelect:true,
                pagination:true,
                emptyText:"暂无数据",
                onEmptyTextClick:function(){
                    console.log("empty");
                },
                columns:[
                    [
                        {field:"name",width:"18%",title:ef.util.getLocale('setting.userdetail.datagrid.name'),
                            formatter: function(val) {
                                if(val){
                                    return '<span style="padding-left: 0px;">' + val +'</span>'
                                }else{
                                    return '<span>-</span>'
                                }
                            }
                        },
                        {field:"ip",width:"18%",title:'IP',
                            formatter: function(val) {
                                if(val){
                                    return '<span style="padding-left: 0px;">' + val +'</span>'
                                }else{
                                    return '<span>-</span>'
                                }
                            }
                        },
                        {field:"cpus",width:"18%",title:ef.util.getLocale('setting.userdetail.datagrid.format'),formatter:function(val,row){
                            var memo = Math.ceil(row.memory_mb/1024);
                            return val+ef.util.getLocale("cal.host.util")+memo+ef.util.getLocale("cal.host.GB");
                        }},
                        {field:"status",width:"18%",title:ef.util.getLocale('setting.userdetail.datagrid.status'),
                            formatter: function(val) {
                                if(val=="available"){
                                    return '<i style="height: 16px;width: 13px;margin-left: 4px;" class="icon-status-done-success hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.able")+'</span>'
                                }
                                else{
                                    return '<i style="height: 16px;width: 13px;margin-left: 4px;" class="icon-status-done-fail hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.disable")+'</span>'
                                }
                            }
                        },
                        {
                            field:"vm_counts",title:"云主机(个)",width:"17%",formatter:function(val,row){
                            return val?val:0;
                        }},
                        {
                            field:"vd_counts",title:"云硬盘(个)",width:"17%",formatter:function(val,row){
                            return val?val:0;
                        }}
                    ]]
            }).datagrid("clientPaging");
    };
    implement.deleteRow=function(){
       var row=$("#tenantcontrollist").datagrid("getSelected");
        ef.getJSON(
            {
                url:api.getAPI("security.project.control.rule")+"/"+ef.localStorage.get("setting.project.Detail.id")+"/rule/"+row.id,
                type:"delete",
                isForce:this.isForce,
                success:function()
                {
                    implement.dataControl();
                    ef.loading.hide();
                    ef.placard.tick(ef.util.getLocale("setting.project.placard.delrules"));
                },
                error:function(error)
                {
                    ef.placard.show(error.msg);
                    ef.loading.hide();
                }
            });
    };
    /**
     * 获取租户详情
     * */
    implement.getTenantInfo=function(id,isForce,callback,errorCallback)
    {
        ef.getJSON(
            {
                url: api.getAPI("setting.project.datagrid_project") + "/" + id,
                type: 'get',
                isForce: isForce,
                success: function (response) {
                    callback?callback(response):null;
                },
                error: function (error) {
                    errorCallback?errorCallback(error):null;
                }
            });
    };
    implement.tenantDetail = function (id,isFirst,callback) {
        ef.getJSON(
            {
                url: api.getAPI("setting.project.datagrid_project") + "/" + id + "/users",
                type:'get',
                success: function (response) {
                    ef.loading.hide();
                        if (response.length!=0) {
                          $("#dialog-table-ten").hide();
                          $(".bottom").show();
                        }
                        else {
                            $(".bottom").hide();
                            $("#dialog-table-ten").show().click(function () {
                                $("#dialog-table-ten").hide();
                                $(".bottom").show();
                            });
                        }
                  $(response).each(function (i, il) {
                      if (il.role) {
                         il.uRole = il.role.name;
                        }
                         if (il.tenants) {
                          for (var a = 0; a < il.tenants.length; a++) {
                           il.tenants = il.tenants[a].name;
                           }
                          }
                    });
                     response = ef.util.sort("name", response);
                     if (isFirst) {
                            $("#tenantuserlist").datagrid({data:response}).datagrid('clientPaging', {onPage: function () {
                         if (callback) {
                            callback();
                        }
                     }});
                   }
                   else if(!isFirst){
                       $("#tenantuserlist").datagrid('loadData', response).datagrid("goto", 1);
                    }
                  },
                error: function () {
                    ef.loading.hide();
                }
            });
    };
    /**设置项目下的vlan
     * @param {String} tenantId 项目的id
     * @param {Object} data 要设置的数据
     * @param {Function} callback 请求后的回调处理函数
     *
     * */
    implement.setProjectVlan = function (tenantId, data, callback, errorCallback) {
        ef.getJSON(
            {
                url: api.getAPI("subnet") + "/tenant/"  +tenantId,
                type: "post",
                isForce: implement.isForce,
                data: {
                   subnet_ids: data
                },
                success: function (response) {
                    if (callback) {
                        callback(response);
                    }
                },
                error: function (error) {
                    if (errorCallback) {
                        errorCallback(error);
                    }
                }
            });
    };
    implement.setTenRole=function(id,used,setr){
            ef.getJSON(
                {
                    url: api.getAPI("setting.user.userlist")+"/"+used+"/tenant/"+id+"/role",
                    type: "post",//get,post,put,delete
                    isForce:true,
                    data:{
                        "role":setr
                    },
                    success: function (response) {
                        ef.loading.hide();
                        implement.tenantDetail(implement.pageData.id);
                        //ef.nav.reload();
                     },
                    error: function () {
                        ef.loading.hide();
                    }
                });
        };
    implement.init = function() {
        if(!implement.socket){
            implement.socket=new ef.server.Socket(api.getAPI('tenant.Detail.Sockte',true),"tenant.Detail.Sockte");
        }
        this.isForce = true;
        this.pageData = null;//跨页传递的数据
        this.topo = null;//拓扑图对象
        this.topoSaveData = null;//拓扑图保存的数据
        this.topoTmpData = null;//拓扑图编辑临时数据
        this.topoOperateBtns = null;//拓扑图操作按钮组
        if(!ef.util.isFirefox()){
            $("#browser").css({"margin-top":"-50px"});
        }

        $("#hostTitle").append(ef.util.getLocale("setting.project.detail.host"));
        $("#description").append(ef.util.getLocale("setting.project.detail.description"));
        $("#quota").append(ef.util.getLocale("setting.project.detail.quota"));
        $("#network1").append(ef.util.getLocale("setting.project.detail.network"));
        $("#user").append(ef.util.getLocale("setting.project.detail.user"));
        $("#usernamefield").append(ef.util.getLocale('setting.project.detail.description.usernamefield') + '：');
        $("#remarkfield").append(ef.util.getLocale('setting.project.detail.description.remarkfield') + '：');
        $("#corefield").append(ef.util.getLocale('setting.project.detail.quota.corefield') + '：');
        $("#memofield").append(ef.util.getLocale('setting.project.detail.quota.memofield') + '：');
        $("#diskfield").append(ef.util.getLocale('setting.project.detail.quota.diskfield') + '：');
        $("#backfield").append(ef.util.getLocale('setting.project.detail.quota.backfield') + '：');
        $(".inputwu").val(ef.util.getLocale("setting.project.detail.quota.input.inputwu"));
        $(".ge").append(ef.util.getLocale("setting.project.detail.quota.ll.ge"));
        $(".GB").append(ef.util.getLocale("cal.host.GB"));
        $("#ac_control").append(ef.util.getLocale("framework.component.nav.security.group.label"));
        if(user.isTenant()){
            $("#dialog-table-zj").text(ef.util.getLocale('setting.project.detail.host.blocklistlabel.disable'));
            $(".safe").text(ef.util.getLocale('setting.project.detail.host.blocklistlabel.disable'));
        }else{
            $("#dialog-table-zj a").text(ef.util.getLocale('setting.project.detail.host.blocklistlabel.dialogtablezj'));
            $(".safe a").append(ef.util.getLocale('setting.project.detail.network.blocklistlabel.safe'));
        }
        $("#dialog-table-ten a").append(ef.util.getLocale('setting.project.detail.user.blocklistlabel.dialogtableten'));
        $("#dialog-table-control a").append(ef.util.getLocale('setting.project.detail.control.blocklistlabel.dialogtablecontrol'));
        $("#js-menus-wrapper").iconmenu([
            {
                iconClass: "icon-menus-icon-back",
                tip: ef.util.getLocale('framework.component.iconmenu.back.tip'),//"返回",
                "access": [8, 9, 10, 88,7],
                click: function () {
                    ef.nav.goto("tenant.html", "setting.project");
                }
            }
        ]);
        $("#hostTitle").append("<span class='datacenter'>"+ef.util.getLocale("setting.project.detail.datacenter")+"</sapn>");
        $("#quota").append("<span class='datacenter'>"+ef.util.getLocale("setting.project.detail.datacenter")+"</span>");
        $("#network1").append("<span class='datacenter'>"+ef.util.getLocale("setting.project.detail.datacenter")+"</span>");
        $("#ac_control").append("<span class='datacenter'>"+ef.util.getLocale("setting.project.detail.datacenter")+"</span>");
        $("#subnet-search").combobox({
            prompt:"请选择所在网络",
            textField:"name",
            valueField:"id",
            editable:false,
            onChange: function (newValue) {
                implement.subnetFilter(newValue);
            }
        });
        $("#subnet-search-name").textbox({
            prompt: "请输入名称",
            iconCls:'icon-search',
            iconAlign:'left',
            valueField: 'value',
            onChange: function (newValue,oldValue) {
                implement.subnetFilter(newValue);
            }
        });
        $("#reset").click(function () {
            $("#subnet-search").combobox('clear');
            $("#subnet-search-name").textbox('clear');
            $("#tenantDetail-subnet-list").datagrid('loadData',implement.Vlan);//implement.subnetResponse
        });
        ef.getJSON({
            url:api.getAPI("network.vlan.datagrid_vlan"),
            type:"get",
            success: function (response) {
                $("#subnet-search").combobox({data:response});
            }
        });
    };
    implement.getFormatSendHosts = function (data) {
        var result = [];
        $(data).each(function (i, il) {
            var item = {id: ""};
            item.id = il.id;
            result.push(item);
        });
        return result;
    };
    implement.addListener = function (id,isForce) {
        //this.removeListener();
        //ef.event.on("selectIpListEvent", function (event, data) {  //监听的自定义事件
        //    var vlanIps = data.ip.getIpsJustSelected();//获取ip范围数组，只有selected状态的 全地址
        //    var vlanId = data.param.data.id;
        //    var tenantId = implement.pageData.id;
        //    console.log("tenantId", tenantId);
        //    implement.setProjectVlanIp(vlanId, vlanIps, tenantId, implement.isForce, function () {
        //        ef.Dialog.close("getIpList");
        //    });
        //});
    };
    implement.removeListener = function () {
        ef.event.off("selectIpListEvent"); //取消的自定义事件
        ef.event.off("selectHostListEvent");
    };
    /**修改项目下vlan的ip*/
    implement.setProjectVlanIp = function (vlanId, vlanIps, tenantId, isForce, callback) {
        if (ef.config.isServer || isForce) {
            ef.getJSON(
                {
                    url: api.getAPI("order.wait.Detail.combo.ip") + "/" + vlanId + "/tenant/" + tenantId + "/ips",
                    type: "post",//get,post,put,delete
                    isForce: isForce,
                    data: {
                        "ips": vlanIps
                    },
                    success: function (response) {
                        if (callback) {
                            callback(response);
                        }
                    },
                    error: function (error) {
                        console.log(error);
                    }
                });
        }
    };
    /**获取项目下的vlan*/
    implement.getProjectVlan = function (tenantId, isForce, callback ,errorCallback) {
        ef.getJSON(
            {
                url: api.getAPI("subnets"),
                type: "get",//get,post,put,delete
                isForce: isForce,
                data: {
                    tenant: tenantId
                },
                success: function (response) {
                    if (callback) {
                        callback(response);
                    }
                },
                error: function (error) {
                    if(errorCallback){errorCallback();}
                }
            });
    };
    implement.hostWebSocket = function () {
        if(implement.socket &&
            implement.socket.socket &&
            implement.socket.socket.readyState == 1){
            implement.socket.send(JSON.stringify({id:implement.pageData.id}));
        }
        implement.socket.onmessage = function(data){
            var dataRows = $('#tenanthostList').datagrid('getData').originalRows;
            var useData = JSON.parse(data.data);
            console.log(useData);
           if(useData.response=="refresh"){
               implement.host_datagrid();
                return;
            };
            $(dataRows).each(function (i,il) {
                for(var e in useData.response){
                        if(il.id==e){
                            il.status = useData.response[e];
                        }
                }
            });
            var num=$('#tenanthostList').datagrid("options").pageNumber;
            //$('#tenanthostList').datagrid({loadData:dataRows});
            $('#tenanthostList').datagrid('loadData',dataRows).datagrid('goto',num);
        };
    };
    /**增加topo的点击事件侦听*/
    implement.addTopoListener = function () {
        console.log("xxxxx","addListener",implement.topo);
        implement.topo.click(function (event) {
            console.log(event.data,implement.topo.isEdit,event.data.selected);
            switch (event.targetIndex) {
                case 1:
                {
                    ef.getJSON({
                        url:api.getAPI("subnet")+"/"+event.data.id,
                        type:"get",
                        success: function (result) {
                            result.isFilter = true;
                            //过滤掉自己的占用变为已选
                            $(result.ips).each(function (i, il) {
                                if (il.tenant && il.tenant.id) {
                                    if (il.tenant.id == implement.pageData.id) {
                                        if(!il.vm)
                                        {
                                            delete il.tenant;
                                        }
                                        il.isSelf = true;
                                    }
                                }
                            });
                            var res = ef.util.copyDeepProperty(result);
                            var _isEdit=implement.topo.isEdit;
                            new ef.Dialog("getIpList", {
                                param: {
                                    id: event.targetIndex,
                                    relation: event.data.relation,
                                    data: event.data,
                                    isEdit: _isEdit&&event.data.selected
                                },
                                title: ef.util.getLocale("setting.project.detail.network.alert.IP"),//ip列表
                                width: 700,
                                height: 497,
                                closed: false,
                                cache: false,
                                nobody: false,
                                href: "views/ip_list2.html",
                                modal: true,
                                onResize: function () {
                                    $(this).dialog('center');
                                },
                                onLoad: function () {
                                    //result.ips= _.filter(result.ips,function(item) //遍历list中的每个值，返回包含所有通过predicate真值检测的元素值
                                    //{
                                    //    if(item.dhcp||item.gateway)return false;
                                    //    if(_isEdit)
                                    //    {
                                    //        return item.isSelf||(!item.isSelf&&(!item.tenant||!item.tenant.id)&&(!item.vm));
                                    //    }
                                    //    return item.isSelf;
                                    //});
                                    ef.localStorage.put("projectDetail.id",implement.pageData.id);
                                    ip.redraw(event.data);
                                    //console.log(ip);
                                },
                                onClose: function () {
                                    ef.event.off("clickIpEditEvent");
                                    require.undef('setting.project.ip');
                                }
                            });
                            //ef.event.on("clickIpEditEvent", function (e,data) {
                            //    $("#bar_ip_box").empty();
                            //    res.ips= _.filter(res.ips,function(item)
                            //    {
                            //        return item.isSelf||(!item.isSelf&&(!item.tenant||!item.tenant.id)&&(!item.vm));
                            //    });
                            //    var _ipSave = $("#bar_ip_box").ip(res,{isOptimize:true,isEdit:true});
                            //    ef.localStorage.put("project.ip.ipSave",_ipSave);
                            //    _ipSave.setMode(true);
                            //    _ipSave.change(function () {
                            //        data.params.setStatus(2,false);
                            //    })
                            //});
                        }
                    });
                    break;
                }
                case 0:
                {
                    new ef.Dialog("getHostList", {
                        param: {
                            id: event.targetIndex,
                            relation: event.data.relation,
                            data: event.data,
                            isEdit: implement.topo.isEdit && event.data.selected
                        },
                        title: ef.util.getLocale("setting.project.detail.network.alert.host"),
                        width: 700,
                        height: 497,

                        closed: false,
                        cache: false,
                        nobody: false,
                        href: "views/host_list2.html",
                        modal: true,
                        onResize: function () {
                            $(this).dialog('center');
                        },
                        onLoad: function () {
                            ef.localStorage.put("project.vlan",event.data.network_id);
                            ef.localStorage.put("project.subnet",event.data.id);
                            ef.localStorage.put("projectDetail.id",implement.pageData.id);
                            require(['setting.project.host'], function (host) {
                                host.redraw();
                            });
                        },
                        onClose: function () {
                            require.undef('setting.project.host');
                        }
                    });
                    break;
                }
            }
            implement.topoOperateBtns.setStatus(2,false);
        });
    };
    implement.tableTenant = function () {
        $('#tenantuserlist').datagrid(
            {
                singleSelect: true,
                pagination: true,
                emptyText:"暂无数据",
                onEmptyTextClick:function()
                {
                    console.log("empty");
                },
                columns: [
                    [
                        {field: "name", width: "19%", title: ef.util.getLocale('setting.user.datagrid.uid'),
                            formatter: function(val) {
                                if(val){
                                    return '<div>' + val +'</div>'
                                }else{
                                    return '<div>-</div>'
                                }
                            }
                        },
                        {field: "displayname", width: "19%", title: ef.util.getLocale('setting.user.datagrid.name'),
                            formatter: function(val) {
                                if(val){
                                    return '<div>' + val +'</div>'
                                }else{
                                    return '<div>-</div>'
                                }
                            }
                        },
                        {field: "uRole", width: "20%", title: ef.util.getLocale('setting.project.detail.user.datagrid.proname'), formatter: function (val, row) {
                            /*return role.getRole(val).label;*/
                            if(val=="user"){
                                return "普通用户";
                            }else if(val=="tenant_admin"){
                                return "项目管理员";
                            }
                        }},
                        {field: "email", width: "22%", title: ef.util.getLocale('setting.project.detail.user.datagrid.email'),
                            formatter: function(val) {
                                if(val){
                                    return '<div>' + val +'</div>';
                                }else{
                                    return '<div>-</div>'
                                }
                            }
                        },
                        {field: "phone", width: "22%", title: ef.util.getLocale('setting.project.detail.user.datagrid.tel'),formatter:function(val,row){
                            if(!val){
                                return "<div>-</div>";
                            }
                            return '<div>' + val +'</div>';
                        }}
                        /*{field: "security", width: "16%", title: ef.util.getLocale('setting.project.detail.user.datagrid.secrets'), formatter: function (val, row) {
                     return security.getSecurityByValue(val).label;
                     }}*/
                    ]
                ]
            });
        $("#tenantDetail-subnet-list").datagrid({
            singleSelect: false,
            pagination: true,
            columns:[[
                {field:'ck',checkbox:true,width:'10%'},
                {field:'name',title:'名称',width:'20%',
                    formatter: function(val) {
                        if(val){
                            return '<div>' + val +'</div>'
                        }else{
                            return '<div>-</div>'
                        }
                    }
                },
                {field:'cidr',title:'CIDR',width:'20%',
                    formatter: function(val) {
                        if(val){
                            return '<div>' + val +'</div>'
                        }else{
                            return '<div>-</div>'
                        }
                    }
                },
                {field:'gateway',title:'网关',width:'20%',
                    formatter: function(val) {
                        if(val){
                            return '<div>' + val +'</div>'
                        }else{
                            return '<div>-</div>';

                        }
                    }
                },
                {field:'dns',title:'DNS',width:'20%',formatter: function (val,row) {
                    if(val.length==0){return "<span style='padding-left: 5px;'>-</span>";}
                    var dom = $('<span></span>');
                    dom.text(val.join(','));
                    dom.attr({title:val.join(',')});
                    return dom;
                }},
                {field:'network_name',title:'所在网络',width:'20%',
                    formatter: function(val) {
                        if(val){
                            return '<div style="padding-left: 4px;">' + val +'</div>'
                        }else{
                            return '<div style="padding-left: 4px;">-</div>'
                        }
                    }
                }
            ]]
        });
        $("#tenantDetail-subnet-list").datagrid('loading');
    };
    implement.dataControl=function(){//获取访问控制列表数据
        console.log(ef.localStorage.get("setting.project.Detail.id"));
        ef.getJSON({
            url:api.getAPI("cal.security.group.list")+"?tenant_id="+ef.localStorage.get("setting.project.Detail.id"),
            type:"get",
            useLocal:false,
            success:function(response){
                var a=1;
                if (response.length!=0) {
                    $("#dialog-table-control").hide();
                    $(".ac_control").show();
                }
                else {
                    $("#plain-datagrid-control").hide();
                    $(".ac_control").hide();
                    $("#dialog-table-control").show().click(function () {
                        $("#dialog-table-control").hide();
                        $(".ac_control").show();
                        $("#plain-datagrid-control").show();
                        implement.ac_control();
                    });
                }
                //console.log(response);
                ef.localStorage.put("tenant_control_rules",response);
                $('#tenantcontrollist').datagrid({data:response}).datagrid("clientPaging");
            },
            error:function(){}
        });
    };
    implement.ac_control=function(){//访问控制列表
        $('#tenantcontrollist').datagrid(
            {
                singleSelect: true,
                pagination: true,
                emptyText:"暂无数据",
                onEmptyTextClick:function()
                {
                    console.log("empty");
                },
                columns: [[
                    {
                        field: "direction",
                        width: "20%",
                        title:ef.util.getLocale("security.group.direction.label"),
                        formatter:function(val,row)
                        {
                            return '<div>' +ef.util.getLocale("security.group.grid.direction."+val)+'</div>';
                        }
                    },
                    {
                        field: "ethertype",
                        width: "20%",
                        title:ef.util.getLocale("security.group.ethertype.label"),
                        formatter: function(val) {
                            if(val){
                                return '<div style="padding-left: 0px">' + val +'</div>';
                            }else{
                                return '<div style="padding-left: 0px">-</div>'
                            }
                        }
                    },
                    {
                        field: "protocol",
                        width: "20%",
                        title:ef.util.getLocale("security.group.protocol.label"),
                        formatter:function(val,row)
                        {
                            return val==null?ef.util.getLocale("security.group.grid.any"):String(val).toUpperCase();
                        }
                    },
                    {
                        field: "port_range",
                        width: "20%",
                        title:ef.util.getLocale("security.group.port_range.label"),
                        formatter:function(val,row)
                        {
                            return val==null?ef.util.getLocale("security.group.grid.any"):val;
                        }
                    },
                    {
                        field: "cidr",
                        width: "22%",
                        title:ef.util.getLocale("security.group.cidr.label"),
                        formatter: function(val) {
                            if(val){
                                return '<div>' + val +'</div>';
                            }else{
                                return '<div>-</div>'
                            }
                        }
                    }
                ]]
            }).datagrid("clientPaging");
    };
    implement.leftTop = function (name,remarkVal) {
        $("#username").textbox({
            maxlength:15,
            required:true,
            validType: 'whitelist["0-9a-zA-Z_\u4E00-\u9FA5","中文,字母,下划线和数字"]',
            disabled:true,
            value:name
        });
        $("#tdname .textbox").css({border:"none"});
        if(!remarkVal){
            $("#remark").val("-");//相当于描述
        }else{
            $("#remark").val(remarkVal);//相当于描述
        }
        $("#remark").css("border","none").attr("disabled",true);
        var remark,username;
        if (user.isSys()||user.isSuper()) {//权限系统管理
            var _LleftBtns = $(".lefticons").togglebutton([
                [
                    {
                        iconClass: "icon-menus-icon-edit",
                        tip: ef.util.getLocale("setting.project.edit.tip"),
                        click: function () {
                            _LleftBtns.setStatus("2",true);
                            _LleftBtns.goto(1);
                            $("#username").textbox({disabled:false});
                            $("#tdname .textbox").css({"border":"1px solid #aaa","width":"185px"});
                            $("#remark").css({"border":"1px solid #aaa"}).attr("disabled",false);
                            if($("#remark").val() == '-'){
                                $("#remark").val('');
                            }
                        }
                    }
                ],
                [
                    {
                        iconClass: "icon-menus-icon-save",
                        id:"2",
                        tip: ef.util.getLocale("setting.project.save.tip"),
                        click: function () {
                            if(!$("#username").textbox("isValid")){return;}
                            ef.loading.show();
                                ef.getJSON(
                                    {
                                        url: api.getAPI("setting.project.datagrid_project") + "/" + implement.pageData.id,
                                        type: "POST",//get,post,put,delete
                                        data:{
                                            "name": $("#username").textbox('getValue'),
                                            "description": $("#remark").val()
                                        },
                                        success: function (response) {
                                            $("#username").textbox({disabled:true});
                                            $("#tdname .textbox").css({border:"none"});
                                            remark = $("#remark").val();
                                            username = $("#username").textbox('getValue');
                                            implement.pageData.name=username;
                                            remarkVal=remark;
                                            if(!remarkVal || remarkVal == '' || remarkVal == null){
                                                $("#remark").val("-");//相当于描述
                                            }else{
                                                $("#remark").val(remarkVal);//相当于描述
                                            }
                                            _LleftBtns.goto(0);
                                            $("#remark").attr("disabled",true).css("border","none");
                                            ef.loading.hide();
                                        },
                                        error: function (error) {
                                            ef.loading.hide();
                                        }
                                    });
                       }
                    },
                    {
                        iconClass: "icon-menus-icon-cancel",
                        tip: ef.util.getLocale("setting.project.cancel.tip"),
                        click: function () {
                            $("#username").textbox({disabled:true});
                            $("#tdname .textbox").css({border:"none"});
                            if(remark){
                              $("#username").textbox('setValue',username);
                              $("#remark").val(remark);
                            }
                            else{
                                $("#username").textbox('setValue',implement.pageData.name);
                               $("#remark").val(remarkVal);
                            }
                            if($("#remark").val() == null || $("#remark").val() == ''){
                                $("#remark").val('-');
                            }
                           $("#remark").attr("disabled",true).css("border","none");
                            _LleftBtns.goto(0);
                        }
                    }
                ]
            ]).setStatus("2",true);
           $("#remark").keydown(function () {
               _LleftBtns.setStatus("2",false);
            });
            $("#username").textbox({
               onChange: function () {
                   _LleftBtns.setStatus("2",false);
               }
            });
        }
    };
    implement.getQuotaInfo = function (id,callback) {
        ef.getJSON(   //查询
            {
                url: api.getAPI("setting.project.datagrid_project") + "/" + id+"/quota",
                type: 'get',
                success: function (response) {
                    callback(response);
                }
            });
    };
    implement.rightTop = function (data) {
        $(".check").each(function () {
            this.checked="checked";  //选中的复选框
        });
        var me;
        for(var i in data){
            $(".right-palin-table td").find("#"+i).parent().show();//
            $(".right-palin-table td").find("#unlimit_"+i).hide();//无限制隐藏
            $(".right-palin-table td").find("#"+i).empty().numberspinner({ value:data[i],min:0,disabled:true,max:99999});
            if(data[i]==-1){
                $(".right-palin-table td").find("#"+i).parent().hide();
                $(".right-palin-table td").find("#unlimit_"+i).show();
                $(".right-palin-table td").find("#"+i).parent().prev().attr("checked",false);
            }
        }
    };
    implement.numberCss = function () {
        $(".check").hide();
        $(".right-tenante-table .textbox.spinner").css({"border":"none"});
        $(".number").numberspinner({disabled:true});
};
    //子网列表
    implement.subnetTable = function (success,error) {
        ef.getJSON({
            url:api.getAPI("subnets"),
            type:"get",
            success: success,
            error:error
        });
    };
    //子网过滤查询
    implement.subnetFilter = function () {
        //ef.getJSON({
        //    url:api.getAPI("subnets"),
        //    type:"get",
        //    data:{network_id:id},
        //    success: function (response) {
        //        $("#tenantDetail-subnet-list").datagrid('loadData',response).datagrid('goto',1);
        //    }
        //});
        var name = $("#subnet-search-name").textbox('getValue');
        var id = $("#subnet-search").combobox('getValue');
        $('#tenantDetail-subnet-list').datagrid({
            loadFilter: function(data){
                var tmp = {total:0,rows:[]};
                $(data).each(function (i,il) {
                    if(!name){name = il.name.toLowerCase();}
                    if(!id){id = il.network_id;}
                    if(il.name.toLowerCase().indexOf(name)!=-1&&il.network_id==id){//过滤项和输入框匹配
                        tmp.total = tmp.total+1;
                        tmp.rows.push(il);
                    }
                    name = $("#subnet-search-name").textbox('getValue').toLowerCase();
                    id =  $("#subnet-search").combobox('getValue');
                });
                return tmp;
            }
        });
    };
    implement.redraw = function () {
        this.addListener();
        domReady(function () {
            //项目vlan
            ef.util.ready(function (dom) {
                implement.init();
                implement.tableTenant();
                implement.host_table();
                implement.ac_control();
                implement.pageData = dom.data("pageData");
                implement.pageData = ef.util.unescapeJSON(implement.pageData);
                if (implement.pageData) {
                    implement.pageData = JSON.parse(implement.pageData);
                }
                ef.localStorage.put("setting.project.Detail.id", implement.pageData.id);
                implement.dataControl();
                implement.host_datagrid();
                var _stack=$(".viewstack-box-tenantDetail").viewstack();
                implement.topoOperateBtns = $(".descriptBtns").togglebutton([
                            [
                                {
                                    iconClass: "icon-menus-icon-save",
                                    tip: ef.util.getLocale("setting.project.save.tip"),
                                    id:"2",
                                    access:[8,88],
                                    click: function () {
                                        implement.Vlan = ef.util.getTablePageData($("#tenantDetail-subnet-list"),implement.pageData);
                                        var dataid = [];
                                        _.each(implement.Vlan, function(il, i){
                                                if( il  instanceof Object){
                                                    dataid.push(il.id);
                                                }
                                        });
                                        implement.topoTmpData = ef.util.map(implement.subnetResponse, function (il) {
                                            if (il.checked && il.checked == true && dataid.indexOf(il.id)=== -1) {
                                                dataid.push(il.id);
                                            }
                                        });
                                        ef.loading.show();
                                        //var data = $("#tenantDetail-subnet-list").datagrid('getChecked');  implement.subnetResponse
                                        //implement.topoTmpData = ef.util.without(implement.subnetResponse,null);
                                        implement.setProjectVlan(ef.localStorage.get("setting.project.Detail.id"), dataid,function(){
                                            ef.loading.hide();
                                            ef.nav.reload();
                                            ef.placard.tick(ef.util.getLocale("setting.project.placard.editvlan"));
                                        }, function () {
                                            ef.loading.hide();
                                            ef.nav.reload();
                                        });
                                    }
                                },
                                {
                                    iconClass: "icon-menus-icon-cancel",
                                    tip: ef.util.getLocale("setting.project.cancel.tip"),
                                    access:[8,88],
                                    click: function () {
                                        _stack.goto(1);
                                        implement.topo.clear();
                                        implement.getProjectVlan(implement.pageData.id, implement.isForce, function (cancelResponse) {
                                            if(cancelResponse.length==0){
                                                $("#browser").hide();
                                                _stack.goto(0);
                                                return;
                                            }
                                            implement.setSelectData(cancelResponse);
                                            if(implement.topoTmpData==null){
                                                implement.topo = $(".topo-box").topo(ef.util.copyDeepProperty(networkTopo.getFormatTopoData(cancelResponse)));
                                            }
                                            else{
                                                implement.topo = $(".topo-box").topo(implement.topoTmpData);
                                            }
                                            implement.topo.setMode(false);
                                            implement.topo.isSelect = false;
                                            implement.addTopoListener();
                                        });
                                        implement.topoOperateBtns.goto(1);
                                    }
                                }
                            ],
                            [
                                {
                                    iconClass: "icon-menus-icon-edit",//编辑
                                    tip: ef.util.getLocale("setting.project.edit.tip"),
                                    access:[8,88],
                                    click: function () {
                                        implement.topoOperateBtns.setStatus(2,true);
                                        implement.topoOperateBtns.goto(0);
                                        _stack.goto(2);
                                        implement.subnetTable(function (response) {
                                            implement.getProjectVlan(implement.pageData.id, implement.isForce, function (cancelResponse) {
                                                $(cancelResponse).each(function (i,il) {
                                                    $(response).each(function (e,el) {
                                                        if(il.id == el.id){
                                                            el.checked = true;
                                                        }
                                                    })
                                                });
                                                $("#tenantDetail-subnet-list").datagrid({
                                                    data:response,
                                                    onCheck:function(rowIndex,rowData)
                                                    {
                                                        rowData.checked = true;
                                                        implement.topoOperateBtns.setStatus(2,false);
                                                    },
                                                    onUncheck: function (rowIndex,rowData) {
                                                        rowData.checked = false;
                                                        implement.topoOperateBtns.setStatus(2,false);
                                                    },
                                                    onCheckAll: function (rows) {
                                                        $(rows).each(function (i,il) {
                                                            il.checked = true;
                                                        });
                                                        implement.topoOperateBtns.setStatus(2,false);
                                                    },
                                                    onUncheckAll: function (rows) {
                                                        $(rows).each(function (i,il) {
                                                            il.checked = false;
                                                        });
                                                        implement.topoOperateBtns.setStatus(2,false);
                                                    }
                                                }).datagrid("clientPaging",{
                                                    onBeforePage: function (num, size, data) {
                                                        implement.pageData = data;
                                                    }
                                                });
                                                implement.subnetResponse = response;
                                            });
                                        });
                                    }
                                }
                            ]
                        ], true);
                implement.topoOperateBtns.goto(1);
                implement.getProjectVlan(implement.pageData.id, implement.isForce, function (response) {
                    if(response.length==0){$("#browser").hide();}
                    if(response.length!=0){
                        _stack.goto(1);
                    }
                    implement.topo = $(".topo-box").topo(ef.util.copyDeepProperty(networkTopo.getFormatTopoData(response)));
                    implement.topo.setMode(false);
                    implement.topo.isSelect = false;
                    implement.addTopoListener();
                    if(user.isSys()||user.isSuper()){
                        $(".safe a").click(function () {
                            $("#browser").show();
                            implement.topoOperateBtns.setStatus(2,true);
                            implement.topoOperateBtns.goto(0);
                            _stack.goto(2);
                            implement.subnetTable(function (response) {
                                $("#tenantDetail-subnet-list").datagrid({
                                    data:response,
                                    //onClickRow: function (rowIndex, rowData) {
                                    //    if(rowData.checked&&rowData.checked==true){
                                    //        rowData.checked=false;
                                    //        $("#tenantDetail-subnet-list").datagrid('uncheckRow',rowIndex);
                                    //    }
                                    //},
                                    onCheck:function(rowIndex,rowData)
                                    {
                                        rowData.checked = true;
                                        implement.topoOperateBtns.setStatus(2,false);
                                    },
                                    onUncheck: function (rowIndex,rowData) {
                                        rowData.checked = false;
                                        implement.topoOperateBtns.setStatus(2,false);
                                    },
                                    onCheckAll: function (rows) {
                                        $(rows).each(function (i,il) {
                                            il.checked = true;
                                        });
                                        implement.topoOperateBtns.setStatus(2,false);
                                    },
                                    onUncheckAll: function (rows) {
                                        $(rows).each(function (i,il) {
                                            il.checked = false;
                                        });
                                        implement.topoOperateBtns.setStatus(2,false);
                                    }
                                }).datagrid("clientPaging",{
                                    onBeforePage: function (num, size, data) {
                                        implement.pageData = data;
                                    }
                                });
                                implement.subnetResponse = response;
                            });
                        });
                    }
                });
                //左上角
                implement.getTenantInfo(implement.pageData.id,true, function (response) {
                    var name,remark;
                    $(response).each(function (i,il) {
                        name = il.name;
                        remark = il.description;

                    });
                    implement.leftTop(name,remark);
                },function(){});
                //右上角
                var save= {cores:"",memory:"",disks:"",disk_capacity:"",snapshots:"",snapshot_capacity:""};
                var saveOth = save;
                implement.getQuotaInfo(implement.pageData.id,function (response) {
                    implement.numberCss();
                    for(var i in saveOth){
                        $(response).each(function (e,el) {
                           if(i==el.quota_name){
                               save[i] = el.quota_limit;
                               if(el.quota_name == "memory"&&el.quota_limit!=-1){
                                       save["memory"] = Number(el.quota_limit)/1024;
                               }
                           }
                        });
                    }
                    implement.rightTop(saveOth);
                    $(".number").numberspinner({
                        onChange: function (newValue,oldValue) {
                            if(newValue!=oldValue&&oldValue!=-1){
                                _rightIcons.setStatus("6",false);
                            }
                            //if(Math.abs(Number(newValue).toFixed(0))!=Math.abs(Number(oldValue).toFixed(0))){ _rightIcons.setStatus("2",false);}
                        }
                    });
                    $(".right-palin-table .textbox-addon").hide();
                });
                if(user.isSys()||user.isSuper()){
                    var _rightIcons = $(".quotaOp").togglebutton([
                        [
                            {
                                iconClass: "icon-menus-icon-edit",
                                tip: ef.util.getLocale("setting.project.edit.tip"),
                                click: function () {
                                    $(".right-palin-table .textbox-addon").show();
                                    _rightIcons.setStatus("6",true);
                                    $(".check").show();
                                    //_rightIcons.setStatus("2",true);
                                    $(".right-tenante-table .textbox.spinner").css({"border-bottom":"1px solid #999"});
                                    $(".number").numberspinner({disabled:false});
                                    $(".textbox-addon-right").show();
                                    _rightIcons.goto(1);
                                    $(".check").click(function () {
                                        if($(this).is(":checked")){
                                            $(this).siblings(".numberSpi").find('input').val(0);
                                            $(this).siblings(".unlimited").hide();
                                            $(this).siblings(".numberSpi").show();
                                        }
                                        else{
                                            $(this).siblings(".unlimited").show();
                                            $(this).siblings(".numberSpi").hide();
                                        }
                                    });
                                }
                            }
                        ],
                        [
                            {
                                iconClass: "icon-menus-icon-save",
                                tip: ef.util.getLocale("setting.project.save.tip"),
                                id: "6",
                                click: function () {
                                    var arr=[];
                                    for (i in save) {
                                        var quotaOver = {"quota_name": "", "quota_limit": ""};
                                        quotaOver.quota_name = i;
                                        var bool = $(".right-palin-table td").find("#" + i).parent().prev().is(":checked");
                                        if (bool) {
                                           var memory = Number($("#memory").numberspinner('getValue'));
                                           save[i] = quotaOver.quota_limit = Number($(".right-palin-table td").find("#" + i).numberspinner('getValue'));
                                           save["memory"] = quotaOver.quota_name["memory"] = $("#memory").numberspinner('getValue');
                                            if(quotaOver.quota_name=="memory"){
                                                quotaOver.quota_limit=memory*1024;
                                            }
                                        }
                                        else {
                                           save[i] = quotaOver.quota_limit = -1;
                                        }
                                        if(!$("#chmemo").is(':checked')){
                                            save['memory']=-1;
                                        }
                                        arr.push(quotaOver);
                                    }
                                    ef.loading.show();
                                    ef.getJSON(
                                        {
                                            url: api.getAPI("setting.project.datagrid_project") + "/" + implement.pageData.id + "/quota",
                                            type: "post",//get,post,put,delete
                                            isForce: true,
                                            data: arr,
                                            success: function (response) {
                                                saveOth = save;
                                                implement.numberCss();
                                                ef.loading.hide();
                                                _rightIcons.goto(0);
                                                implement.rightTop(save);
                                                $(".right-palin-table .textbox-addon").hide();
                                            },
                                            error: function () {
                                                ef.loading.hide();
                                            }
                                        });
                                }
                            },
                            {
                                iconClass: "icon-menus-icon-cancel",
                                tip: ef.util.getLocale("setting.project.cancel.tip"),
                                click: function () {
                                    implement.rightTop(saveOth);
                                    _rightIcons.goto(0);
                                    implement.numberCss();
                                    //$("#memory").numberspinner('setValue',saveOth["memory"]/1024);
                                    $(".right-palin-table .textbox-addon").hide();
                                }
                            }
                        ]
                    ]);
                    $(".check").click(function () {
                       _rightIcons.setStatus("6",false);
                    });
                }
                implement.tenantDetail(implement.pageData.id,true);
                function deleteRow(userid) {
                    var deluser = $.param({users:userid});
                        ef.getJSON(
                            {
                                url: api.getAPI("setting.project.datagrid_project") + "/" + implement.pageData.id + "/users" + "?" + deluser,
                                type: 'delete',
                                isForce: true,
                                success: function (response) {
                                  implement.tenantDetail(implement.pageData.id,false);
                                 // ef.nav.reload();
                                },
                                error: function (error) {
                                    ef.loading.hide();
                                }
                            });
                }
                if(user.isSys()||user.isSuper()){
                    $("#dialog-table-ten").click(function () {
                        implement.addDialog();
                    });
                }
                //主机按钮
                var host_button=$(".zj_control").togglebutton([
                    [
                        {
                            iconClass: "icon-menus-icon-add",
                            tip: ef.util.getLocale("setting.project.add.tip"),
                            "access": [9, 88,8],
                            click: function () {
                                implement.addhostDialog();
                            }
                        },
                        {
                            iconClass: "icon-menus-icon-delete",
                            tip: ef.util.getLocale("global.button.remove.label"),
                            "access": [9, 88,8],
                            "id":2,
                            click: function(){
                                var row=$('#tenanthostList').datagrid('getSelected');
                                var  hostName;
                                hostName=row.name;
                                if(row.vm_counts!=0||row.vd_counts!=0){
                                    return;
                                }
                                ef.messager.confirm('deleting', ef.util.getLocale('setting.project.deletedatagridok.tip')+ "'" +  hostName + "'？",null, function (ok) {
                                    if (ok) {
                                        implement.deleteHostRow();
                                        ef.loading.show();
                                    } else {
                                        $("#tenantuserlist").datagrid("uncheckAll");
                                    }
                                });
                            }
                        }
                    ]
                ]).setStatus(2,true);
                console.log(host_button);
                if(user.isSys()||user.isSuper()){
                    $("#dialog-table-zj").click(function () {
                        implement.addhostDialog();
                    });
                }
                $('#tenanthostList').datagrid({
                    onSelect:function(rowIndex,rowData){
                        if(rowData.vm_counts==0&&rowData.vd_counts==0){
                            host_button.setStatus(2,false);
                        }else{
                            host_button.setStatus(2,true);
                        }
                    }
                });

                var bottom = $(".bottom").togglebutton([
                    [
                        {
                            isToggle:true,
                            "access": [88,8],
                            click:function()
                            {

                            },
                            data:
                                [
                                    [
                                        {
                                            iconClass: "icon-menus-icon-tenant",//显示第图标css样式
                                            tip: ef.util.getLocale("setting.userdetail.description.role.tenant"),//提示文字
                                            click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                                var uselist = $("#tenantuserlist").datagrid('getChecked');
                                                var userRole,useId,setRole;
                                                if(uselist.length==0){
                                                    return
                                                }
                                                $(uselist).each(function (i,il) {
                                                    useId=il.id;
                                                    userRole = il.role;
                                                });
                                                var role=ef.util.property('name')(userRole);
                                                if(role=='user'){
                                                    setRole ='tenant_admin';
                                                    implement.setTenRole(implement.pageData.id,useId,setRole);
                                                    ef.placard.tick(ef.util.getLocale("setting.project.placard.topro"));
                                                }else if(role=='tenant_admin'){
                                                    setRole='user';
                                                    implement.setTenRole(implement.pageData.id,useId,setRole);
                                                    ef.placard.tick(ef.util.getLocale("setting.project.placard.totenant"));
                                                }
                                                menu.owner.owner.goto(1);
                                                console.log(setRole);
                                            }
                                        }
                                    ],
                                    [
                                        {
                                            iconClass: "icon-menus-icon-user",//显示第图标css样式
                                            tip: ef.util.getLocale("setting.userdetail.description.role.canceltenant"),//提示文字
                                            click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                                //console.log(menu);//输出{data:{当前数据,disable:false,dom:当前生成的dom节点,owner:IconMenus对象}}
                                                var uselist = $("#tenantuserlist").datagrid('getChecked');
                                                var userRole,useId,setRole;
                                                if(uselist.length==0){
                                                    return;
                                                }
                                                $(uselist).each(function (i,il) {
                                                    useId=il.id;
                                                    userRole = il.role;
                                                });
                                                var role=ef.util.property('name')(userRole);
                                                if(role=='user'){
                                                    setRole ='tenant_admin';
                                                    implement.setTenRole(implement.pageData.id,useId,setRole);
                                                    ef.placard.tick(ef.util.getLocale("setting.project.placard.topro"));
                                                }else if(role=='tenant_admin'){
                                                    setRole='user';
                                                    implement.setTenRole(implement.pageData.id,useId,setRole);
                                                    ef.placard.tick(ef.util.getLocale("setting.project.placard.totenant"));
                                                }
                                                menu.owner.owner.goto(0);
                                            }
                                        }
                                    ]
                                ]
                        },
                        {
                            iconClass: "icon-menus-icon-add",
                            tip: ef.util.getLocale("setting.project.add.tip"),
                            "access": [9, 88,8],
                            click: function () {
                                implement.addDialog();
                            }
                        },
                        {
                            iconClass: "icon-menus-icon-delete",
                            tip: ef.util.getLocale("global.button.remove.label"),
                            "access": [9, 88,8],
                            "id":2,
                            click: function () {
                                $("#hostlistBox").empty();
                                var dg = $("#tenantuserlist").datagrid('getSelections');
                                if (!dg.length) {
                                    $.messager.alert(ef.alert.warning, ef.util.getLocale("setting.project.deletedatagrid.tip"), 'warning');
                                    return;
                                }
                                var userid, username;
                                for (i = 0; i < dg.length; i++) {
                                    username = dg[i].name;
                                    userid = dg[i].id;
                                }
                               ef.messager.confirm('deleting', ef.util.getLocale('setting.project.deletedatagridok.tip') + "'" +username + "'？",null, function (ok) {
                                    if (ok) {
                                        deleteRow(userid);
                                        ef.loading.show();
                                        ef.placard.tick(ef.util.getLocale("setting.project.placard.deltenate"));
                                    } else {
                                        $("#tenantuserlist").datagrid("uncheckAll");
                                    }
                                });
                            }
                        }
                    ]
                  ]
                ).setStatus(2,true);

                console.log(bottom);
                $("#dialog-table-control").click(function () {
                    implement.addControl();
                });
                var ac_control = $(".ac_control").togglebutton([
                    [
                        {
                            iconClass: "icon-menus-icon-add",
                            tip: ef.util.getLocale("setting.project.add.tip"),
                            "access": [9, 88,8,7],
                            click: function () {
                                implement.addControl();
                            }
                        },
                        {
                            iconClass: "icon-menus-icon-delete",
                            tip: ef.util.getLocale("global.button.remove.label"),
                            "access": [9, 88,8,7],
                            "id":2,
                            click: function () {
                                ef.messager.confirm('deleting',ef.util.getLocale("security.group.rule.delete"),null,function(ok){
                                    if(ok)
                                    {
                                        implement.deleteRow();
                                    }
                                });
                             }
                        }
                    ]
                ]).setStatus(2,true);

                $('#tenantuserlist').datagrid({
                    onSelect: function(RowIndex,rowData) {
                      /*  bottom.menus[0].iconmenu.menus[0].setStatus(3,false);*/
                        bottom.setStatus(2,false);
                        var role,setRole,user_id;
                       if(user.isSuper()||user.isSys()){
                          $(rowData.role).each(function (i,il){
                              role=il.name;
                          });
                          if(role=="user"){
                              bottom.menus[0].iconmenu.menus[0].goto(0);
                          }
                          else if(role=="tenant_admin"){
                              bottom.menus[0].iconmenu.menus[0].goto(1);
                          }
                      }
                    }
                });
                $('#tenantcontrollist').datagrid({
                    onSelect:function(rowIndex,rowData){
                        ac_control.setStatus(2,false);
                    }
                });
               //$('#tenanthostList').datagrid({
               //    onSelect:function(rowIndex,rowData){
               //         /* 待写*/
               //    }
               //});
            });
        });
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});
