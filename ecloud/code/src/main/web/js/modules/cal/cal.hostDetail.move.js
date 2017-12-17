/**
 * Created by hanxf on 2016/3/11.
 */
/**
 * Created by wangahui1 on 15/11/6.
 */
define(["module","clientPaging","api","user"],function(module,client,api,user)
{
    var implement=new ef.Interface.implement();
    var isLocal=false;
    implement.table = function () {
      $("#moveList").datagrid({
          singleSelect:true,
          pagination:true,
          pageSize:10,
          columns:[[
              {field:'name',title:ef.util.getLocale("cal.vm.host.table.name"),width:'35%',formatter:function(val){return val}},
              {field:'ip',title:ef.util.getLocale("cal.vm.host.table.ip"),width:'35%',formatter:function(val){return val}},
              {field:'cpus',title:ef.util.getLocale("cal.vm.host.table.quota"),width:'40%',formatter: function (val,row) {
                  return val+"核"+Math.ceil(row.memory_mb/1024)+"GB";
              }}
          ]]
      });
    };
    implement.data = function () {
      ef.getJSON({
          url:api.getAPI("cal.host.migrate")+"/"+ef.localStorage.get("hostDetail_id")+"/available",
          type:"get",
          dataType:'json',
          useLocal:isLocal,
          success: function (response) {
              $("#moveList").datagrid({data:response}).datagrid("clientPaging");
          },
          error:function(error){
              console.log(error);
          }
      })
    };
    implement.redraw= function () {
        $(document).ready(function()
        {
            $("#move_ok").parent().css({opacity: 0.4});
            $("#host").append($(".data_hypervisor").text());
            implement.data();
            implement.table();
            var state = ef.localStorage.get("hostDetail_state");
            var host;
            $("#moveList").datagrid({
                onSelect: function () {
                    $("#move_ok").parent().css({opacity: 1});
                }
            });
            if(state=="active"){
                host = {"destination_host":"","migrate_policy":""};
            }
            if(state=="stopped"){
                host = {"destination_host":"","migrate_policy":""}
            }
                $("#move_ok").click(function () {
                    if($("#move_ok").parent().css("opacity")==1) {
                        ef.loading.show();
                        var row = $("#moveList").datagrid('getSelected');
                        var name;
                        $(row).each(function (i, il) {
                            name = host.destination_host = il.name;
                        });
                        ef.getJSON({
                            url: api.getAPI("cal.host.migrateok") + "/" + ef.localStorage.get("hostDetail_id") + "/migrate",
                            type: "post",
                            data: host,
                            success: function (response) {
                                ef.loading.hide();
                                ef.Dialog.closeAll();
                                ef.nav.reload();
                                ef.placard.doing(ef.util.getLocale("host.iconmenu.migrate.placard"));

                            },
                            error: function (error) {
                                console.log(error);
                                ef.loading.hide();
                            }
                        })
                    }
                });
            $("#move_cancel").click(function () {
                ef.Dialog.closeAll();
            });
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
