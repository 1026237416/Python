define(['easyui','clientPaging','domReady',"module",'user','api','order.ready'],function(easyui,client,domReady,module,user,api,orderReady){
    var implement=new ef.Interface.implement();
    implement.orderWaitRef = function (startNumber) {
        var arg=arguments,
            ordertype = $('#log_all_user_sys_sel').combobox('getValue');
        ef.getJSON(
            {
                url:api.getAPI("order.wait.datagrid_list"),
                type:"get",//get,post,put,delete
                data:(function () {
                    var obj = {};
                    obj.limit = 10;
                    obj.start = startNumber;
                    obj.approved='false';
                    if(ordertype != ""){
                        obj.type=ordertype;
                    }
                    return obj;
                })(),
                success:function(response,allResult)
                {
                    if(response.length === 0 ){
                        $('#order_wait_list').datagrid({data:[]}).datagrid("clientPaging");
                    }else{
                        $(response).each(function (i,il) {
                            il.operator = il.creator.displayname;
                        });
                        $('#order_wait_list').datagrid("loadData",response).datagrid('getPager').pagination(
                            {
                                showPageList:false,
                                showRefresh:false,
                                onSelectPage:function(pageNumber, pageSize)
                                {
                                    var pagenumber = (pageNumber-1)*10;
                                    arg.callee(pagenumber);
                                }
                            }).pagination("refresh",{total:allResult.total,pageNumber:(startNumber/10)+1});
                    }
                    $('#order_wait_list').datagrid('loaded');
                }
            });
    };
    implement.initCombobox = function () {
        $('#log_all_user_sys_sel').combobox({
            prompt:ef.util.getLocale("order.ready.search.type.prompt"),
            valueField:"value",
            editable:false,
            formatter: function (row) {
                var opts = $(this).combobox('options');
                return row[opts.textField]=orderReady.getType(row.value);
            }
        });
    };
    implement.getComboboxData = function () {
        ef.getJSON({
            url:api.getAPI("order.type.search"),
            type: 'get',
            useLocal:true,
            success:function(response){
                $('#log_all_user_sys_sel').combobox({
                    data:response,
                    onChange:function()
                    {
                        implement.orderWaitRef(0);
                    }
                })
            }
        })
    };
    implement.initOrderList = function () {
        $('#order_wait_list').datagrid({
            pagination:true,
            pageSize:10,
            emptyText:"暂无数据",
            columns:[[
                {field:'id',title:ef.util.getLocale("order.ready.table.ID"),width:'20%',formatter: function(val,row,index){
                    var host = ef.util.getLocale("order.wait.host.shutup");
                    var disk = ef.util.getLocale("order.wait.disk.shutup");
                    if(user.isSec()||user.isSuper()){
                        var _row=ef.util.escapeJSON(JSON.stringify(row));
                        if(row.type=="0"){ //"云主机"
                            return '<a href="#" class="table-link" onclick="ef.nav.goto(\'order.wait.host.html\',\'order.wait.sec\',\''+_row+'\',null,\'order.wait\')">'+val+'</a>';//\'云主机开通\'
                        }
                        if(row.type=="1"){//"云硬盘"
                            return '<a href="#" class="table-link" onclick="ef.nav.goto(\'order.wait.host.html\',\'order.wait.sec\',\''+_row+'\',null,\'order.wait\')">'+val+'</a>';//\'云硬盘开通\'
                        }
                    }
                    if(user.isSys()||user.isAudit()){
                        var _row=ef.util.escapeJSON(JSON.stringify(row));
                        if(row.type=="0"){//"云主机"
                            return '<a href="#" class="table-link" onclick="ef.nav.goto(\'order.wait.host.html\',\'order.wait.sec\',\''+_row+'\',null,\'order.wait\')">'+val+'</a>';//\'云主机开通\'
                        }
                        if(row.type=="1"){//"云硬盘"
                            return '<a href="#" class="table-link" onclick="ef.nav.goto(\'order.wait.host.html\',\'order.wait.sec\',\''+_row+'\',null,\'order.wait\')">'+val+'</a>';//\'云硬盘开通\'
                        }
                    }
                }},
                {field:'type',title:ef.util.getLocale("order.wait.table.type"),width:'20%',editor:'text',formatter: function(val,row,index){
                    if(val==0){
                        return "云主机";
                    }
                    if(val==1){
                        return "云硬盘";
                    }
                }},
                {field:'operator',title:ef.util.getLocale("order.wait.table.operator"),width:'20%'},
                {field:"des",title:ef.util.getLocale("order.ready.info.label.des"),width:'25%',formatter:function(val){
                    var dom=$("<div></div>");
                    dom.text(val).attr("title",val);
                    return dom;
                }},
                {field:'commit_time',title:ef.util.getLocale("order.wait.table.time"),width:'25%',formatter: function (val,row) {
                    return ef.util.number2time(val,"Y-M-D h:m:s",true);
                }}
            ]]
        });
    };
    implement.redraw=function() {
        $(document).ready(function () {
            implement.initCombobox();
            implement.initOrderList();
            implement.getComboboxData();
            implement.orderWaitRef(0);
            $("#reset").click(function () {
                $('#log_all_user_sys_sel').combobox('clear');
                implement.orderWaitRef(0);
            });
            $('#order_wait_list').datagrid('loading');
        })
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});