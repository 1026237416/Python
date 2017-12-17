/**
 * Created by xuyunxia on 2015/10/22.
 */
define(["domReady",'easyui','clientPaging',"module",'api','setting.tenanteDetail','security'],function(domReady,ey,clientPaging,module,api,td,security)
{
    var implement=new ef.Interface.implement();
    implement.init=function(){
        $("th[field='name']").append(ef.util.getLocale('setting.project.detail.user.datagrid.name'));
        $("th[field='displayname']").append(ef.util.getLocale('setting.project.detail.user.datagrid.name'));
        $("th[field='email']").append(ef.util.getLocale('setting.project.detail.user.datagrid.email'));
        $("th[field='phone']").append(ef.util.getLocale('setting.project.detail.user.datagrid.tel'));
        $("th[field='security']").append(ef.util.getLocale('setting.project.detail.user.datagrid.secrets'));
        $("th[field='role']").append(ef.util.getLocale('setting.project.detail.user.datagrid.proname'));
        $("#hl_ok a").append(ef.util.getLocale('global.button.confirm.label'));
        $("#hl_cancel a").append(ef.util.getLocale('global.button.cancel.label'));
        $("#hl_ok").css("opacity",0.4);
        $("#hl_cancel").click(function () {
            ef.Dialog.closeAll();
        });
    };
    implement.getResp= function (callback) {
        ef.getJSON(
            {
                url: api.getAPI("setting.project.datagrid_project") + "/" + ef.localStorage.get("setting.project.Detail.id") + "/users",
                type: "get",//get,post,put,delete
                isForce: implement.isForce,
                success: function (response) {
                    var resp=[];
                    $(response).each(function (i,il) {
                            resp.push(il.name);
                    });
                    callback(resp);
                },
                error: function (error) {
                    console.log(error);
                }
            });
    };
    implement.filter= function (item,arrs) {
        var bool=false;
        $(arrs).each(function(i,il)
        {
            if(il==item.name)
            {
                bool=true;
                return;
            }
        });
        return bool;
    };
    implement.tableInit= function () {
        $('#table-json').datagrid(
            {
                singleSelect:false,
                width:'100%',
                height: 428,
                pagination:true,
                columns: [
                    [
                        {field: "ck1", width: "15%",checkbox:true},
                        {field: "name", width: "23%", title: ef.util.getLocale("setting.user.datagrid.uid"),
                            formatter: function(val) {
                                if(val){
                                    return '<div>' + val +'</div>'
                                }else{
                                    return '<div style="padding-left: 3px">-</div>'
                                }
                            }
                        },
                        {field: "displayname", width: "25%", title: ef.util.getLocale('setting.project.detail.user.datagrid.name'),
                            formatter: function(val) {
                                if(val){
                                    return '<div>' + val +'</div>'
                                }else{
                                    return '<div style="padding-left: 3px">-</div>'
                                }
                            }
                        },
                        {field: "email", width: "27%", title: ef.util.getLocale('setting.project.detail.user.datagrid.email'),
                            formatter: function(val) {
                                if(val){
                                    return '<div>' + val +'</div>'
                                }else{
                                    return '<div style="padding-left: 3px">-</div>'
                                }
                            }
                        },
                        {field: "phone", width: "26%", title: ef.util.getLocale('setting.project.detail.user.datagrid.tel'),
                            formatter: function(val) {
                                if(val){
                                    return '<div>' + val +'</div>'
                                }else{
                                    return '<div style="padding-left: 3px">-</div>'
                                }
                            }
                        }
                       /* {field: "security", width: "18%", title: ef.util.getLocale('setting.user.datagrid.secrets'),formatter: function (val,row) {
                     return security.getSecurityByValue(val).label;
                     }}*/
                    ]
                ],
                onCheck:function(){
                    $("#hl_ok").css("opacity",1);
                },
                onUncheck:function(){
                    if($("#table-json").datagrid("getChecked").length!=0){
                        $("#hl_ok").css("opacity",1);
                        return
                    }
                    $("#hl_ok").css("opacity",0.4);
                },
                onCheckAll:function(){
                    $("#hl_ok").css("opacity",1);
                },
                onUncheckAll:function(){
                    $("#hl_ok").css("opacity",0.4);
                }
            });
    };
    implement.redraw = function () {
        domReady(function(){
            implement.init();
            implement.tableInit();
            implement.getResp(function (resp) {
                ef.getJSON(
                    {
                        url: api.getAPI("setting.user.datagrid_users"),
                        type: "get",//get,post,put,delete
                        isForce: true,
                        success: function (response) {
                            var data = [];
                            $(response).each(function (i, il) {
                                if (il.role) { //所在的角色
                                    for (var j = 0; j < il.role.length; j++) {
                                    /*    il.role = il.roles[j].name;*/
                                        il.uRole = il.role.name;
                                    }
                                }
                                if (il.tenants) {  //所在的项目
                                    for (var a = 0; a < il.tenants.length; a++) {
                                        il.tenants = il.tenants[a].name;
                                    }
                                }
                                var tmp=implement.filter(il,resp);
                                if(!tmp)
                                {
                                  data.push(il);
                                }
                            });
                            data=ef.util.sort("name",data);
                            $("#table-json").datagrid({data: data}).datagrid('clientPaging',{
                                onBeforePage: function (num, size, data) {
                                    implement.pageData = data;
                                }
                            });
                        }
                    });
            });
            $("#hl_ok").click(function(){
                if($("#hl_ok").css("opacity")=="1"){
                    ef.loading.show();
                    implement.user = ef.util.getTablePageData($('#table-json'),implement.pageData);
                    var userId = [];
                    $(implement.user).each(function (i,il) {
                        userId.push(il.name);
                    });
                    ef.getJSON(
                        {
                            url: api.getAPI("setting.project.datagrid_project") + "/" + ef.localStorage.get("setting.project.Detail.id") +"/users",
                            type: 'post',
                            data:userId,
                            success: function (response) {
                                ef.loading.hide();
                                ef.Dialog.close("tenantDetail.host");
                                //td.tenantDetail(ef.localStorage.get("setting.project.Detail.id"),false);
                                ef.placard.tick(ef.util.getLocale("setting.project.placard.addtenate"));
                            },
                            error: function (error) {
                                ef.loading.hide();
                            }
                        });
                }
            });
            $('#table-json').datagrid('loading');
        })
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
