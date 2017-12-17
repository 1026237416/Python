/**
 * Created by xuyunxia on 2015/10/22.
 */
define(["domReady",'easyui','clientPaging',"module","api","network.vlanDetail"],function(domReady,easyui,clientPaging,module,api,vlanDetail)
{
    var implement=new ef.Interface.implement();
    implement.table=function(){
        $("#vlanDetail_hostlist").datagrid({
            singleSelect:false,
            pagination:true,
            width:"100%",
            height:428,
            columns:[
                [
                    {field: "ck1", width: "4%",checkbox:true},
                    {field:"name",width:"25%",title:ef.util.getLocale('cal.vm.host.table.name'),
                        formatter:function(val,row){
                            if(val){
                                return '<span style="padding-left: 0px; padding-top: 5px ">'+val+'</span>';
                            }else{
                                return '<span style="padding-left: 0px; padding-top: 5px ">'-'</span>';
                            }

                        }
                    },
                    {field:"ip",width:"27%",title:'IP',
                        formatter:function(val,row){
                            if(val){
                                return '<span style="padding-left: 0px; padding-top: 5px ">'+val+'</span>';
                            }else{
                                return '<span style="padding-left: 0px; padding-top: 5px ">'-'</span>';
                            }
                        }
                    },
                    {field:"cpus",width:"25%",title:ef.util.getLocale('setting.userdetail.datagrid.format'),formatter:function(val,row){
                        if(val){
                            var memo = Math.ceil(row.memory_mb/1024);
                            return '<span style="padding-left: 0px; padding-top: 5px ">'+val+ef.util.getLocale("cal.host.util")+memo+ef.util.getLocale("cal.host.GB")+'</span>';
                        }else{
                            return '<span style="padding-left: 0px; padding-top: 5px ">'-'</span>';
                        }

                    }},
                    {field:'status',title:ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.atatusfield"),width:'24%',formatter: function (val,row) {
                        if(val=="available"){
                            return '<div style="margin-left:11px "><i class="icon-status-done-success hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.able")+'</span></div>'
                        }
                        else{
                            return '<div style="margin-left:11px "><i class="icon-status-done-fail hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.disable")+'</span></div>'
                        }
                    }}
                ]
            ]
        })
    }
    implement.redraw  = function () {
        domReady(function(){
            implement.table();
            $("#ok").css("opacity",0.4);
            $("#vlanDetail_add_cancel").click(function () {
                ef.Dialog.close("vlanDetail.host");
            });
            $("#vlanDetail_hostlist").datagrid('loading');
            ef.getJSON(
                {
                    url:api.getAPI("network.vlan.addVlan.host"),
                    type:"get",//get,post,put,delete
                    isForce:true,
                    success:function(response)
                    {
                        vlanDetail.getVlanHosts(ef.localStorage.get("vlanDetailId"), function (tenrows) {
                            if(response.length<=tenrows.length){$("#vlanDetail_hostlist").datagrid({data:[]});}
                            else{
                                for(var i = 0;i<response.length;i++){
                                    for(var j = 0;j<tenrows.length;j++){
                                        if(response[i].id==tenrows[j].id){
                                            response.splice(i,1);
                                        }
                                    }
                                }
                                $("#vlanDetail_hostlist").datagrid({data:response});
                                $("#vlanDetail_hostlist").datagrid({'checkbox':true});
                                $("#vlanDetail_hostlist").datagrid({
                                    onCheck: function () {
                                        change();
                                    },
                                    onCheckAll: function () {
                                        change();
                                    }
                                }).datagrid("clientPaging",{
                                    onBeforePage: function (num, size, data) {
                                        implement.pageData = data;
                                    }
                                });
                            }
                        });

                    },
                    error:function(error)
                    {
                        console.log(error);
                    }
                });
            function change() {
                    $("#ok").css("opacity",1);
                    $("#vlanDetail_add_ok").click(function(){
                        implement.host = ef.util.getTablePageData($("#vlanDetail_hostlist"),implement.pageData);
                        //var rows=  $("#vlanDetail_hostlist").datagrid("getChecked");//add
                        var hostId = [];
                        $(implement.host).each(function (i,il) {
                            hostId.push(il.id);
                        });
                        ef.getJSON({
                           url:api.getAPI("order.wait.Detail.combo.vlan")+"/"+ef.localStorage.get("vlanDetailId")+"/hosts",
                           type:"post",
                           isForce:true,
                           data:{
                               "hosts":hostId,
                               "name":ef.localStorage.get("vlanDetailName")
                           },
                           success: function () {
                               ef.placard.tick(ef.util.getLocale("network.vlan.placard.addhost"));
                                ef.nav.reload();
                               ef.Dialog.close("vlanDetail.host");
                               //vlanDetail.vlanDetailref();
                           },
                           error: function (error){
                               console.log(error);
                           }
                        });
                    })
            }

        })
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
