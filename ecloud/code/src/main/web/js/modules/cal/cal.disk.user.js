define(["module","api","cal.disk","clientPaging"],function (module,api,caldisk,clientPaging) {
    var implement=new ef.Interface.implement();
    implement.init = function () {
        //implement.cover=$("#hostAllotUserDialog .plain-datagrid").coverlayer({loadingHeight:512},{opaque:true});
        $("#diskUser").datagrid({
            singleSelect:true,
            pagination:true,
            pageSize:10,
            columns:
                [[
                    {field:"name" , width:"25%",title:ef.util.getLocale('setting.user.datagrid.uid')},
                    {field:"displayname", width:"30%",title:ef.util.getLocale('setting.user.datagrid.name')},
                    {field:"email", width:"30%",title:ef.util.getLocale('setting.user.datagrid.email'),formatter: function (val) {
                        if(!val){return "-";}
                        return val;
                    }},
                    {field:'phone', width:"20%",title:ef.util.getLocale('setting.user.datagrid.phone'),formatter: function (val) {
                        if(!val){return "-";}
                        return val;
                    }}
                ]]
        });
        $("#diskUserOk").parent().css({opacity:0.4});
        $("#diskUserCancel").click(function () {
           ef.Dialog.closeAll();
        });
        $("#diskUser").datagrid("loading");
    };
    implement.redraw= function (isSimple,tenantId) {
        this.init();
        ef.getJSON({
            url:api.getAPI("setting.project.datagrid_project")+"/"+(isSimple?tenantId:ef.localStorage.get("diskUserTenantId"))+"/users",
            type:"get",
            success:function(response){
                //implement.cover.hide();
                $("#diskUser").datagrid({data:response}).datagrid('clientPaging');
            },error:function()
            {
                //implement.cover.hide();
            }
        });
        $("#diskUser").datagrid({
            onCheck: function () {
                $("#diskUserOk").parent().css({opacity:1});
            }
        });
        $("#diskUserOk").click(function () {
            if($("#diskUserOk").parent().css('opacity')!=1){return;}
            ef.loading.show();
            var check = $("#diskUser").datagrid('getChecked');
            if(isSimple)
            {
                ef.event.trigger("cal.allotuser.event",check);
                return;
            }
            var userId;
            $(check).each(function (i,il) {
                userId = il.id;
            });
            ef.getJSON({
                url:api.getAPI("cal.disk.user"),
                type:"post",
                data:{
                    "volume-user": [
                        {
                            "volume_id": ef.localStorage.get("diskId"),
                            "user_id": userId
                         }]
                    },
                success: function (response) {
                    ef.Dialog.close('userdisk');
                    ef.nav.reload();
                    ef.loading.hide();
                    ef.placard.tick(ef.util.getLocale("cal.dis.adduser.success"));
                },
                error: function () {
                    ef.loading.hide();
                }
            })
        });
        $("#diskUser").datagrid('loading');
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
