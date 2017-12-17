    /**
 * Created by admin on 2016/1/29.
 */
define(["easyui","clientPaging","module","api","user"],function (easyui,clientPaging,module,api,user) {
    var implement=new ef.Interface.implement();
    implement.initTable = function () {
        $("#hostlist").datagrid(
            {   singleSelect:false,
                pagination:false,
                columns: [
                    [
                        {field: "ck",checkbox:true, title: ef.util.getLocale('setting.project.detail.description.usernamefield')},
                        {field: "name", width: "35%", title: "主机名"},
                        {field: "ip", width: "35%", title:"IP"},
                        {field: "cpus", width: "35%", title: ef.util.getLocale('order.ready.info.grid.head.quota'), formatter: function (val, row) {
                            return  val+"核"+Math.ceil(row.memory_mb/1024)+"GB";
                        }}
                    ]
                ]
            });
    };
    implement.checked = function (callback) {
        ef.getJSON({
            url: api.getAPI("subnet") + "/" + ef.localStorage.get("project.subnet") + "/tenant/" + ef.localStorage.get("projectDetail.id") +"/hosts",
            type: "get",//get,post,put,delete
            success: function (response) {
                callback(response);
            }
        });
    };
    implement.redraw=function() {
        $(document).ready(function()
        {
            implement.initTable();
            if(user.isSuper()||user.isSys()){
                $(".panel-header").append('<div class="icons-host-list" style="height: 40px;float: right;width: 70px;margin-right: 50px;"></div>');
            }
            $("#hostlist").datagrid('hideColumn','ck');
            implement.checked(function (response) {
                $('#hostlist').datagrid({data: response});
            });
            var _hostList = $(".icons-host-list").togglebutton([
                [
                    {
                        iconClass: "icon-menus-icon-edit",
                        tip: ef.util.getLocale("setting.user.edit.tip"),//编辑
                        id: '1',
                        access:[8,88],
                        click: function (menu) {
                            _hostList.goto(1);
                            $("#hostlist").datagrid('showColumn','ck');
                            ef.getJSON({
                                url: api.getAPI("order.wait.Detail.combo.vlan")+"/"+ef.localStorage.get("project.vlan")+"/hosts",
                                type: "get",//get,post,put,delete
                                success: function (response) {
                                    implement.checked(function (resp) {
                                        var index = [];
                                        $(response).each(function (e,el) {
                                            $(resp).each(function (i,il) {
                                                if(el.id==il.id){
                                                    el.checked = true;
                                                }
                                            });
                                        });
                                        $('#hostlist').datagrid({data: response});
                                        $(response).each(function (i,il) {
                                           if(il.checked){
                                               $('#hostlist').datagrid('selectRow',i);
                                           }
                                        });
                                        $('#hostlist').datagrid({
                                            onCheck: function (rowIndex,rowData) {
                                                rowData.checked = true;
                                                _hostList.setStatus(2,false);
                                            },
                                            onUncheck: function (rowIndex,rowData) {
                                                rowData.checked = false;
                                                _hostList.setStatus(2,false);
                                            },
                                            onCheckAll: function (rows) {
                                                $(rows).each(function (i,il) {
                                                   il.checked = true;
                                                });
                                                _hostList.setStatus(2,false);
                                            },
                                            onUncheckAll: function (rows) {
                                                $(rows).each(function (i,il) {
                                                    il.checked = false;
                                                });
                                                _hostList.setStatus(2,false);
                                            }
                                        });
                                    });
                                }
                            });
                        }
                    }
                ],
                [
                    {
                        iconClass: "icon-menus-icon-save",
                        tip: ef.util.getLocale("setting.user.save.tip"),//保存
                        id: "2",
                        access:[8,88],
                        click: function (menu) {
                            var _row = $('#hostlist').datagrid("getRows");
                            var hostId = [];
                            ef.util.map(_row, function (num) {
                                if(num.checked&&num.checked==true){
                                    hostId.push(num.id);
                                }
                            });
                            hostId = ef.util.without(hostId,null);
                            ef.getJSON(
                                {
                                    url: api.getAPI("subnet") + "/" + ef.localStorage.get("project.subnet") + "/tenant/" + ef.localStorage.get("projectDetail.id") + "/hosts",
                                    type: "post",//get,post,put,delete
                                    data: {
                                        "host_ids": hostId
                                    },
                                    success: function (response) {
                                        $("#hostlist").datagrid('hideColumn','ck');
                                        _hostList.goto(0);
                                        ef.Dialog.close("getHostList");
                                        ef.placard.tick(ef.util.getLocale("setting.project.placard.edithost"));
                                    }
                                });

                        }
                    }
                ]
            ]);
            _hostList.setStatus(2,true);
            $('#hostlist').datagrid("loading");
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
