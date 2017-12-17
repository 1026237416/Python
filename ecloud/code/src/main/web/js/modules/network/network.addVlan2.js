/**
 * Created by yezi on 2016/12/15.
 */
/**
 * Created by yezi on 2016/11/30.
 */
define(['easyui','domReady',"contextmenu","module","clientPaging","api","network.vlan","setting.param"],function(easyui,domReady,contextmenu,module,clientPaging,api,networkVlan,settingParam) {
    var implement=new ef.Interface.implement();
    implement.hostList=[];
    implement.currentpagedata=[];
    implement.selectHost=function(){
        $("#vlanHostList111").datagrid({
            singleSelect:false,
            pagination:true,
            width:"100%",
            pageSize:6,
            height:285,
            columns:[[
                {"field":"ck",width:"7%",checkbox:true},
                {"field":"name",width:"20%",title:"主机名",formatter:function(val,row){return val?val:"-"}},
                {"field":"ip",width:"22%",title:"IP",formatter:function(val,row){return val?val:"-"}},
                {"field":"cpus",width:"32%",title:"配置",formatter:function(val,row){
                    if(val&&row.memory_mb){
                        return '<span style="padding-left:0px">'+val+"核"+ef.util.mb2gb(row.memory_mb).toFixed(0)+"GB"+'</span>';
                    }else{
                        return "<span style='padding-left: 0px;'>-</span>"
                    }
                }},
                {"field":"status",width:"28%",title:"状态",formatter:function(val,row){
                    if(val=="available"){
                        return '<span style="position:relative;padding-left:0"><i class="icon-status-done-success hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.able")+'</span></span>'
                    }
                    else{
                        return '<span style="position:relative;padding-left:0;"><i class="icon-status-done-fail hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.disable")+'</span></span>'
                    }
                }}
            ]],
            onCheck:function(rowIndex,rowData){
                if(implement.currentpagedata&&implement.currentpagedata.length!=0){
                    var data=_.find(implement.currentpagedata,function(data){
                        return data==rowData;
                    });
                }
               if(data){
                   return;
               }
                implement.hostList.push({
                    host: {
                        id: rowData.id,
                        dom: '<div id=\"host' + rowData.id + '\">' + '<span>' + rowData.name + '</span>' + '</div>'
                    }
                });
                implement.hostList=_.uniq(implement.hostList);
                way.set("resultData.hosts",implement.hostList);
                implement.hostData();
                /*$(implement.hostList).each(function(i,il){
                    if(rowData.id==il.id){
                        return;
                    }else{
                        implement.hostList.push({
                            host: {
                                id: rowData.id,
                                dom: '<div id=\"host' + rowData.id + '\">' + '<span>' + rowData.name + '</span>' + '</div>'
                            }
                        });
                        implement.hostList=_.uniq(implement.hostList);
                        way.set("resultData.hosts",implement.hostList);
                        implement.hostData();
                    }
                });*/
            },
            onUncheck:function(rowIndex,rowData){
                $(implement.hostList).each(function(i,il){
                    if(rowData.id==il.host.id){
                        implement.hostList.splice(i,1);
                    }
                });
                //implement.hostList=_.uniq(implement.hostList);
                implement.currentpagedata=implement.hostList;
                way.set("resultData.hosts",implement.hostList);
                implement.hostData();
            },
            onCheckAll:function(rows){
                var a=0;
                if(implement.currentpagedata&&implement.currentpagedata.length!=0){
                    $(implement.currentpagedata).each(function(i,il){
                        $(rows).each(function(e,el){
                            if(il.id==el.id){
                                a+=1;
                            }
                        });
                    });
                    if(a==6){
                        return
                    }
                }
                var list=[];
                /*$(rows).each(function(e,el){
                    implement.hostList.push({
                        host:{
                            id:el.id,
                            dom:'<div id=\"host'+el.id+'\">' + '<span>' + el.name + '</span>' + '</div>'
                        }
                    });
                });*/
                //var hostList=ef.util.copyDeepProperty(implement.hostList);
                var copyrows=ef.util.copyDeepProperty(rows);
                $(implement.hostList).each(function(i,il){
                    $(copyrows).each(function(e,el){
                        if(el!="delete"&&il.host.id==el.id){
                            copyrows[e]="delete"
                        }
                    });
                });
                $(copyrows).each(function(h,hl){
                    if(hl!="delete"){
                        list.push(hl);
                    }
                });
                $(list).each(function(e,el){
                    implement.hostList.push({
                        host:{
                            id:el.id,
                            dom:'<div id=\"host'+el.id+'\">' + '<span>' + el.name + '</span>' + '</div>'
                        }
                    });
                });
                way.set("resultData.hosts",implement.hostList);
                implement.hostData();
            },
            onUncheckAll:function(rows){
                var hostList=ef.util.copyDeepProperty(implement.hostList);
                $(rows).each(function(e,el){
                    $(hostList).each(function(i,il){
                        if(el.id==il.host.id){
                            implement.hostList[i]="delete"
                        }
                    });
                });
                var list=[];
                $(implement.hostList).each(function(h,hl){
                    if(hl!="delete"){
                        list.push(hl);
                    }
                });
                implement.hostList=list;
                implement.currentpagedata=implement.hostList;
                //implement.hostList=_.uniq(implement.hostList);
                way.set("resultData.hosts",implement.hostList);
                implement.hostData();
            }
        });
    };
    implement.hostData=function(){
        var selRows = implement.hostList;
        //var selRows = $("#vlanHostList111").datagrid('getSelections');
        //var selRows=ef.util.getTablePageData($("#vlanHostList111"),implement.pageData);
        var hosts=[];
        if(selRows.length!=0){
            $(selRows).each(function(i,il){
                hosts.push(String(il.host.id));
            });
        }else{
            hosts=[]
        }
        ef.localStorage.get("network.creatnet").children[1].viewData=hosts;
    };
    implement.redraw=function(){
        implement.selectHost();
        var hostgrid;
        if(!hostgrid)
        {
            ef.getJSON(
                {
                    url:api.getAPI("network.vlan.addVlan.host"),
                    type:"get",//get,post,put,delete
                    isForce:true,
                    success:function(response)
                    {
                        hostgrid=$("#vlanHostList111").datagrid({data:response}).datagrid("clientPaging",{
                            onBeforePage: function (num, size, data, number) {
                                implement.pageData = data;
                                //var pager=$("#vlanHostList111").datagrid("getPager");
                                //var pagenum=pager.pagination("options").pageNumber;
                                implement.currentpagedata=data[number];
                            }
                        });
                    },
                    error:function(error)
                    {
                        console.log(error);
                    }
                });
        };
        if(implement.pageData&&implement.pageData.length>0){
             implement.hostData();
        }
        way.registerTransform('listTrans',function(data){
            if(data){
                return data.dom;
            }
        });
    };
    implement.destroy=function(){
        require.undef(module.id);
    };
    return implement;
});