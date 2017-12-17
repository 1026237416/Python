define(['clientPaging', "module", 'user','api'], function (clientPaging, module, user,api) {
    var implement = new ef.Interface.implement();
    implement.getType = function (type) {
        var val = "";
        switch (Number(type)) {
            case 0:
            {
                val = ef.util.getLocale("order.type.host");
                break;
            }
            case 1:
            {
                val = ef.util.getLocale("order.type.disk");
                break;
            }
            default:
            {
                val = "unknow";
            }
        }
        return val;
    };
    implement.getStatus=function(status) {
        var val="";
        switch (Number(status)) {
            case 1:
            {
                val=ef.util.getLocale("order.ready.create.doing");//失败
                break;
            }
            case 2:
            {
                val=ef.util.getLocale("order.ready.ready");//撤销
                break;
            }
            case 3:
            {
                val=ef.util.getLocale("order.ready.nook");//完成
                break;
            }
            case 4:
            {
                val=ef.util.getLocale("order.ready.create.fail");//开通中
                break;
            }
            case 5:
            {
                val=ef.util.getLocale("order.ready.revoke");//拒绝
                break;
            }
        }
        return val;
    };
    implement.initReadyCombox = function () {
        $('#order_type_sel').combobox({
            prompt:ef.util.getLocale("order.ready.search.type.prompt"),
            valueField:"value",
            editable:false,
            formatter: function (row) {
                var opts = $(this).combobox('options');
                return row[opts.textField]=implement.getType(row.value);
            }
        });
        $('#order_status_sel').combobox({
            prompt: ef.util.getLocale("order.ready.search.status.prompt"),
            valueField:"value",
            editable:false,
            formatter: function (row) {
                var opts = $(this).combobox('options');
                return row[opts.textField]=implement.getStatus(row.value);
            }
        });
    };
    implement.getReadyComboboxData = function () {
        ef.getJSON({
            url:api.getAPI("order.type.search"),
            type: 'get',
            useLocal:true,
            success:function(response){
                $('#order_type_sel').combobox({
                    data:response,
                    onChange:function()
                    {
                        implement.orderReadyRef(0);
                    }
                })
            }
        });
        ef.getJSON({
            url:api.getAPI("order.state.search"),
            type: 'get',
            useLocal:true,
            success:function(response){
                $('#order_status_sel').combobox({
                    data:response,
                    onChange:function()
                    {
                        implement.orderReadyRef(0);
                    }
                })
            }
        })
    };
    implement.initReadylist = function () {
        $('#order_ready_list').datagrid({
            pagination: true,
            pageSize: 10,
            emptyText:"暂无数据",
            columns: [[
                {
                    field: 'id',
                    title: ef.util.getLocale("order.ready.table.ID"),
                    width: '14%',
                    formatter: function (val, row, index) {
                        var row=ef.util.escapeJSON(JSON.stringify(row));
                        return '<a href="#" class="table-link" onclick="ef.nav.goto(\'order.ready.detail.html\',\'order.ready.detail\',\''+row+'\',null,\'order.ready\')">' + val + '</a>';
                    }
                },
                {
                    field: 'type',
                    title: ef.util.getLocale("order.ready.table.type"),
                    width: '13%',
                    formatter: function (val, row, index) {
                        return implement.getType(val);
                    }
                },
                {field: 'username', title: ef.util.getLocale("order.ready.table.user"), width: '13%',formatter:function(val,row){
                  /*  if(row.user!=null) {
                        var $dom=$('<div></div>');
                        var $sDom=$('<span></span>');
                        $sDom.text(val);
                        $dom.append($sDom);
                        $sDom.tooltip({
                            content:row.user.name
                        });
                        return $dom;
                    }*/
                    if(row.user!=null) {
                        var $dom = $('<div></div>');
                        $dom.text(val);
                        $dom.attr({title: row.user.name});
                        return $dom;
                    }
                }},
                {field: 'operator', title: ef.util.getLocale("order.ready.table.operator"), width: '13%'},
              /*  {field: 'auditor', title: ef.util.getLocale("order.ready.table.auditor"), width: '14%'},*/
                {
                    field: 'commit_time',
                    title: ef.util.getLocale("order.ready.table.subtime"),
                    width: '18%',
                    formatter: function (val, row, index) {
                        return ef.util.number2time(val,"Y-M-D h:m:s",true);
                    }
                },
                {
                    field: 'complete_time',
                    title: ef.util.getLocale("order.ready.table.overtime"),
                    width: '17%',
                    formatter: function (val, row, index) {
                        if(val==null){
                            return;
                        }
                        return ef.util.number2time(val,"Y-M-D h:m:s",true);
                    }
                },
                {
                    field: 'status',
                    title: ef.util.getLocale("order.ready.table.status"),
                    width: '17%',
                    formatter: function (val, row, index) {
                        var $dom = $('<span class="status_icon_box"><i></i><span>' + ef.util.getLocale('host.hostdetail.blocklistlabel.description.data_status2') + '</span></span>');
                        var icon = $dom.find("i");
                        var text = $dom.find("span");
                        switch (Number(val)) {
                            case 1:
                            {
                                icon.addClass("icon-status-done-fail");//失败
                                break;
                            }
                            case 2:
                            {
                                icon.addClass("icon-status-done-fail");
                                break;
                            }
                            case 3:
                            {
                                icon.addClass("icon-status-done-success");
                                break;
                            }
                            case 4:
                            {
                                icon.addClass("icon-status-doing");
                                break;
                            }
                            case 5:
                            {
                                icon.addClass("icon-status-done-fail");
                                break;
                            }
                        }
                        text.text(implement.getStatus(val));
                        return $dom[0].outerHTML;
                    }
                }
            ]]
        });

    };
    implement.orderReadyRef = function (startNumber) {
        var arg=arguments,
            ordertype =$('#order_type_sel').combobox('getValue'),
            orderstate = $('#order_status_sel').combobox('getValue');
        ef.getJSON(
            {
                url:api.getAPI("order.wait.datagrid_list"),
                type:"get",//get,post,put,delete
                data:(function () {
                    var obj = {};
                    obj.limit = 10;
                    obj.start = startNumber;
                    obj.approved='true';
                    if(ordertype != ""){
                        obj.type=ordertype;
                    }
                    if(orderstate != ""){
                        obj.status=orderstate;
                    }
                    return obj;
                })(),
                success:function(response,allResult)
                {
                    if(response.length === 0 ){
                        $('#order_ready_list').datagrid({data:[]}).datagrid("clientPaging");
                    }else{
                        $(response).each(function (i,il) {
                            if(il.user!=null){
                                il.username = il.user.displayname;
                            }
                            il.operator = il.creator.displayname;
                            if(il.auditor!=null){
                                il.auditor = il.auditor.displayname;
                            }
                        });
                        $('#order_ready_list').datagrid("loadData",response).datagrid('getPager').pagination(
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
                    $('#order_ready_list').datagrid('loaded');
                }
            });
    };
    implement.redraw = function () {
        $(document).ready(function () {
            implement.initReadyCombox();
            implement.initReadylist();
            implement.getReadyComboboxData();
            implement.orderReadyRef(0);
            $("#reset").click(function () {
                $('#order_type_sel').combobox('clear');
                $("#order_status_sel").combobox('clear');
                implement.orderReadyRef(0);
            });
            $('#order_ready_list').datagrid('loading');
        })
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});
