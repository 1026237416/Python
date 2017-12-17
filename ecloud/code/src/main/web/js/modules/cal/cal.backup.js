/**
 * Created by yezi on 2016/3/9.
 */
define(["easyui","clientPaging","module","api","domReady","resize"],function(easyui,client,module,api,domReady)
{
    var implement=new ef.Interface.implement(),isForce;
    implement.tabsData = function () {
        $("#backuptabs").tabs({
            border:false,
            onSelect: function (title,index) {
                var tab = $('#backuptabs').tabs('getSelected');
                var index = $('#backuptabs').tabs('getTabIndex',tab);
                ef.localStorage.put("backuptype",index);
                if(index==0){
                    implement.backupData("vm",true,$("#hostbackup"));
                    $("#backup_host")&&$("#backup_host").textbox('reset');
                }
                if(index==1){
                    implement.backupData("volume",true,$("#diskbackup"));
                    $("#backup_disk")&&$("#backup_disk").textbox('reset');
                }

            }
        });
    };
   // };
    /*策略暂时不做*/
    //implement.strategyTab = function () {
    //    $("#strategy").datagrid({
    //        singleSelect:true,
    //        pagination:true,
    //        pageSize:10,
    //        columns:[[
    //            {field:'id',title:ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.namefield"),width:'10%',formatter: function (val,row) {
    //                var _row=ef.util.escapeJSON(JSON.stringify(row));
    //                return  ' <a onclick="ef.nav.goto(\'backup.html\',\'cal.backup\',\''+_row.id+'\',null,\'cal.backup1\')" class="table-link">'+val+'</a>';
    //            }},
    //            {field:'name',title:ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.remarkfield"),width:'10%'},
    //            {field:'number',title:ef.util.getLocale("cal.backup.circle"),width:'15%'},
    //            {field:'size',title:ef.util.getLocale("cal.backup.starttime"),width:'25%'},
    //            {field:'',title:ef.util.getLocale("cal.backup.style"),width:"20%"},
    //            {field:'',title:ef.util.getLocale("cal.backup.object"),width:"25%"}
    //        ]]
    //    })
    //};
    implement.backupData = function (type,isFirst,$dom) {
        //implement.backupTab($dom);
        if(isFirst){
            $dom.datagrid('loading');
        }
        ef.getJSON({
            url:api.getAPI("backup_vm.list"),
            type:"get",//get,post,put,delete
            useLocal:false,
            data:{
                type:type=="vm"?0:1
            },
            success:function(response) {
                //response=ef.util.sort("name",response,true);
                $(response).each(function (i,il) {
                    if(type=="vm"){
                        il.type = 1;
                    }else{il.type = 2;}
                });
                if(isFirst)
                {
                    $dom.datagrid({data:response}).datagrid("clientPaging");
                }else
                {
                    $dom.datagrid('loaded');
                    //$dom.datagrid("loadData",response).datagrid("goto",1);
                    $dom.datagrid("loadData",response).datagrid("clientPaging");
                }
                $dom.datagrid("autoData");
            },
            error:function(error){
                console.log(error);
            }
        });
    };
    //implement.autoHeight=function(EventName,datagridDOM,dgParent,DOMArry){
    //    var WH = window.innerHeight;
    //    var DH =83;
    //    $(DOMArry).each(function(il,i){
    //        DH+=(parseInt($(il).height())+parseInt($(il).css("marginTop"))+parseInt($(il).css("marginBottom"))+parseInt($(il).css("paddingTop"))+parseInt($(il).css("paddingBottom")))
    //    });
    //    var ht=WH-DH;
    //    ht=ht>450?ht:450;
    //    $(dgParent)[0].style.height=ht+"px";
    //    $(window).on(EventName,function(){
    //        var WH = window.innerHeight;
    //        var DH =83;
    //        $(DOM).each(function(il,i){
    //            DH+=(parseInt($(il).height())+parseInt($(il).css("marginTop"))+parseInt($(il).css("marginBottom"))+parseInt($(il).css("paddingTop"))+parseInt($(il).css("paddingBottom")))
    //        });
    //        var ht=WH-DH;
    //        if($(dgParent)[0]){
    //            ht=ht>450?ht:450;
    //            $(dgParent)[0].style.height=ht+"px";
    //        }
    //    });
    //};
    implement.init=function(){
        $("#backup_host").textbox({
            prompt:ef.util.getLocale("cal.backup.combobox.prompt"),
            iconCls:'icon-search',
            iconAlign:'left',
            method: 'get',
            //url: 'data/mash.json',
            valueField:'value',
            textField:'label',
            onChange:function(newValue,oldValue){
                newValue=newValue.toLowerCase();
                $("#hostbackup").datagrid({
                    loadFilter: function (data) {
                        var tmp = {total:0,rows:[]};
                        $(data).each(function (i,il) {
                            if(String(il.name).toLowerCase().indexOf(newValue)!=-1||String(il.displayname).toLowerCase().indexOf(newValue)!=-1){
                                tmp.total = tmp.total+1;
                                tmp.rows.push(il);
                            }
                        });
                        return tmp;
                    }
                }).datagrid('clientPaging').datagrid("goto",1);
            }
        });
        $("#backup_disk").textbox({
            prompt:ef.util.getLocale("cal.backup.combobox.prompt"),
            iconCls:'icon-search',
            iconAlign:'left',
            method: 'get',
            valueField:'value',
            textField:'label',
            onChange:function(newValue,oldValue){
                newValue=newValue.toLowerCase();
                $("#diskbackup").datagrid({
                    loadFilter: function (data) {
                        var tmp = {total:0,rows:[]};
                        $(data).each(function (i,il) {
                            if(!il.displayname){il.displayname="";}
                            if(String(il.name).toLowerCase().indexOf(newValue)!=-1||(String(il.displayname).toLowerCase().indexOf(newValue)!=-1)){
                                tmp.total = tmp.total+1;
                                tmp.rows.push(il);
                            }
                        });
                        return tmp;
                    }
                }).datagrid('clientPaging').datagrid("goto",1);
            }
        });
        $("#backup_host")&&$("#reset_host").click(function () {
            implement.backupData("vm",false,$("#hostbackup"));
            $("#backup_host").textbox('clear');
        });
        $("#backup_disk")&&$("#reset_disk").click(function () {
            implement.backupData("vd",false,$("#diskbackup"));
            $("#backup_disk").textbox('clear');
        });
        $("#hostbackup").datagrid({
            singleSelect:true,
            pagination:true,
            pageSize:10,
            autoHeight:true,
            columns:[[
                {field:'name',title:ef.util.getLocale("cal.backup.idfield"),width:'25%',formatter: function (val,row) {
                    var _row=ef.util.escapeJSON(JSON.stringify(row));
                    return  ' <a onclick="ef.nav.goto(\'backupDetail.html\',\'cal.backupDetail\',\''+_row+'\',null,\'cal.backup\')" class="table-link">'+val+'</a>';
                }},
                {field:'displayname',title:ef.util.getLocale("cal.backup.vmnamefield"),width:'30%'},
                {field:'count',title:ef.util.getLocale("cal.backup.number"),width:'30%'},
                {field:'size',title:ef.util.getLocale("cal.backup.size"),width:'30%'}
            ]]
        });
        $("#diskbackup").datagrid({
            singleSelect: true,
            pagination: true,
            pageSize: 10,
            autoHeight: true,
            columns: [[
                {
                    field: 'name',
                    title: ef.util.getLocale("cal.disk.diskDetail.diskdetaildescript.idfield"),
                    width: '25%',
                    formatter: function (val, row) {
                        var _row = ef.util.escapeJSON(JSON.stringify(row));
                        return '<a onclick="ef.nav.goto(\'backupDetail.html\',\'cal.backupDetail\',\'' + _row + '\',null,\'cal.backup\')" class="table-link">' + val + '</a>';
                    }
                },
                {field: 'displayname', title: ef.util.getLocale("cal.backup.disknamefield"), width: '30%'},
                {field: 'count', title: ef.util.getLocale("cal.backup.number"), width: '30%'},
                {field: 'size', title: ef.util.getLocale("cal.backup.size"), width: '30%'}
            ]]
        });
    };
    //implement.backupWebSocket = function () {
    //    var dataRows = $("#mirrorlist").datagrid('getData').rows;
    //    if(!implement.socket){
    //        implement.socket=new ef.server.Socket(api.getAPI('cal.backup.list.socket',true),"cal.backup.list.socket");
    //    }
    //    implement.socket.onmessage = function(data){
    //        var useData = eval(data[0].data);
    //        $(dataRows).each(function (i,il) {
    //            for(var e = 0;e<useData.length;e++){
    //                if(il.id==useData[e].id){
    //                    il.state = useData[e].state;
    //                    useData.splice(e,1);
    //                }
    //            }
    //        });
    //        $("#mirrorlist").datagrid('loadData',dataRows).datagrid('goto',1);
    //    };
    //};
    implement.redraw= function () {
        domReady(function()
        {
            implement.init();
            implement.tabsData();
            // implement.strategyTab();
        });
    };

    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});