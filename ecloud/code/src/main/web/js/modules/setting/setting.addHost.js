/**
 * Created by Administrator on 2016/11/23.
 */
define(["domReady",'easyui','clientPaging',"module",'api','setting.tenanteDetail','security'],function(domReady,ey,clientPaging,module,api,td,security)
{
    var implement=new ef.Interface.implement();
    implement.init= function () {
        $("#hs_ok a").append(ef.util.getLocale('global.button.confirm.label'));
        $("#hs_cancel a").append(ef.util.getLocale('global.button.cancel.label'));
        $("#hs_ok").css("opacity",0.4);
        $("#hs_cancel").click(function () {
            ef.Dialog.closeAll();
        });
    }
    implement.initTable=function(){
        $('#table-host').datagrid(
            {
                singleSelect:false,
                pagination:true,
                width:'100%',
                height: 428,
                columns:[
                    [
                        {field: "ck1", width: "15%",checkbox:true},
                        {field:"name",width:"20%",title:ef.util.getLocale('setting.userdetail.datagrid.name'),
                            formatter:function(val,row){
                                if(val){
                                    return '<span>'+val+'</span>';
                                }else{
                                    return '<span>'-'</span>';
                                }
                            }
                        },
                        {field:"ip",width:"27%",title:'IP',
                            formatter:function(val,row){
                                if(val){
                                    return '<span>'+val+'</span>';
                                }else{
                                    return '<span>'-'</span>';
                                }
                            }
                        },
                        {field:"cpus",width:"29%",title:ef.util.getLocale('setting.userdetail.datagrid.format'),formatter:function(val,row){
                            if(val){
                                var memo = Math.ceil(row.memory_mb/1024);
                                return '<span style="margin-left: 3px;">'+val+ef.util.getLocale("cal.host.util")+memo+ef.util.getLocale("cal.host.GB")+'</span>';
                            }else{
                                return '<span>'-'</span>';
                            }

                        }},
                        {field:"status",width:"25%",title:ef.util.getLocale('setting.userdetail.datagrid.status'),
                            formatter:function(val,row){
                                if(val=="available"){
                                    return '<i style="height:16px;width: 13px;margin-left: 4px;" class="icon-status-done-success hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.able")+'</span>'
                                }
                                else{
                                    return '<i style="height:16px;width: 13px;margin-left: 4px;" class="icon-status-done-fail hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.disable")+'</span>'
                                }
                            }}
                    ]
                ],
                onCheck:function(){
                    $("#hs_ok").css("opacity",1);
                },
                onUncheck:function(){
                    if($("#table-host").datagrid("getChecked").length!=0){
                        $("#hs_ok").css("opacity",1);
                        return
                    }
                    $("#hs_ok").css("opacity",0.4);
                },
                onCheckAll:function(){
                    $("#hs_ok").css("opacity",1);
                },
                onUncheckAll:function(){
                    $("#hs_ok").css("opacity",0.4);
                }
            });
    }
    implement.filter=function(item,arrs){
        var bool=false;
        $(arrs).each(function(i,il)
        {
            if(il.name==item.name&&il.ip==item.ip&&il.cpus==item.cpus&&il.status==item.status)
            {
                bool=true;
                return;
            }
        });
        return bool;
    }

    implement.getData=function(callback){
        ef.getJSON(
            {
                url:api.getAPI("setting.project.datagrid_host")+"/"+ef.localStorage.get("setting.project.Detail.id")+"/hosts",
                type: "get",
                isForce:implement.isForce,
                success: function (response) {
                    var resp=[];
                    $(response).each(function(i,il){
                        resp.push(il);
                    });
                    callback(resp);
                    //$('#table-host').datagrid({data:rules}).datagrid("clientPaging");
                },
                error: function (error) {
                    //ef.placard.error(ef.util.getLocale("setting.project.placard.addhostfail"));
                    console.log(error);
                }
            });
    }
    implement.redraw = function () {
        domReady(function () {
            implement.init();
            implement.initTable();
            implement.getData(function (resp) {
                ef.getJSON({
                    url:api.getAPI("order.wait.Detail.host.ip"),
                    type:"get",
                    isForce:true,
                    success:function(response){
                        var data=[];
                        $(response).each(function(i,il){
                            var tmp=implement.filter(il,resp);
                            if(!tmp)
                            {
                                data.push(il);
                            }
                        });
                        $('#table-host').datagrid({data:data}).datagrid("clientPaging",{
                            onBeforePage: function (num, size, data) {
                                implement.pageData = data;
                            }
                        });
                    }
                })
            });
            $('#hs_ok').click(function(){
                implement.host = ef.util.getTablePageData($("#table-host"),implement.pageData);
                if(implement.host) {
                    //var rows = $("#table-host").datagrid("getChecked");//add
                    ef.loading.show();
                    var hostId = [];
                    $(implement.host).each(function (i, il) {
                        hostId.push(il.id);
                    });
                    console.log(hostId);
                    ef.getJSON({//给项目下添加主机
                        url:api.getAPI("setting.project.datagrid_host")+"/"+ef.localStorage.get("setting.project.Detail.id")+"/hosts",
                        type:"post",
                        data:{"host_ids":hostId},
                        success:function(response) {
                            ef.loading.hide();
                            ef.Dialog.close("tenantHost.host");
                            //td.host_datagrid();
                            //ef.placard.tick(ef.util.getLocale("setting.project.placard.addhost"));
                        },
                        error:function(error){
                            console.log(error);
                            ef.loading.hide();
                        }
                    });
                }
            });
            $("#table-host").datagrid('loading');
        });
    }


    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});
