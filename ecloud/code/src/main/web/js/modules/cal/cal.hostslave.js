/**
 * Created by wangahui1 on 15/11/6.
 */
define(["easyui","clientPaging","module","api","resize"],function(easyui,client,module,api)
{
    var implement=new ef.Interface.implement();
    implement.filter = function () {
        var opt = ($("#mastslave").textbox('getValue')).toLowerCase();
        var state = $("#masState").combobox('getValue');
        state=state=="all"?"":state;
        $('#mastslave_grid').datagrid({
            loadFilter:function(data)
            {
                return ef.util.search(data,{filterFunction:function(item)
                    {
                        if(opt)
                        {
                            return (item.name&&item.name.toLowerCase().indexOf(opt)!=-1);

                        }else
                        {
                            return true;
                        }
                    }

                },{
                    key:"status",
                    value:state
                })
            }
        }).datagrid('clientPaging').datagrid("goto",1);
    };
    implement.combo = function () {
          $("#mastslave").textbox({
              prompt:'请输入主机名',
              iconCls:'icon-search',
              iconAlign:'left',
              valueField:'value',
              textField:'label' ,
              onChange: function (newValue,oldValue) {
                  implement.filter();
              }
          });
        ef.getJSON({
            url:'data/mastslavestatus.json',
            useLocal:true,
            type:"get",
            success: function (response) {
                $("#masState").combobox({
                    prompt:'请选择状态',
                    data:response,
                    valueField:'value',
                    textField:'label',
                    editable:false,
                    onChange: function (newValue, oldValue) {
                        implement.filter();
                        console.log("zhangm");
                    }
                });
            }
        });
    };
    implement.interData = function (isFirst) {
        ef.getJSON({
            url:api.getAPI("network.vlan.addVlan.host"),
            type:"get",//get,post,put,delete
            isForce:true,
            success:function(response) {
                if(isFirst){
                    $('#mastslave_grid').datagrid({data:response}).datagrid('clientPaging');
                    implement.hostsalveWebSocket();

                }
                else{
                    $('#mastslave_grid').datagrid('loadData',response).datagrid("goto",1);
                    implement.hostsalveWebSocket();
                }
                $('#mastslave_grid').datagrid("autoData");
            }
        });
    };


    /**
     * 宿主机socket
     */
    implement.hostsalveWebSocket=function(){
        var dataRows=$('#mastslave_grid').datagrid('getData').rows;
        if(!implement.socket){
            implement.socket=new ef.server.Socket(api.getAPI("cal.slave.socket",true),"cal.slave.socket");
        }
        implement.socket.onmessage=function(data){
            var usedata=JSON.parse(data.data);
            if(usedata.response=="refresh"){
                implement.interData(false);
                return;
            }
            $(dataRows).each(function(i,il){
                for(var e in usedata.response)
                {
                    if(il.id==e){
                        il.status=usedata.response[e];

                    }
                }
            });
            $("#mastslave_grid").datagrid('loadData',dataRows).datagrid('goto',1);
        };
    };


    implement.redraw= function () {
        $(document).ready(function()
        {
            $("#reset").click(function () {
                $("#mastslave").textbox('clear');
                $("#masState").combobox('clear');
                implement.interData();
            });
            implement.combo();
            $('#mastslave_grid').datagrid({
                singleSelect:true,
                pagination:true,
                pageSize:10,
                autoHeight:true,
                columns:[[
                    {field:'name',title:ef.util.getLocale("cal.vm.host.table.name"),width:'25%',formatter: function (val,row) {
                        var _row=ef.util.escapeJSON(JSON.stringify(row));
                        return  ' <a onclick="ef.nav.goto(\'mastslaveDetail.html\',\'cal.hostslave.hostslaveDetail\',\''+_row+'\',null,\'cal.hostslave\')" class="table-link">'+val+'</a>';
                    }},
                    {field:'ip',title:ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.ipfield"),width:'27%'},
                    {field:'cpus',title:ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.formatfield"),width:'27%',formatter: function (val,row) {
                        var memo = Math.ceil(row.memory_mb/1024);
                        return val+ef.util.getLocale("cal.host.util")+memo+ef.util.getLocale("cal.host.GB");
                    }},
                    {field:'status',title:ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.atatusfield"),width:'25%',formatter: function (val,row) {
                        if(val=="available"){
                            return '<i class="icon-status-done-success hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.able")+'</span>'
                        }
                        else{
                            return '<i class="icon-status-done-fail hostSlave_icon"></i><span class="hostSlave_state">'+ef.util.getLocale("cal.hostalave.status.disable")+'</span>'
                        }
                    }}
                ]]
            });
            $('#mastslave_grid').datagrid('loading');
            implement.interData(true);
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});