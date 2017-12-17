define(["easyui","clientPaging","module"],function (easyui,clientPaging,module) {
    var implement=new ef.Interface.implement();
    implement.redraw=function(hostGridData,hostCheckedData) {
        $(document).ready(function()
        {
            $("#hostlist").datagrid(
                {   singleSelect:false,
                    pagination:true,
                    pageSize:10,
                    columns: [
                        [
                            {field: "ck",checkbox:true, title: ef.util.getLocale('setting.project.detail.description.usernamefield')},
                            {field: "name", width: "35%", title: "主机名"},
                            {field: "ip", width: "35%", title:"IP"},
                            {field: "vlans", width: "35%", title:"所在vlan",formatter:function(val)
                            {
                                var dom=$('<div></div>');
                                dom.attr("title",val);
                                dom.text(val);
                                return dom;
                            }}
                        ]
                    ]
                });
            $("#hostlist").datagrid('hideColumn','ck');
            if(hostGridData)
            {
                $('#hostlist').datagrid({data: hostGridData}).datagrid('clientPaging');
            }
            if(ef.Dialog.getDialog("getHostList").param.param.isEdit){
                $("#hostlist").datagrid('showColumn','ck');
                $(".button-route").show();

            }else
            {
                $(".button-route").hide();
                if(hostCheckedData)
                {
                    $('#hostlist').datagrid({data: hostCheckedData}).datagrid('clientPaging');
                }
            }
            $("#hl_ok").click(function () {
                ef.event.trigger("selectHostListEvent",
                    {
                        param: ef.Dialog.getDialog("getHostList").param.param,
                        data: $('#hostlist').datagrid("getChecked")
                    });
                ef.Dialog.close("getHostList");
            });

        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});