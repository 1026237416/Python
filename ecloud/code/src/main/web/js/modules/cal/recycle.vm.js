/**
 * Created by thomas on 2016/4/11.
 */
define([
    'module',
    'exports',
    'api',
    'user',
    'clientPaging'
],function(module, exports, api, user, clientPaging){
    'use strict';
    var isLocal = true,
        isRight = false,
        actionBar = null,
        iconsBtn = ['1','2','3'],
        isNonData,
        responseData;

    var impls = new ef.Interface.implement();
    impls.redraw = function(){
        this.init();
    };
    impls.destroy = function(){
        require.undef(module.id);
    };
    impls.init = function(){
        this.o.$recySearch.textbox(this.config.searchConfig);
        this.utils.isUserRight();
        actionBar = this.o.$actionBar.iconmenu(this.config.actionBarConfig);
        this.utils.disableBtns(['1','2','3']);
        this.o.$grid.datagrid(this.config.dataGridConfig);
        this.utils.renderVM();
    };
    impls.o = {
        $grid:$('#recylce_datas'),
        $deleteVmBtn:$('#deleteVM'),
        $emptyVMBtn:$('#empty'),
        $recovery:$('#recovery'),
        $actionBar:$('#recycle-box'),
        $recySearch:$('#recy-search')
    };
    impls.utils = {
        message:{
            deltedError:ef.util.getLocale('recycle.alert.nochecked.meassage'),
            confirm:ef.util.getLocale('recycle.alert.confirm.meassage'),
            noChecked:ef.util.getLocale('recycle.alert.nochecked.meassage'),
            empty:ef.util.getLocale('recycle.alert.empty.confirm.meassage'),
            recoveryError:ef.util.getLocale('recycle.alert.recovery.error.meassage')
        },
        filter:function(value){
            impls.o.$grid.datagrid({
                loadData:[]
            });
            if(value == ''){
                impls.o.$grid.datagrid({
                    loadFilter:impls.utils.selectPage
                }).datagrid({
                    data:responseData
                });
                return;
            }
            var temp = _.filter(responseData,function(item, index){
                return (item.displayname == value) ||
                    (item.host.ip == value) ||
                    (item.user.name == value);
            });
            impls.o.$grid.datagrid({
                loadFilter:impls.utils.selectPage
            }).datagrid({
                data:temp
            });
        },
        isUserRight:function(){
            if(user.isSec() || user.isSuper()){
                isRight = true;
                return isRight;
            }
            return isRight;
        },
        disableBtns:function(icons){
            var iconsBtn = ['1','2','3'];
            if($.isArray(icons)){
                iconsBtn = icons;
            }
            for(var i = 0,len = iconsBtn.length; i < len; i++){
                actionBar.setStatus(iconsBtn[i],true);
            }
        },
        enableBtns:function(icons){
            //iconsBtn
            var iconsBtn = ['1','2','3'];
            if($.isArray(icons)){
                iconsBtn = icons;
            }
            for(var i = 0,len = iconsBtn.length; i < len; i++){
                actionBar.setStatus(iconsBtn[i],false);
            }
        },
        isNoneChecked:function(){
            var checkedVMs = impls.utils.getFirstCheckedVM();
            if(checkedVMs == null){
                return true;
            }
            return false;
        },
        isNoneData:function(){
            var rows = impls.o.$grid.datagrid('getRows');
            if(rows.length > 0){
                return false;
            }
            return true;
        },
        isEnable:function(){
            impls.utils.disableBtns();
            isNonData = impls.utils.isNoneData();
            if(isRight && !isNonData){
                impls.utils.enableBtns(['2']);
                if(impls.utils.isNoneChecked()){
                    impls.utils.disableBtns(['1','3']);
                }else{
                    impls.utils.enableBtns(['1']);
                    if(impls.utils.getCheckedVM().length > 1){
                        impls.utils.disableBtns(['3']);
                    }else{
                        impls.utils.enableBtns(['3']);
                    }
                }
            }else{
                impls.utils.disableBtns(['2']);
            }
        },
        selectPage:function(data){
            if (typeof data.length == 'number' && typeof data.splice == 'function'){
                data = {
                    total: data.length,
                    rows: data
                }
            }
            var dg = $(this);
            var opts = dg.datagrid('options');
            var pager = dg.datagrid('getPager');
            pager.pagination({
                onSelectPage:function(pageNum, pageSize){
                    opts.pageNumber = pageNum;
                    opts.pageSize = pageSize;
                    pager.pagination('refresh',{
                        pageNumber:pageNum,
                        pageSize:pageSize
                    });
                    dg.datagrid('loadData',data);
                }
            });
            if (!data.originalRows){
                data.originalRows = (data.rows);
            }
            var start = (opts.pageNumber-1)*parseInt(opts.pageSize);
            var end = start + parseInt(opts.pageSize);
            data.rows = (data.originalRows.slice(start, end));
            if((data.rows.length == 0)&&(data.originalRows.length>0)&&(data.originalRows.length%10 == 0)) {
                start = start - parseInt(opts.pageSize);
                end = start + parseInt(opts.pageSize);
                data.rows = (data.originalRows.slice(start, end));
            }
            return data;
        },
        recoveryVM:function(){
            if(!isRight){
                return;
            }
            ef.getJSON({
                url:api.getAPI('recoveryVMInRecycle'),
                dataType:'json',
                type:'POST',
                useLocal:isLocal
            })
            .success(function(){
                impls.utils.deleteFirstRowByIndex();
                impls.utils.isEnable();
            })
            .error(function(){
                var message = impls.utils.message.recoveryError;
                $.messager.alert('警告',message);
            });
        },
        emptyVM:function(){
            if(!isRight){
                return;
            }
            var message = impls.utils.message.empty;
            $.messager.confirm('确认',message,function(r){
                if(r){
                    ef.getJSON({
                        url:api.getAPI('emptyVMInRecycle'),
                        dataType:'json',
                        type:"DELETE",
                        useLocal:isLocal
                    })
                    .success(function(){
                        responseData = [];
                        impls.o.$grid.datagrid({
                            data:[]
                        });
                        impls.utils.isEnable();
                        impls.o.$recySearch.textbox('reset');
                    })
                    .error(function(){
                        var message = impls.utils.message.deltedError;
                        $.messager.alert('警告',message);
                    });
                }
            });
        },
        renderVM:function(){
            ef.getJSON({
                url:api.getAPI('listVMInRecycle'),
                type:'get',
                dataType:'json',
                useLocal:isLocal
            })
            .success(function(response){
                responseData = response;//cache
                var len = response.length > 0;
                if (len) {
                    isNonData = false;
                    impls.utils.enableBtns(['2']);
                } else {
                    isNonData = true;
                }
                /*impls.o.$grid.datagrid({
                    loadFilter:impls.utils.selectPage
                }).datagrid({
                    data:response
                });*/
                impls.o.$grid.datagrid({
                    data:response
                }).datagrid('clientPaging');
                impls.o.$recySearch.textbox('reset');
            })
            .error(function(error){
                console.log(error);
            });

        },
        deleteVM:function(){
            if(!isRight){
                return;
            }
            if(impls.utils.isNoneChecked()) return;
            var message = impls.utils.message.confirm;
            $.messager.confirm('确认',message,function(r){
                if(r){
                    ef.getJSON({
                        url:api.getAPI('deleteVMInRecycle'),
                        type:'DELETE',
                        dataType:'json',
                        useLocal:isLocal
                    })
                    .success(function(){
                        impls.utils.deleteRowsByIndex();
                        impls.utils.isEnable();
                    })
                    .error(function(){
                        message = impls.utils.message.deltedError;
                        $.messager.alert('警告',message,'error');
                    });
                }
            });
        },
        getCheckedVM:function(){
            return impls.o.$grid.datagrid('getSelections');
        },
        getFirstCheckedVM:function(){
            return impls.o.$grid.datagrid('getSelected');
        },
        deleteFirstRowByIndex:function(){
            var firstRow = impls.utils.getFirstCheckedVM();
            if(firstRow){
                var index = impls.o.$grid.datagrid('getRowIndex',firstRow);
                impls.o.$grid.datagrid('deleteRow',index);
                impls.utils.deleteResponseData(firstRow);
                impls.o.$grid.datagrid({//refresh table
                    data:responseData
                });
                impls.o.$recySearch.textbox('reset');
            }

        },
        deleteRowsByIndex:function(){
            var index,
                checkedRows = impls.utils.getCheckedVM();
            if(checkedRows.length){
                for(var i = 0, len = checkedRows.length; i < len; i++){
                    index = impls.o.$grid.datagrid('getRowIndex',checkedRows[i]);
                    impls.o.$grid.datagrid('deleteRow',index);
                    impls.utils.deleteResponseData(checkedRows[i]);
                }
                impls.o.$grid.datagrid({
                    data:responseData
                });
                impls.o.$recySearch.textbox('reset');
            }
        },
        deleteResponseData:function(checkedItem){
            var index = _.indexOf(responseData,checkedItem);
            responseData.splice(index, 1);
        }

    };
    impls.config = {
        searchConfig:{
            prompt:'请输入名称 / 用户 / IP',
            iconCls:'icon-search',
            iconAlign:'left',
            onChange:function(){
                var timer,searchValue;
                window.clearTimeout(timer);
                searchValue = '';
                timer = window.setTimeout(function(){
                    searchValue = impls.o.$recySearch.textbox('getValue');
                    impls.utils.filter($.trim(searchValue));
                },1000);
            }
        },
        actionBarConfig:[{
            icon:"theme/default/images/icons.png",
            iconClass:'icon-recycle-delete',
            tip:ef.util.getLocale('cal.disk.iconmenu.delete'),//"添加",
            id:1,
            "access":[8,88],
            click:function(){
                //delete
                impls.utils.deleteVM();
            }
        },{
            icon:"theme/default/images/icons.png",
            iconClass:'icon-recycle-empty',
            tip:ef.util.getLocale('recycle.vm.iconmenu.empty'),//"添加",
            id:2,
            "access":[8,88],
            click:function(){
                //empty
                impls.utils.emptyVM();

            }
        },{
            icon:"theme/default/images/icons.png",
            iconClass:'icon-recycle-recovery',
            tip:ef.util.getLocale('recycle.vm.iconmenu.recovery'),//"添加",
            id:3,
            "access":[8,88],
            click:function(){
                //recovery
                impls.utils.recoveryVM();
            }
        }],
        dataGridConfig:{
            iconCls: 'icon-edit',
            singleSelect:false,
            pagination:true,
            pageSize:10,
            emptyText:"暂无数据",
            onSelect:function(){
                impls.utils.isEnable();
            },
            onUnselect:function(){
                impls.utils.isEnable();
            },
            onSelectAll:function(){
                impls.utils.isEnable();
            },
            onUnselectAll:function(){
                impls.utils.isEnable();
            },
            columns:[
                [{
                    field:'ck',
                    checkbox:true,
                    width:20
                },{
                    field:'name',
                    width:"15%",
                    title:ef.util.getLocale('host.datagrid.ID')
                },{
                    field:'displayname',
                    width:"15%",
                    title:ef.util.getLocale('host.comboxtoinput.name'),
                    formatter:function(value,row,index){
                        return value;
                    }
                },{
                    field:'host',
                    title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.ipfield'),
                    width:"15%",
                    formatter:function(value,row,index){
                        return value.ip;
                    }
                },{
                    field:'user',
                    title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.userfield'),
                    width:"15%",
                    formatter:function(value,row,index){
                        return value.displayname;
                    }
                },{
                    field:'tenant',
                    title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.tenantfield'),
                    width:"15%",
                    formatter:function(value,row,index){
                        return value.displayname;
                    }

                },{
                    field:'state',
                    title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.atatusfield'),
                    width:"15%"
                },{
                    field:'des',
                    title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.hypervisorfield'),
                    width:"20%"
                }]
            ]
        }
    };

    return impls;
});