/**
 * Created by wangahui1 on 16/1/11.
 */
define(["easyui", "module", "domReady", "api","clientPaging","user","resize"], function (easyui, moudle, domReady, api,clientPaging,user) {
    var implement = new ef.Interface.implement();
    implement.init = function () {
        this.isForce = true;
        this.selectedRowData=null;
        this.tenantId=null;
        this.groupId=null;
        this.isdelete=false;
        $("#sec-search").textbox({
            prompt: ef.util.getLocale('security.group.list.search.tip'),
            iconCls: 'icon-search',
            iconAlign: 'left',
            onChange: function (newValue,oldValue) {
                implement.filter();
            }
        });
        this.getDirectionList(function(response){
            $(response).each(function(index, item){
                if(item.selected){
                    item.selected = false;
                }
            });
            $('#sec-state').combobox({
                prompt:ef.util.getLocale('security.group.list.state.tip'),
                textField:'label',
                valueField:'value',
                data:response,
                editable:false,
                onSelect:function(value){
                    implement.filter();
                }
            });
        });
        $('#reset').click(function(){
            ef.nav.reload();
            implement.resetSearch();
        });
        if(user.isSys() || user.isSuper()){
            $('.icon-menus-box').show();
            //$('#disk').addClass('padding_top60');
            $('#disk').removeAttr('style');
            this.operator=$("#js-menus-wrapper").iconmenu([
            {
                iconClass:"icon-menus-icon-add",
                tip:ef.util.getLocale('global.button.add.label'),//"新建"
                "access":[8,88],
                click:function(menu)
                {
                    new ef.Dialog("security.group.add",{
                        title: ef.util.getLocale("security.group.create.dialog.title"),
                        param:
                        {
                            tenantId:implement.tenantId,
                            groupId:implement.groupId
                        },
                        width:900,
                        height:546,
                        closed: false,
                        cache: false,
                        nobody:false,
                        href: 'views/addSecurityGroup.html',
                        modal: true,
                        onClose:function()
                        {
                            require.undef("security.group.create");
                        },
                        onLoad:function()
                        {
                            require(["security.group.create"],function(module)
                            {
                                module.redraw();
                            });
                        }
                    });
                }
            },
            {
                iconClass:"icon-menus-icon-delete",
                id:"1",
                tip:ef.util.getLocale('global.button.delete.label'),//删除
                "access":[8,88],
                click:function(menu)
                {
                    ef.messager.confirm('deleting',ef.util.getLocale("security.group.rule.delete.tip"),null,function(ok){
                        if(ok)
                        {
                            implement.deleteRow();
                        }
                    });
                }
            }
        ]);
            this.operator.setStatus(1,true);
        }
        /*else{
            $('.icon-menus-box').hide();
            $('#disk').removeClass('padding_top60');
            $('#disk').css({'padding-top':'15px'});
        }*/
        $("#securityGroupList").datagrid(
            {
                singleSelect: true,
                pagination: true,
                autoHeight:true,
                pageSize: 10,
                columns: [[
                    {
                        field: "direction",
                        width: "20%",
                        title:ef.util.getLocale("security.group.direction.label"),
                        formatter:function(val,row)
                        {
                            return ef.util.getLocale("security.group.grid.direction."+val);
                        }
                    },
                    {
                        field: "ethertype",
                        width: "20%",
                        title:ef.util.getLocale("security.group.ethertype.label"),
                        formatter:function(val){
                            if(val){return '<span style="padding-left: 3px;">'+val+'</span>'}
                            else{return '<span style="padding-left: 3px;">-<span>'};
                        }
                    },
                    {
                        field: "protocol",
                        width: "20%",
                        title:ef.util.getLocale("security.group.protocol.label"),
                        formatter:function(val,row)
                        {
                            var tempVal = null;
                            if(val == null){
                                tempVal= ef.util.getLocale("security.group.grid.any");
                                row.noneData = true;
                            }else{
                                tempVal = String(val).toUpperCase();
                                row.noneData = false;
                            }
                            return tempVal;
                        }
                    },
                    {
                        field: "port_range",
                        width: "20%",
                        title:ef.util.getLocale("security.group.port_range.label"),
                        formatter:function(val,row)
                        {
                            var tempVal = null;
                            if(val == null){
                                tempVal= ef.util.getLocale("security.group.grid.any");
                                row.noneData = true;
                            }else{
                                tempVal = val;
                                row.noneData = false;
                            }
                            return tempVal;
                        }
                    },
                    {
                        field: "cidr",
                        width: "22%",
                        title:ef.util.getLocale("security.group.cidr.label"),
                        formatter:function(val,row){
                            return val == null?"-":val;
                        }
                    }
                ]],
                onClickRow:function(rowIndex,rowData)
                {
                    if(user.isSys() || user.isSuper()){
                        if(rowData.default){
                            implement.operator.setStatus(1,true);
                        }else{
                            implement.operator.setStatus(1,false);
                            implement.selectedRowData=rowData;
                        }
                    }
                }
            }).datagrid("clientPaging",{onPage:function()
            {
                if(user.isSys() || user.isSuper()){
                    implement.operator.setStatus(1,true);
                }
            }});
            $("#securityGroupList").datagrid('loading');

    };
    /**刷新列表*/
    implement.refreshList=function(response)
    {
        //response=ef.util.sort("direction",response);
        if(!implement.isdelete){
            $("#securityGroupList").datagrid({data:response});
        }else{
            $("#securityGroupList").datagrid("loadData", response).datagrid("goto", 1);
        }
        implement.isdelete=false;
        $("#securityGroupList").datagrid("autoData");
    };
    /**获取安全组列表数据*/
    implement.getList = function (isForce, success, error) {
        ef.loading.show();
        ef.getJSON(
            {
                url: api.getAPI("cal.security.group.list"),
                type: "get",
                isForce: true,
                useLocal:false,
                success: function (response) {
                    ef.loading.hide();
                    implement.resetSearch();
                    success ? success(response) : null;
                },
                error: function (msg) {
                    error ? error(msg) : null;
                    ef.loading.hide();
                }
            });
    };
    /**
     * 删除一行
     * */
    implement.deleteRow=function()
    {
        ef.getJSON(
            {
                url:api.getAPI("security.group.create.global")+"/"+this.selectedRowData.id,
                type:"delete",
                isForce:this.isForce,
                success:function()
                {
                    implement.isdelete=true;
                    implement.getAndRefreshList();
                    implement.operator.setStatus(1,true);
                    ef.placard.tick(ef.util.getLocale('security.group.list.delete.success.tip'));
                },
                error:function(error)
                {
                    implement.operator.setStatus(1,true);
                    ef.placard.show(error.msg);
                    $("#securityGroupList").datagrid("unselectAll");
                }
            });
    };
    implement.getAndRefreshList=function()
    {
        this.getList(this.isForce, function (listResponse) {
            /*var result=ef.util.find(listResponse,function(item)
            {
                return item.name=="default";
            });
            implement.tenantId=result.tenant_id;
            implement.groupId=result.id;
            result?implement.refreshList(result.security_group_rules):null;*/
            implement.refreshList(listResponse);
        });
    };
    implement.redraw = function () {
        this.init();
        this.getAndRefreshList();
    };
    implement.destroy = function () {
        require.undef(moudle.id);
    };
    implement.filter = function(){
        var search = $("#sec-search").textbox('getValue');
        var state = $("#sec-state").combobox('getValue');
        state=state=="all"?"":state;
        $('#securityGroupList').datagrid({
            loadFilter:function(data) {
                return ef.util.search(data,{
                    filterFunction:function(item){
                       if(search){
                           if(String(search).indexOf('任何') != -1 ||
                               String(search).indexOf('任') != -1 ||
                               String(search).indexOf('何') != -1){
                               return item.noneData && (item.noneData == true);
                           }
                           var searchText =  String(search).toLowerCase();
                           var protoText = String(item.protocol).toLowerCase();
                           var rangText = String(item.port_range).toLowerCase();
                           return item.protocol && (protoText.indexOf(searchText) != -1) ||
                               item.port_range && (rangText.indexOf(searchText) != -1);
                       }else{
                           return true;
                       }
                    }
                },{
                    key:'direction',
                    value:state
                });
            }
        }).datagrid('clientPaging').datagrid("goto",1);
    };
    implement.getDirectionList=function(callback)
    {
        ef.getJSON(
            {
                url:"data/security.direction.json",
                useLocal:true,
                success:function(response)
                {
                    callback?callback(response):null;
                }
            });
    };
    implement.resetSearch = function(){
        $("#sec-search").textbox('reset');
        $('#sec-state').combobox('reset');
    };
    return implement;
});