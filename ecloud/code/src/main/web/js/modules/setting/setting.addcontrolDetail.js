/**
 * Created by Administrator on 2016/4/15.
 */
define(["domReady",'easyui','clientPaging',"module",'api','setting.tenanteDetail','security'],function(domReady,ey,clientPaging,module,api,td,security)
{
    var implement=new ef.Interface.implement();
    //implement.selectRules=[];
    implement.init=function(){
        $("th[field='direction']").append(ef.util.getLocale('security.group.direction.label'));
        $("th[field='ethertype']").append(ef.util.getLocale('security.group.ethertype.label'));
        $("th[field='protocol']").append(ef.util.getLocale('security.group.protocol.label'));
        $("th[field='port_range']").append(ef.util.getLocale('security.group.port_range.label'));
        $("th[field='cidr']").append(ef.util.getLocale('security.group.cidr.label'));
     /* $("th[field='security']").append(ef.util.getLocale('setting.project.detail.user.datagrid.secrets'));
        $("th[field='role']").append(ef.util.getLocale('setting.project.detail.user.datagrid.proname'));*/
        $("#control_ok a").append(ef.util.getLocale('global.button.confirm.label'));
        $("#control_cancel a").append(ef.util.getLocale('global.button.cancel.label'));
        $("#control_ok").css("opacity",0.4);
        $("#control_cancel").click(function () {
            ef.Dialog.closeAll();
        });
    };

    implement.tableInit= function () {
        $('#table-control').datagrid(
            {
                singleSelect:false,
                width:'100%',
                height: 428,
                pagination:true,
                pageSize:10,
                //emptyText:"正在加载，请稍后...",
                columns: [
                    [
                        {field: "ck",checkbox:true},
                        {field: "direction", width: "12%",title: ef.util.getLocale("security.group.direction.label"),formatter:function(val,row)
                        {
                            return val!=null?ef.util.getLocale("security.group.grid.direction."+val):"-";
                        }},
                        {field: "ethertype", width: "24%", title: ef.util.getLocale("security.group.ethertype.label"),formatter:function(val,row){
                            return val!=null?val:"-";
                        }},
                        {field: "protocol", width: "21%", title: ef.util.getLocale('security.group.protocol.label'),formatter:function(val,row)
                        {
                            return val==null?ef.util.getLocale("security.group.grid.any"):String(val).toUpperCase();
                        }},
                        {field: "port_range", width: "22%", title: ef.util.getLocale('security.group.port_range.label'),formatter:function(val,row)
                        {
                            return val==null?ef.util.getLocale("security.group.grid.any"):String(val).toUpperCase();
                        }},
                        {field: "cidr", width: "21%", title: ef.util.getLocale('security.group.cidr.label'),formatter:function(val,row){
                            return val==null?"-":val;
                        }}
                       /* {field: "security", width: "18%", title: ef.util.getLocale('setting.user.datagrid.secrets'),formatter: function (val,row) {
                            return security.getSecurityByValue(val).label;
                        }}*/
                    ]
                ],
                onCheck:function(){
                    $("#control_ok").css("opacity",1);
                },
                onUncheck:function(){
                   if($("#table-control").datagrid("getChecked").length!=0){
                           $("#control_ok").css("opacity",1);
                       return
                   }
                    $("#control_ok").css("opacity",0.4);
                },
                onCheckAll:function(){
                    $("#control_ok").css("opacity",1);
                },
                onUncheckAll:function(){
                    $("#control_ok").css("opacity",0.4);
                }
            }).datagrid("loading");
    };
    implement.filter= function (item,arrs) {
        var bool=false;
        $(arrs).each(function(i,il)
        {
            if(il.direction==item.direction&&il.cidr==item.cidr&&il.protocol==item.protocol&&il.from_port==item.from_port&&il.to_port==item.to_port&&il.ethertype==item.ethertype)
            {
                bool=true;
                return;
            }
        });
        return bool;
    };
    implement.controlData=function(){
        //ef.loading.show();
        ef.getJSON({
            url:api.getAPI("cal.security.group.list")+"?tenant_id="+ef.localStorage.get("setting.project.Detail.id")+"&"+"filter=True",
            type:"get",
            useLocal:false,
            success:function(response){
                var controlRules=ef.localStorage.get("tenant_control_rules"),rules=[];
                $(response).each(function(i,il){
                    var tmp=implement.filter(il,controlRules);
                    if(!tmp)
                    {
                        rules.push(il);
                    }
                });
                //ef.loading.hide();
                $('#table-control').datagrid({data:rules}).datagrid("clientPaging",{
                    onBeforePage: function (num, size, data) {
                        implement.pageData = data;
                    }
                });
            },
            error:function(){
                ef.placard.error(ef.util.getLocale("setting.project.placard.addrulefail"));
                ef.loading.show();
            }
        });
    };
    implement.redraw = function () {
        domReady(function(){
            implement.init();
            implement.controlData();
            implement.tableInit();
            $("#control_ok").click(function(){
                if($("#control_ok").css("opacity")=="1"){
                    //var rows=  $("#table-control").datagrid("getChecked");//add
                    ef.loading.show();
                    implement.control = ef.util.getTablePageData($('#table-control'),implement.pageData);
                    var rules=[];
                    $(implement.control).each(function (i,il) {
                        il.direction=il.direction?il.direction:" ";
                        il.cidr=il.cidr?il.cidr:" ";
                        il.ethertype=il.ethertype?il.ethertype:" ";
                        rules.push({
                            "direction":il.direction,
                            "protocol":il.protocol,
                            "cidr":il.cidr,
                            "from_port":il.from_port,
                            "to_port":il.to_port,
                            "ethertype":il.ethertype
                        });
                    });
                    console.log(rules);
                    ef.getJSON({//给项目下添加规则
                        url:api.getAPI("security.project.control.rule")+"/"+ef.localStorage.get("setting.project.Detail.id")+"/rule",
                        type:"put",
                        data:{"rules":rules},
                        success:function(response){
                            ef.Dialog.close("ControlDetail.host");
                            ef.loading.hide();
                            ef.getJSON({//刷新项目下已有的规则列表
                                url:api.getAPI("cal.security.group.list")+"?tenant_id="+ef.localStorage.get("setting.project.Detail.id"),
                                type:"get",
                                useLocal:false,
                                success:function(resp){
                                    ef.localStorage.put("tenant_control_rules",resp);
                                    //$('#tenantcontrollist').datagrid({data:resp}).datagrid("clientPaging");
                                }
                            });
                            ef.placard.tick(ef.util.getLocale("setting.project.placard.addRule"));
                        },
                        error:function(error){
                            console.log(error);
                            ef.loading.hide();
                        }
                    });
                }
               // var isForce=true;
            })

        })
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});