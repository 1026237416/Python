/**
 * Created by yezi on 2016/12/7.
 */
/**
 * Created by wangahui1 on 15/10/26.
 */
define(['user','domReady','easyui','clientPaging',"module","api","network.vlan"],function(user,domReady,easyui,clientPaging,module,api,networkVlan) {
    var implement = new ef.Interface.implement();
    var _data;
    //初始化表格
    implement.datagridInit = function () {
        $("#vlandetailhost_grid").datagrid({
            singleSelect:true,
            fitColumns:'true',
            pagination:true,
            pageSize:10,
            pageNumber:1,
            columns: [
                [
                    {field: "name", width: "22%", title: ef.util.getLocale('cal.vm.host.table.name'),
                        formatter: function(val) {
                            if(val){
                                return '<span style="padding-left: 1px;margin-top: 6px;">' + val +'</span>'
                            }else{
                                return '<span>-</span>'
                            }
                        }
                    },
                    {field: "ip", width: "22%", title: "IP",
                        formatter: function(val) {
                            if(val){
                                return '<span style="padding-left: 1px;margin-top:6px;">' + val +'</span>'
                            }else{
                                return '<span>-</span>'
                            }
                        }
                    },
                    {field: "cpus", width: "22%", title: ef.util.getLocale('order.ready.info.grid.head.quota'), formatter: function (val, row) {
                        return  val+"核"+Math.ceil(row.memory_mb/1024)+"GB";
                    }},
                    {field:'status',title:ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.atatusfield"),width:'22%',formatter: function (val,row) {
                        if(val=="available"){
                            return '<div style="margin-left:16px "><i class="icon-status-done-success hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.able")+'</span></div>'
                        }
                        else{
                            return '<div style="margin-left:16px "><i class="icon-status-done-fail hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.disable")+'</span></div>'
                        }
                    }},
                    {
                        field:"vm_counts",title:"云主机(个)",width:"22%",formatter:function(val,row){
                        return val?val:0;
                    }
                    }
                ]
            ]
        });
        $("#vlanDetailSubnet").datagrid({
            singleSelect: true,
            fitColumns: 'true',
            pagination: true,
            pageSize: 10,
            pageNumber: 1,
            resizeHandle:"left",
            columns: [[
                {
                    field: "name",
                    width: "13%",
                    title: ef.util.getLocale("network.vlan.datagrid.name"),
                    order: "asc",
                    align:"left",
                    resizable:true,
                    formatter: function (val, row) {
                        var _row = ef.util.escapeJSON(JSON.stringify(row));
                        return ' <a onclick="ef.nav.goto(\'subnetDetail.html\',\'network.subnetDetail\',\'' + _row + '\',null,\'network.vlan\')" class="table-link">' + val + '</a>';
                    }
                },
                {field: "cidr", width: "18%", align:"left",
                    resizable:true,title: ef.util.getLocale("network.vlan.datagrid.cidr"),
                    formatter: function(val) {
                        if(val){
                            return '<span style="padding-left: 1px">' + val +'</span>'
                        }else{
                            return '<span>-</span>'
                        }
                    }
                },
                {field: "gateway", align:"left",
                    resizable:true,width: "18%", title: ef.util.getLocale("network.vlan.datagrid.netgate"),
                    formatter: function(val) {
                        if(val){
                            return '<span style="padding-left: 1px;">' + val +'</span>'
                        }else{
                            return '<span>-</span>'
                        }
                    }
                },
                /*{field: "dhcp", width: "15%", title: "DHCP",
                 formatter: function(val) {
                 if(val){
                 return '<div">' + val +'</div>'
                 }else{
                 return '<div>-</div>'
                 }
                 }
                 },*/
                {
                    field: 'ocp',
                    width: "18%",
                    align:"left",
                    resizable:true,
                    title: ef.util.getLocale("network.vlan.datagrid.ipoccupy"),
                    formatter: function (val, row, index) {
                        return row.ip_use + "/" + row.ip_total;
                    }
                },
                {
                    field: "tenants",
                    width: "23%",
                    align:"left",
                    resizable:true,
                    title: ef.util.getLocale("setting.userdetail.datagrid.tenant"),
                    formatter: function (val, row) {
                        var dom = $('<div></div>');
                        var arrs = [];
                        $(val).each(function (i, il) {
                            arrs.push(il.name);
                        });
                        if(arrs.length==0){
                            dom.text("-");
                            return dom;
                        }
                        dom.text(arrs.join(","));
                        dom.attr({title:arrs.join(",")});
                        return dom;
                    }
                },
                {
                    field: "dns", align:"left",
                    resizable:true,formatter: function (val, row) {
                    var dom = $('<div></div>');
                    if(val.length==0){return dom.text("-");}
                    dom.text(val);
                    dom.attr({title:val});
                    return dom;
                }, title: ef.util.getLocale("network.vlan.datagrid.dns"), width: "20%"}
            ]]
        })
    };
    //初始化文本框
    implement.text = function (value) {
        $("#vlanDetailname").textbox({
            maxlength:15,
            required:true,
            disabled:true,
            value:value,
            validType: 'whitelist["0-9a-zA-Z_\u4E00-\u9FA5","中文,字母,数字和下划线"]'
        });
        $("#js-menus-wrapper").iconmenu([{
            iconClass: "icon-menus-icon-back",
            tip: ef.util.getLocale('framework.component.iconmenu.back.tip'),//"返回",
            "access":[8,9,10,88],
            click: function () {
                ef.nav.goto("netvlan.html","network.vlan");
            }
        }]);
    };
    //获取vlan下的主机
    implement.getVlanHosts=function(vlanId,success,error)
    {
        ef.getJSON(
            {
                url:api.getAPI("order.wait.Detail.combo.vlan")+"/"+vlanId+"/hosts",
                type:"get",//get,post,put,delete
                success:success,
                error:error
            });
    };
    //获取vlan下的子网
    implement.getVlanSubnet = function (vlanId,isFirst,error) {
        ef.getJSON(
            {
                url:api.getAPI("subnets"),
                type:"get",
                data:{network_id:vlanId},
                success: function (response) {
                    var vlangridname = [];
                    if(isFirst){
                        $("#vlanDetailSubnet").datagrid({data:response}).datagrid('clientPaging');
                    }
                    else{
                        $("#vlanDetailSubnet").datagrid('loadData',response).datagrid("goto",1);
                    }
                    var _name = $("#vlanDetailSubnet").datagrid('getRows');
                    $(_name).each(function (i, il) {
                        vlangridname.push(il.name);
                    });
                    ef.localStorage.put("vlanDetail.subnet.table.name", vlangridname);
                },
                error:error
            });
    };

    implement.netVlanSocket=function(){
        var dataRows=$('#vlandetailhost_grid').datagrid("getData").rows;
        if(!implement.socket)
        {
            implement.socket=new ef.server.Socket(api.getAPI("network.detail.socket",true),"network.detail.socket");
        }
        implement.socket.onopen = function(){
            var obj = {id:implement.id};
            implement.socket.send(JSON.stringify(obj));
        };
        implement.socket.onmessage=function(data){
            var usedata=JSON.parse(data.data);
            var type = usedata.type;
            switch (type){
                case 'vms':
                    if( usedata.response=="refresh"){
                        implement.getVlanHosts(_data.id,function (response) {
                            dataRows = response;
                            $("#vlandetailhost_grid").datagrid({data:response}).datagrid('clientPaging');
                        });
                        return;
                    }
                    $(dataRows).each(function(i,il){
                        for(var e in usedata.response){
                            if(il.id==e){
                                il.status=usedata.response[e];
                            }
                        }
                    });
                    $('#vlandetailhost_grid').datagrid('loadData',dataRows);
                    break;
                case 'state':
                    if(usedata.response=="quit"){
                        ef.nav.goto("netvlan.html", "network.vlan");
                        return;
                    }
                    if(usedata.response=="ACTIVE"){
                        $(".data_status").empty().append( '<span class="running" style="display:inline-block;"><i class="easyui-tooltip icon-state" style=" background-position: -812px -65px !important;height:16px;padding-bottom:3px;"></i><span class="host_status" style="top:-4px;left:-13px;">'+ef.util.getLocale('cal.hostalave.status.able')+'</span>');//运行
                    }
                    else{
                        $(".data_status").empty().append( '<span class="running" style="display:inline-block;"><i class=" easyui-tooltip icon-state" style="background-position: -812px -350px;height:16px;padding-bottom:3px;"></i><span class="host_status" style="top:-4px;left:-13px;">'+ef.util.getLocale('cal.hostalave.status.disable')+'</span>');//停止
                    }
                    break;
            }


        };
    };

    //页面重绘
    implement.redraw = function () {
        domReady(function(){
            //页面显示的部分
            implement.datagridInit();
            ef.util.ready(function(dom)
            {
                $("#description").append(ef.util.getLocale('network.vlanDetail.blocklistlabel.description'));
                $("#hostlist").append(ef.util.getLocale('network.vlanDetail.blocklistlabel.hostlist'));
                ef.localStorage.put("vlanDetail.data",dom.data("pageData"));
                _data=dom.data("pageData");
                _data=ef.util.unescapeJSON(_data);//解码
                _data=_data?JSON.parse(_data):null;
                var _descriptData=ef.util.copyProperty({},_data);//copy对象，浅拷贝
                var firstName;
                if(_data)
                {
                    for(var i in _data)
                    {
                        var _val=_data[i];
                        if(i=="status"){
                            if(_val=="ACTIVE"){
                                $(".vlan-detail-descript").find(".data_"+i).empty().append( '<span class="running" style="display:inline-block;"><i class="easyui-tooltip icon-state" style=" background-position: -812px -65px !important;height:16px;padding-bottom:3px;"></i><span class="host_status" style="top:-4px;left:-13px;">'+ef.util.getLocale('cal.hostalave.status.able')+'</span>');//运行
                            }
                            else{
                                $(".vlan-detail-descript").find(".data_"+i).empty().append( '<span class="running" style="display:inline-block;"><i class=" easyui-tooltip icon-state" style="background-position: -812px -350px;height:16px;padding-bottom:3px;"></i><span class="host_status" style="top:-4px;left:-13px;">'+ef.util.getLocale('cal.hostalave.status.disable')+'</span>');//停止
                            }
                        }else{
                            $(".vlan-detail-descript").find(".data_"+i).empty().text(_val);
                            firstName = _data["name"];
                            $(".vlan-detail-descript").find(".data_vlan_type").empty().text(_data["vlan_type"].toUpperCase());
                        }

                    }
                }
                implement.id=_data.id;
                implement.text(firstName);
                ef.localStorage.put("vlanDetailId",_data.id);
                ef.localStorage.put("vlanDetailName",_data.name);
                implement.getVlanHosts(_data.id,function (response) {
                    $("#vlandetailhost_grid").datagrid({data:response}).datagrid('clientPaging');
                    implement.netVlanSocket();
                });
                implement.getVlanSubnet(_data.id,true);
                //描述
                $(".vlan-detail-descript .textbox").addClass("noborder");
                $(".data_name input").attr("disabled","disabled");
                //保存修改后的值
                function saveDescriptData()
                {
                    for(var i in _descriptData)
                    {
                        _descriptData[i]=$(".vlan-detail-descript").find(".data_"+i+" .textbox-text").val();
                    }
                }
                //判断权限
                if(user.isSys()||user.isSuper()){
                    var vlanname=[],name,namesave,DNSsave;
                    var _descriptBtns=$(".descriptBtns").togglebutton([
                        [
                            {
                                iconClass: "icon-menus-icon-edit",
                                tip: ef.util.getLocale("setting.user.edit.tip"),//编辑
                                id: "0",
                                click:function()
                                {
                                    ef.placard.hide();
                                    if(namesave){
                                        $("#vlanDetailname").textbox("setValue",namesave);
                                    }
                                    else
                                    {
                                        $("#vlanDetailname").textbox("setValue",_data.name);
                                    }
                                    _descriptBtns.setStatus("2",true);
                                    _descriptBtns.goto(1);
                                    $("#vlanDetailname").textbox({"disabled":false});
                                    $(".data_name_input .textbox").removeClass('noborder');
                                    $("#vlanDetailname").textbox({
                                        onChange: function () {
                                            _descriptBtns.setStatus("2",false);
                                        }
                                    });
                                }
                            }
                        ],
                        [
                            {
                                iconClass: "icon-menus-icon-save",
                                tip: ef.util.getLocale("setting.user.save.tip"),//保存
                                id:"2",
                                click:function()
                                {
                                    if(!$("#vlanDetailname").textbox('isValid')){
                                        return;
                                    }
                                    ef.loading.show();
                                    var isForce=true;
                                    ef.placard.hide();
                                    var choose = [];
                                    name = $("#vlanDetailname").textbox("getValue"); //名称值
                                    var namesaveOne = $("#vlanDetailname").textbox("getValue");//
                                    for(var i=0;i<vlanname.length;i++){
                                        choose.push(name==vlanname[i]);
                                    }
                                    if(choose.indexOf(true)!=-1){
                                        ef.loading.hide();
                                        ef.placard.show(ef.util.getLocale("network.Detail.name"));
                                    }
                                    else{
                                        ef.getJSON(
                                            {
                                                url:api.getAPI("order.wait.Detail.combo.ip.xx")+"/"+_data.id,
                                                type:"post",//get,post,put,delete
                                                isForce:isForce,
                                                data:{
                                                    "name":namesaveOne
                                                },
                                                success:function(response)
                                                {
                                                    $("#vlanDetailname").textbox({"disabled":true});
                                                    $(".data_name_input .textbox").addClass('noborder');
                                                    ef.loading.hide();
                                                    namesave = $("#vlanDetailname").textbox("getValue");
                                                    _descriptBtns.goto(0);
                                                    saveDescriptData();
                                                },
                                                error:function(error)
                                                {
                                                    ef.loading.hide();
                                                }
                                            });
                                    }
                                }
                            },
                            {
                                iconClass: "icon-menus-icon-cancel",
                                tip: ef.util.getLocale("setting.user.cancel.tip"),//取消
                                click:function()
                                {
                                    ef.placard.hide();
                                    if(namesave){
                                        $("#vlanDetailname").textbox("setValue",namesave);
                                    }
                                    else
                                    {
                                        $("#vlanDetailname").textbox("setValue",_data.name);
                                    }
                                    $("#vlanDetailname").textbox({"disabled":true});
                                    $(".data_name_input .textbox").addClass('noborder');
                                    _descriptBtns.goto(0);
                                }
                            }
                        ]
                    ]).setStatus("2",true);
                }
                //子网列表
                if(user.isSys()||user.isSuper()){
                    var subnetBtns = $(".subnetBtns").togglebutton([
                        [
                            {
                                icon:"theme/default/images/add.png",
                                tip:ef.util.getLocale("global.button.add.label"),
                                click: function () {
                                    require(['network.addSubnet'], function (addSubnet) {
                                        new ef.Dialog('vlanDetail.host',{
                                            title: "新建子网",
                                            width:650,
                                            height: 545,
                                            closed: false,
                                            cache: false,
                                            nobody: false,
                                            modal: true,
                                            expandWidth:345,
                                            isExpand:true,
                                            href: "views/addSubnet.html",
                                            onResize: function () {
                                                $(this).dialog('center');
                                            },
                                            onLoad: function () {
                                                addSubnet.redraw();
                                                $(".v_middle").click(function()
                                                {
                                                    var dialog=ef.Dialog.getDialog("vlanDetail.host");
                                                    if(dialog)
                                                    {
                                                        dialog.toggle();
                                                        var expand=dialog.isExpand;
                                                        expand?$(".basic-result-box").show():$(".basic-result-box").hide();
                                                    }

                                                })
                                            },
                                            onClose: function(){
                                                ef.event.trigger("addSubnetClose",
                                                    {

                                                    });
                                                require.undef('network.addSubnet');
                                                way.clear("resultData");
                                            }
                                        });
                                    })
                                }
                            },
                            {
                                icon:"theme/default/images/delete.png",
                                tip:ef.util.getLocale("global.button.remove.label"),
                                id:"0",
                                click: function () {
                                    var vlanrow = $("#vlanDetailSubnet").datagrid('getChecked');
                                    var _delNames,_delId;
                                    for (i = 0; i < vlanrow.length; i++){
                                        _delNames=vlanrow[i].name;
                                        _delId=vlanrow[i].id;
                                    }
                                    ef.messager.confirm('deleting', "确定删除子网'" + _delNames + "'？", null,function (ok) {
                                        if (ok) {
                                            ef.loading.show();
                                            ef.getJSON(
                                                {
                                                    url: api.getAPI("subnet") + "/" + _delId,
                                                    type: "delete",//get,post,put,delete
                                                    isForce: true,
                                                    success: function () {
                                                        implement.getVlanSubnet(_data.id,false);
                                                        subnetBtns.setStatus("0",true);
                                                        ef.loading.hide();
                                                        ef.placard.tick("子网删除成功！");
                                                    },
                                                    error: function () {
                                                        ef.loading.hide();
                                                    }
                                                });
                                        } else {
                                            $("#vlanDetailSubnet").datagrid("uncheckAll");
                                            subnetBtns.setStatus("0",true);
                                        }
                                    });
                                }
                            }
                        ]
                    ]);
                    subnetBtns.setStatus("0",true);
                    $("#vlanDetailSubnet").datagrid({
                        onCheck: function (rowIndex,rowData) {
                            if(rowData.ip_use<2){subnetBtns.setStatus("0",false);}
                            else{subnetBtns.setStatus("0",true);}
                        }
                    });
                }
                //主机列表
                if(user.isSys()||user.isSuper()) {
                    var _hostBtns = $(".hostBtns").togglebutton([
                        [
                            {
                                icon:"theme/default/images/add.png",
                                tip:ef.util.getLocale("global.button.add.label"),
                                click: function () {
                                    require(['network.addvalanDetail'], function (addvalanDetail) {
                                        new ef.Dialog('vlanDetail.host',{
                                            title: ef.util.getLocale("network.vlan.addhost"),
                                            width:900,
                                            height: 570,
                                            closed: false,
                                            cache: false,
                                            nobody: false,
                                            modal: true,
                                            href: "views/netvlan_host.html",
                                            onResize: function () {
                                                $(this).dialog('center');
                                            },
                                            onLoad: function () {
                                                addvalanDetail.redraw();
                                            },
                                            onClose: function(){
                                                require.undef('network.addvalanDetail');
                                            }
                                        });
                                    })
                                }
                            },
                            {
                                icon:"theme/default/images/delete.png",
                                tip:ef.util.getLocale("global.button.remove.label"),
                                id:"0",
                                click: function () {
                                    var vlanrow = $("#vlandetailhost_grid").datagrid('getChecked');
                                    var _delNames,_delId;//delhost=[];
                                    for (i = 0; i < vlanrow.length; i++){
                                        if(vlanrow[i].vm_counts!=0){
                                           return;
                                            //delhost.push(_delId);
                                        }else{
                                            _delNames=vlanrow[i].name;
                                            _delId=vlanrow[i].id;
                                        }
                                    }
                                    ef.messager.confirm('deleting', "确定移除宿主机'" + _delNames + "'？",null, function (ok) {
                                        if (ok) {
                                            ef.loading.show();
                                            ef.getJSON(
                                                {
                                                    url: api.getAPI("order.wait.Detail.combo.ip.xx") + "/" + _data.id + "/host"+"/"+_delId,
                                                    type: "delete",//get,post,put,delete
                                                    isForce: true,
                                                    success: function () {
                                                        _hostBtns.goto(0);
                                                        ef.placard.tick(ef.util.getLocale("network.vlan.placard.deletehost"));
                                                        ef.nav.reload();
                                                        //_hostBtns.setStatus("0",true);
                                                        //ef.loading.hide();
                                                    },
                                                    error: function () {
                                                        ef.loading.hide();
                                                    }
                                                });
                                        } else {
                                            $("#vlandetailhost_grid").datagrid("uncheckAll");
                                            _hostBtns.setStatus("0",true);
                                        }
                                    });
                                }
                            }
                        ]
                    ]);
                    //implement.netVlanSocket();
                    _hostBtns .setStatus("0",true);
                    $("#vlandetailhost_grid").datagrid({
                        onCheck: function (rowIndex,rowData) {
                            if(rowData.vm_counts!=0){
                                _hostBtns.setStatus("0",true);
                            }else{
                                _hostBtns.setStatus("0",false);
                            }
                        }
                    });
                }
            })
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});