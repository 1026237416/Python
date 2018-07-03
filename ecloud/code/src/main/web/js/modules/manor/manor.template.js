define(['easyui','clientPaging',"domReady","module","api","resize"], function (eu,clientPaging,domReady,module,api) {
    var implement=new ef.Interface.implement();
    implement.init = function () {
        $("#manor-templates-search").textbox({
            prompt: ef.util.getLocale("apply.template.search-item.label"),
            iconCls:'icon-search',
            iconAlign:'left',
            onChange: function () {
                implement.filter();
            }
        });
        $("#manor-templateGrid").datagrid({
            autoHeight:true,
            columns: [[
                {field: "name", width: "20%", title: "ID",formatter:function(val,row,index)
                {
                    var $dom=$('<a class="table-link"></a>');
                    $dom.text(val);
                    $dom.click(function()
                    {
                        ef.nav.goto('manorTemplateDetail.html','manor.template.detail',ef.util.formatPageData(row),null,"manor.template");
                    });
                    return $dom;
                }
                },
                {field: "label", width: "20%", title: ef.util.getLocale("apply.template.table.name")},
                {field: "description", width: "25%", title: ef.util.getLocale("apply.template.table.description"),formatter:function(val,row){
                    if(!val){return "-"}
                    return val;
                }},
                {field: "status", width: "20%", title: ef.util.getLocale("apply.template.table.state"), formatter: function (val,row) {
                    if(val==1){
                        return '<div style="display: inline-block;vertical-align: middle"><i class="icon-status-done-success grid_cell_icon" style="vertical-align: middle"></i><span class="hostSlave_state" style="display: inline-block;vertical-align: middle">'+ef.util.getLocale("apply.template.table.state.on")+'</span>'+'</div>'
                    }
                    else{return '<div style="display: inline-block;vertical-align: middle"><i class="icon-status-done-fail grid_cell_icon" style="display: inline-block;vertical-align: middle"></i><span class="hostSlave_state" style="display: inline-block;vertical-align: middle">'+ef.util.getLocale("apply.template.table.state.off")+'</span></div>';}
                }},
                {field: 'action', width: "20%", title: ef.util.getLocale("apply.template.table.action"), formatter: function (val, row) {
                    if(row.status==1){
                        var dom = $('<span></span>');
                        dom.html('<i class="icon-offline templates-action-icon"></i><a style="text-decoration: none;color: #4DA4D6;top: 0px;padding-left: 3px;position: relative">下线</a>');
                        dom.click(function () {
                            ef.getJSON({
                                url:api.getAPI("manorTemplate")+"/templates/status/"+row.name,
                                type:"post",
                                data:{value:0},
                                success: function (response) {
                                    ef.nav.reload();
                                }
                            })
                        });
                        return dom;
                    }
                    else if(row.status==0) {
                        var $dom = $('<span></span>');
                        $dom.html('<i class="icon-online templates-action-icon"></i><a style="text-decoration: none;color: #4DA4D6;position: relative;top: 0px;padding-left: 3px;">上线</a>');
                        $dom.click(function () {
                            ef.getJSON({
                                url: api.getAPI("manorTemplate") + "/templates/status/" + row.name,
                                type: "post",
                                data: {value: 1},
                                success: function (response) {
                                    ef.nav.reload();
                                }
                            })
                        });
                        return $dom;
                    }
                }
                }
            ]]
        }).datagrid("loading");
        $("#reset").click(function () {
            $("#manor-templates-search").textbox('clear');
        });
    };
    implement.filter = function () {
        var opt = $("#manor-templates-search").textbox('getValue').toLowerCase();
        $("#manor-templateGrid").datagrid({
            loadFilter: function(data){
                var tmp = {total:0,rows:[]};
                $(data).each(function (i,il) {
                    if(il.name.toLowerCase().indexOf(opt)!=-1||il.label.toLowerCase().indexOf(opt)!=-1){
                        tmp.total = tmp.total+1;
                        tmp.rows.push(il);
                    }
                    opt = $("#manor-templates-search").textbox('getValue').toLowerCase();
                });
                return tmp;
            }
        }).datagrid('clientPaging').datagrid("goto",1);
    };
    implement.addManorTemplateDialog=function() {
        new ef.Dialog("addManorTemplateDialog",{
            title: ef.util.getLocale("apply.template.create.title"),
            width:965,
            height:591,
            closed: false,
            cache: false,
            nobody:false,
            href: 'views/addManorTemplateCreate.html',
            modal: true,
            onClose:function()
            {
                require.undef("manor.template.create");
                $(".tooltip").hide();
            },
            onLoad:function()
            {
                var cover=$(".viewstack-box-dlg").coverlayer({loadingHeight:500});
                require(["manor.template.create"],function(module)
                {
                    (new module).implement.redraw(cover);
                    ef.i18n.parse();
                });
            }
        });
    };
    implement.refTemplate = function (isFirst) {
        ef.getJSON({
            url:ef.util.url(api.getAPI("manorTemplate")+"/templates"),
            type:"get",
            success: function (response) {
                response.reverse();
                if(isFirst){
                    $("#manor-templateGrid").datagrid({data:response}).datagrid('clientPaging');
                }
                else{$("#manor-templateGrid").datagrid('loadData',response);}
            }
        })
    };
    implement.redraw = function () {
        implement.init();
        implement.refTemplate(true);
        var _iconmenu = $("#js-menus-wrapper").iconmenu([
            {
                iconClass: "icon-menus-icon-add",
                tip: ef.util.getLocale("global.button.create.label"),
                id: "0",
                "access":[7,8,88],
                click: function () {
                    implement.addManorTemplateDialog();
                }
            },
            {
                iconClass: "icon-menus-icon-delete",
                tip: ef.util.getLocale("global.button.delete.label"),
                id: "1",
                click: function () {
                    var dg = $("#manor-templateGrid").datagrid('getSelected');
                    var name = dg.name;
                    ef.messager.confirm('deleting', ef.util.getLocale("apply.template.delete") +"'"+ name + "'?", null,function (ok) {
                        if (ok) {
                            ef.loading.show();
                            ef.getJSON(
                                {
                                    url: api.getAPI("manorTemplate") + "/templates/" + dg.name,
                                    type: "delete",//get,post,put,delete
                                    data:{},
                                    success: function () {
                                        ef.loading.hide();
                                        ef.nav.reload();
                                    },
                                    error: function (error) {
                                        ef.loading.hide();
                                    }
                                });
                            _iconmenu.setStatus(1, true);
                        } else {
                            $("#manor-templateGrid").datagrid("unselectAll");
                            _iconmenu.setStatus(1, true);
                        }
                    });
                }
            }
        ]);
        _iconmenu.setStatus("1",true);
        $("#manor-templateGrid").datagrid({
            onSelect: function (rowIndex, rowData) {
                if(rowData.status==0){
                    _iconmenu.setStatus("1",false);
                }else{_iconmenu.setStatus("1",true);}
            }
        });
        implement.filter();
        $("#manor-templateGrid").datagrid("loading");
        $("#manor-templateGrid").datagrid("autoData");
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});