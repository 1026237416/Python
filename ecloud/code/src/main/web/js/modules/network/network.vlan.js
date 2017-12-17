/**
 * Created by yezi on 2016/11/30.
 */
define(["user", "domReady", "module", 'easyui', "clientPaging", "api","way","resize"], function (user, domReady, module, easyui, clientPaging, api,way) {
    var implement = new ef.Interface.implement();
    implement.resultSplice = function (result) {
        var res = [],resData = {};
        res = ef.util.map(result.ips, function (il) {
            var a = ef.util.getIpPrefix(il.ip);
            return a.substring(a.lastIndexOf(".")+1, a.length);
        });
        res = ef.util.uniq(res);
        $(res).each(function (i,il) {
            var data = [],item = {cidr:result.cidr,ips:[]};
            $(result.ips).each(function (e,el) {
                var a = ef.util.getIpPrefix(el.ip);
                var t =  a.substring(a.lastIndexOf(".")+1, a.length);
                if(t==il){data.push(el);}
            });
            item.ips = data;
            resData[Number(il)] = item;
        });
        res.sort(function(a,b){return a-b});
        return {key:res,value:resData};
    };
    implement.ref = function (isFirst,callback) {
        ef.getJSON(
            {
                url: api.getAPI("network.vlan.datagrid_vlan"),
                type: "get",//get,post,put,delete
                data:{detailed:true},
                success: function (response) {
                    //callback();
                    response = ef.util.sort("name", response);
                    var vlangridname = [];
                    if (isFirst) {
                        $('#vlangrid').datagrid({data: response}).datagrid("clientPaging",{onPage:function(){
                            if(callback){
                                callback();
                            }
                        }});
                        implement.networkWebSocket();
                    } else {
                        $('#vlangrid').datagrid("loadData", response).datagrid("goto", 1);
                        implement.networkWebSocket();
                    }
                    var _name = $('#vlangrid').datagrid('getRows');
                    $(_name).each(function (i, il) {
                        vlangridname.push(il.name);
                    });
                    ef.localStorage.put("vlan.table.name", vlangridname);
                }
            });
    };
    implement.init = function () {
        $("#vlangrid").datagrid({
            autoHeight:true,
            columns: [[
                {
                    field: "name",
                    width: "15%",
                    title: ef.util.getLocale("network.vlan.datagrid.name"),
                    order: "asc",
                    formatter: function (val, row) {
                        var _row = ef.util.escapeJSON(JSON.stringify(row));
                        return ' <a onclick="ef.nav.goto(\'netvalndetail.html\',\'network.vlanDetail\',\'' + _row + '\',null,\'network.vlan\')" class="table-link">' + val + '</a>';
                    }
                },
                {field: "vlan_type", width: "15%", title: ef.util.getLocale("network.vlan.datagrid.vlan.type"),formatter: function (val) {
                    return val.toUpperCase();
                }},
                {field: "vlan_id", width: "15%", title: ef.util.getLocale("network.vlan.datagrid.vlanid")},
                {
                    field: "subnet_count",
                    width: "20%",
                    title: ef.util.getLocale("network.vlan.datagrid.vlan.subnet")
                },
                {field: "phy_network", title: ef.util.getLocale("network.vlan.datagrid.phyNet"), width: "20%"},
                {field: "status", title: "状态", width: "20%",formatter: function(val,row) {
                    if(val=="ACTIVE"){
                        return '<span class="running"><i class="easyui-tooltip icon-state" style=" background-position: -812px -62px;"></i><span class="host_status">'+ef.util.getLocale('cal.hostalave.status.able')+'</span>';//运行
                    }
                    else{
                        return '<span class="running"><i class=" easyui-tooltip icon-state" style="background-position: -812px -350px;"></i><span class="host_status">'+ef.util.getLocale('cal.hostalave.status.disable')+'</span>';//停止
                    }
                }}
            ]]
        });
    };
    implement.comInit = function () {
        $("#vlan-input").textbox({
            prompt: ef.util.getLocale('network.vlan.search-item.combobox.vlan-input'),//'请输入名称/VLAN ID'
            iconCls:'icon-search',
            iconAlign:'left',
            onChange: function () {
                implement.filter();
            }
        });
        $("#vlan-state").combobox({
            prompt: "请选择状态",
            data:[{label:"全部",value:"all"},{label:"可用",value:"ACTIVE"},{label:"不可用",value:"INACITVE"}],
            textField:'label',
            valueField:'value',
            editable:false,
            onChange: function () {
                implement.filter();
            }
        });
        ef.getJSON({
            url: api.getAPI("phynetworks"),
            type: "get",//get,post,put,delete
            success:function(response) {
                response = ef.util.sort("name",response);
                response.unshift({"name":"全部"});
                $("#vlan-combo").combobox({
                    prompt: "请选择物理网络",
                    data:response,
                    textField:'name',
                    valueField:'name',
                    editable:false,
                    onChange: function () {
                        implement.filter();
                    }
                });
            }
        });
    };
    implement.networkWebSocket=function(){
        var dataRows=$('#vlangrid').datagrid("getData").rows;
        if(!implement.socket)
        {
            implement.socket=new ef.server.Socket(api.getAPI("network.vlan.socket",true),"network.vlan.socket");
        }
        implement.socket.onmessage= function(data) {
            var usedata=JSON.parse(data.data);
            if(usedata.response=="refresh"){
                implement.ref(false);
                return;
            }
            $(dataRows).each(function(i,il){
                for(var e in usedata.response){
                    if(il.id==e){
                        il.status=usedata.response[e];
                    }
                }
            });
            $('#vlangrid').datagrid('loadData',dataRows).datagrid('goto',1);
        };
    };

    implement.filter = function () {
        var opt = $("#vlan-input").textbox('getValue').toLowerCase();
        var phyNet = $("#vlan-combo").combobox('getValue');
        var state = $("#vlan-state").combobox('getValue');
        phyNet=phyNet=="全部"?undefined:phyNet;
        state=state=="all"?undefined:state;
        $("#vlangrid").datagrid({
            loadFilter: function (data) {
                var tmp = {total:0,rows:[]};
                $(data).each(function (i,il) {
                    var arrs = [],tenants;
                    if(!tenants){tenants="";}
                    il.vlan_id = il.vlan_id.toString();
                    if(!opt){opt = il.name.toLowerCase();}
                    if(!phyNet){phyNet = il.phy_network;}
                    if(!state){state = il.status;}
                    if(phyNet==il.phy_network&& (il.name.toLowerCase().indexOf(opt)!=-1||il.vlan_id.toLowerCase().indexOf(opt)!=-1) &&state==il.status){
                        tmp.total = tmp.total+1;
                        tmp.rows.push(il);
                    }
                    opt = $("#vlan-input").textbox('getValue').toLowerCase();
                    phyNet = $("#vlan-combo").combobox('getValue');
                    state = $("#vlan-state").combobox('getValue');
                    phyNet=phyNet=="全部"?undefined:phyNet;
                    state=state=="all"?undefined:state;
                });
                return tmp;
            }
        }).datagrid('clientPaging').datagrid("goto",1);
        implement.networkWebSocket();
    };
    implement.addnet=function(){
        require.undef('modules/network/network.createnet');
        require(["modules/network/network.createnet"],function(addnet)
        {
            new ef.Dialog("addnetDialog",{
                title: "新建网络",
                width: 596,
                height: 486,
                closed: false,
                cache: false,
                nobody: false,
                border:false,
                href: 'views/createnet.html',
                modal: true,
                expandWidth:328,

                isExpand:true,
                onResize:
                    function(){
                        $(this).dialog("vcenter");//垂直居中窗口
                    },
                onClose:function()
                {
                    addnet.destroy();
                    way.clear("resultData");
                },
                onLoad:function()
                {
                    addnet.redraw();//刷新屏幕
                    /*$(".drawer_btn").click(function()
                    {
                        var dialog=ef.Dialog.getDialog("addnetDialog");
                        if(dialog)
                        {
                            dialog.toggle();
                            var expand=dialog.isExpand;
                            expand?$("#resultBox").show():$("#resultBox").hide();
                        }

                    })*/
                }
            });
        });
    };
    implement.redraw = function () {
        var _imp = this;
        domReady(function () {
            _imp.init();
            implement.comInit();
            //重置按钮
            $("#reset").click(function () {
                $("#vlan-input").textbox('clear');
                $("#vlan-combo").combobox('clear');
                $("#vlan-state").combobox('clear');
                _imp.ref(false, function () {});
            });
            //i18n
            if (user.isSys() || user.isSuper) {
                var _iconmenu = $("#js-menus-wrapper").iconmenu([
                    {
                        iconClass: "icon-menus-icon-add",
                        tip: "新建网络",
                        id: "0",
                        click: function () {
                            implement.addnet();
                            /*new ef.Dialog('vlan.addVlan', {
                             title: "新建网络",
                             width: 900,
                             height: 545,
                             closed: false,
                             cache: false,
                             nobody: false,
                             href: 'views/addVlan.html',
                             modal: true,
                             onResize: function () {
                             $(this).dialog('center');
                             },
                             onLoad: function () {
                             require(['network.addVlan'], function (addVlan) {
                             addVlan.redraw();
                             })
                             },
                             onClose: function () {
                             ef.event.trigger("addVlanClose",
                             {

                             });
                             require.undef('network.addVlan');
                             ef.placard.hide();
                             }
                             });*/
                        }
                    },
                    {
                        iconClass: "icon-menus-icon-delete",
                        tip: ef.util.getLocale("global.button.delete.label"),
                        id: "1",
                        click: function () {
                            var dg = $("#vlangrid").datagrid('getSelected');
                            var name = dg.name;
                            ef.messager.confirm('deleting', ef.util.getLocale("network.vlan.delete.ok") + "'" +name + "‘?", null,function (ok) {
                                if (ok) {
                                    ef.loading.show();
                                    ef.getJSON(
                                        {
                                            url: api.getAPI("order.wait.Detail.combo.ip.xx") + "/" + dg.id,
                                            type: "delete",//get,post,put,delete
                                            success: function () {
                                                ef.nav.reload();
                                                ef.loading.hide();
                                                ef.placard.tick(ef.util.getLocale("network.vlan.placard.delete"));
                                            },
                                            error: function (error) {
                                                ef.loading.hide();
                                            }
                                        });
                                    _iconmenu.setStatus(1, true);
                                } else {
                                    $("#vlangrid").datagrid("unselectAll");
                                    _iconmenu.setStatus(1, true);
                                }
                            });
                        }
                    }
                ]);
                _iconmenu.setStatus(1, true);
                $('#vlangrid').datagrid({
                    onSelect: function (rowIndex, rowData) {
                        _iconmenu.setStatus(1, false);
                    }
                });
            }
            implement.ref(true, function () {
                _iconmenu.setStatus(1, true);
            });
            if (user.isSec()) {
                $(".icon-menus-box").hide();
                $(".vlansec .right-cont ").removeClass('padding_top60');
                $(".right-cont").css('padding-top', '20px');
            }
            if (user.isAudit()) {
                $(".icon-menus-box").hide();
                $(".vlansec .right-cont ").removeClass('padding_top50');
                $(".right-cont").css('padding-top', '20px');
            }
            $('#vlangrid').datagrid("autoData");
            $('#vlangrid').datagrid('loading');
        });
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});