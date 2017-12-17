/**
 * Created by yezi on 2016/6/21.
 */
define(["easyui","api","module","domReady","clientPaging","resize"],function(easyui,api,module,domReady,clientPaging){
    var impl=new ef.Interface.implement();
    impl.redraw=function(){
        impl.servtabs();
    };
    impl.servtabs=function(){//确定选中的服务列表tab页
        $("#services_tabs").tabs({
            border:false,
            onSelect: function (title,index) {
                var tab = $('#services_tabs').tabs('getSelected');
                var index = $('#services_tabs').tabs('getTabIndex',tab);
                switch (index){
                    case 0 :
                        impl.initSearchBox(index);
                        impl.renderPage($("#cal_serv_table"));
                        impl.getservData(index,$("#cal_serv_table"),"#cal");
                        break;
                    case 1 :
                        impl.initSearchBox(index);
                        impl.renderPage($("#save_serv_table"));
                        impl.getservData(index,$("#save_serv_table"),"#save");
                        break;
                    case 2 :
                        impl.initSearchBox(index);
                        impl.renderPage($("#net_serv_table"));
                        impl.getservData(index,$("#net_serv_table"),"#net");
                        break;
                    case 3 :
                        impl.initSearchBox(index);
                        impl.renderPage($("#sys_serv_table"));
                        impl.getservData(index,$("#sys_serv_table"),"#sys");
                        break;
                    case 4 :
                        impl.initSearchBox(index);
                        impl.renderPage($("#cei_serv_table"));
                        impl.getservData(index,$("#cei_serv_table"),"#cei");
                        break;

                }
            }
        });
    };

    impl.getservData=function(tab,$dom){//获取列表中需要显示的数据
        $dom.datagrid('loading');
        if(impl.socket){
            impl.socket.send(JSON.stringify({id:tab}));
        }
        ef.getJSON({
            url:api.getAPI("service.list"),
            type:"get",
            useLocal:false,
            data:{
                "flag":tab
            },
            success:function(response){
                $dom.datagrid({data:response});
                impl.setServiceWebSocket($dom,tab);
                $dom.datagrid("autoData");
            },
            error:function(error){
                console.log(error);
            }
        })
    };

    /**
     * websocket
     * @param $dom
     */
    impl.setServiceWebSocket=function($dom,tab){
        var resId;
        var dataRow;
        if(!impl.socket)
        {
            impl.socket=new ef.server.Socket(api.getAPI("setting.service.socket",true),"setting.service.socket");
        }
        impl.socket.onopen=function(){
            impl.socket.send(JSON.stringify({id:tab}));
        };
        impl.socket.onmessage=function(data){
            dataRow=$dom.datagrid('getData').rows;
            var useData=JSON.parse(data.data);
            $(dataRow).each(function (i,il) {
                resId=il.name+'#'+il.host;
                for(var e in useData.response) {
                    if(resId==e)
                    {
                        il.status=useData.response[e];
                    }
                }
            });
            $dom.datagrid('loadData',dataRow).datagrid('goto',1);
        };
    };


    impl.renderPage=function(serv){//显示表格及内容
        serv.datagrid({
            singleSelect:true,
            pagination:true,
            autoHeight:true,
            pageSize: 10,
            emptyText:"暂无数据",
            columns:[[
                {field:'name',title:ef.util.getLocale("setting.userdetail.datagrid.name"),width:'25%',
                     formatter:function(val){
                         if(val){return '<span style="padding-left: 2px;">'+val+'</span>'}
                         else{return '<span style="padding-left: 2px;">-<span>'};
                     }
                },
                {field:'host',title:ef.util.getLocale("setting.services.list.host"),width:'30%',
                    formatter:function(val){
                        if(val){return '<span style="padding-left: 2px;">'+val+'</span>'}
                        else{return '<span style="padding-left: 2px;">-<span>'}
                    }
                },
                {field:'status',title:ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.atatusfield"),width:'30%',formatter:function(val,row){
                    if(val=="active"){
                        return '<span class="status_icon_box" style="padding-left: 3px"><i class="icon-status-available"></i><span>'+ef.util.getLocale('dashboard.static.host.available.title')+'</span> </span>';
                    }else if(val=="failed"){
                        return '<span class="status_icon_box" style="padding-left: 3px"><i class="icon-status-unavailable"></i><span>'+ef.util.getLocale('dashboard.static.host.unavailable.title')+'</span> </span>';
                    }
                }},
                {field:'update_at',title:ef.util.getLocale("order.ready.table.overtime"),width:'30%',formatter: function (val) {
                    return '<span style="padding-left: 2px;">'+ef.util.number2time(val, "Y-M-D h:m:s", true)+'</span>';
                }}
            ]]
        }).datagrid('clientPaging').datagrid("loading");
    };
    impl.initSearchBox=function(index){
        var namehost=ef.util.getLocale("setting.service.list.namehost");
        var status=ef.util.getLocale("setting.service.list.state");
        var search=null;
        switch (index){
            case 0 :
                search="#cal";
                break;
            case 1 :
                search="#save";
                break;
            case 2 :
                search="#net";
                break;
            case 3 :
                search="#sys";
                break;
            case 4 :
                search="#cei";
                break;
        }
        $(search+"_service").textbox({
            prompt: namehost,
            iconCls: 'icon-search',
            iconAlign: 'left',
            onChange: function (newValue,oldValue) {
                impl.filter(search);
            }}).textbox('clear');
        ef.getJSON({
            url:api.getAPI("service.status"),
            type:"get",
            useLocal:true,
            success:function(response){
                $(response).each(function(i,item)
                {
                    item.label=ef.util.getLocale("service.list.status."+item.value+".tip");
                });
                $(search+"_status").combobox({
                    prompt:status,
                    data:response,
                    valueField:'value',
                    textField:'label',
                    editable:false,
                    onChange: function (newValue,oldValue) {
                        impl.filter(search);
                    }
                });
            },
            error:function(){}
        });
        $(search+"_reset").click(function () {
            //ef.nav.reload();
            impl.initSearchBox(index);
            impl.renderPage($(search+"_serv_table"));
            impl.getservData(index,$(search+"_serv_table"));
            $(search + "_service").textbox('reset');
            $(search + "_status").combobox('reset');
        })
    };


    impl.filter=function(search){
        var serv_name=$(search+"_service").textbox('getValue').toLowerCase();
        var serv_status=$(search+"_status").combobox('getValue');
        serv_status=serv_status=="all"?"":serv_status;
        $(search+"_serv_table").datagrid({
            loadFilter:function(data){
                return ef.util.search(data,{filterFunction:function(item)
                {
                    if(serv_name)
                    {
                        return ((item.name&&item.name.toLowerCase().indexOf(serv_name)!=-1)||(item.host&&item.host.toLowerCase().indexOf(serv_name)!=-1));
                    }else
                    {
                        return true;
                    }
                }},
                    {filterFunction:function(item){
                        if(serv_status){
                            return item.status==serv_status;
                        }
                        else{
                            return true;
                        }
                    }}
                )
            }
        }).datagrid('clientPaging').datagrid("goto",1);
        serv_name="";
        serv_status="";
    };
    impl.destroy=function(){
        require.undef(module.id);
    };
    return impl;
});
