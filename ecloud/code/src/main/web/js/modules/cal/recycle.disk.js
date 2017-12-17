/**
 * Created by thomas on 2016/4/13.
 */
define([
    'module',
    'exports',
    'api',
    'user'
],function(module, exports, api, user){
    'use strict';
    var isLocal = true,
        isRight = false,
        isNonData = false,
        actionBar,
        responseData;
    var impls = new ef.Interface.implement();
    impls.redraw = function(){
        this.init();
    };
    impls.destroy = function(){
        require.undef(module.id)
    };
    impls.init = function(){
        this.o.$recySearch.textbox(this.config.searchConfig);
        impls.utils.isUserRight();
        actionBar = this.o.$actionBar.iconmenu(this.config.actionBarConfig);
        impls.utils.disableBtns();
        this.o.$grid.datagrid(this.config.dataGridConfig);
        this.utils.renderDiskList();
    };
    impls.o = {
        $grid:$('#recylce_disk'),
        $actionBar:$('.recycle-icon-box'),
        $recySearch:$('#searchDisk')
    };
    impls.utils = {
        message:{
            deltedError:ef.util.getLocale('recycle.alert.nochecked.meassage'),
            confirm:ef.util.getLocale('recycle.alert.confirm.meassage'),
            noChecked:ef.util.getLocale('recycle.alert.nochecked.meassage'),
            empty:ef.util.getLocale('recycle.alert.empty.confirm.meassage'),
            recoveryError:ef.util.getLocale('recycle.alert.recovery.error.meassage')
        },
        renderDiskList:function(){
            ef.getJSON({
                url:api.getAPI('listDiskInRecycle'),
                type:'get',
                dataType:'json',
                useLocal:isLocal
            })
            .success(function(response){
                responseData = response;
                var len = response.length > 0;
                if (len) {
                    isNonData = false;
                    impls.utils.enableBtns(['2']);
                } else {
                    isNonData = true;
                }
                impls.o.$grid.datagrid({
                    loadFilter:impls.utils.selectPage
                }).datagrid({
                    data:response
                });
            })
            .error(function(error){
                console.log(error);
            });
        },
        recoveryDisk:function(){
            if(!isRight){
                return;
            }
            var volume_id,
                volume = impls.utils.getFirstCheckedVM();
            if(volume){
                volume_id = volume.id;
            }
            ef.getJSON({
                url:api.getAPI('recoveryDiskInRecycle')+'/'+volume_id+'/restore',
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
        deleteDisk:function(){
            if(!isRight){
                return;
            }
            var vols = _.map(impls.utils.getCheckedVM(),function(item){
                    return item.id;
            }).join(',');
            var message = impls.utils.message.confirm;
            $.messager.confirm('确认',message,function(r){
                if(r){
                    ef.getJSON({
                        url:api.getAPI('deleteDiskInRecycle')+'?'+'volumes='+vols,
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
        emptyDisk:function(){
            if(!isRight){
                return;
            }
            var message = impls.utils.message.empty;
            $.messager.confirm('确认',message,function(r){
                if(r){
                    ef.getJSON({
                        url:api.getAPI('emptyDiskInRecycle'),
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
                    })
                    .error(function(){
                        var message = impls.utils.message.deltedError;
                        $.messager.alert('警告',message);
                    });
                }
            });
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
                return (item.displayname == value);
            });
            impls.o.$grid.datagrid({
                loadFilter:impls.utils.selectPage
            }).datagrid({
                data:temp
            });
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
            }
        },
        deleteResponseData:function(checkedItem){
            var index = _.indexOf(responseData,checkedItem);
            responseData.splice(index, 1);
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
        isNoneData:function(){//是否没有数据显示
            var rows = impls.o.$grid.datagrid('getRows');
            if(rows.length > 0){
                return false;
            }
            return true;
        },
        isUserRight:function(){//是否用户没有权限
            if(user.isSec() || user.isSuper()){
                isRight = true;
                return isRight;
            }
            return isRight;
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
        getCheckedVM:function(){
            return impls.o.$grid.datagrid('getSelections');
        },
        isNoneChecked:function(){
            var checkedVMs = impls.utils.getFirstCheckedVM();
            if(checkedVMs == null){
                return true;
            }
            return false;
        },
        getFirstCheckedVM:function(){
            return impls.o.$grid.datagrid('getSelected');
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
            var iconsBtn = ['1','2','3'];
            if($.isArray(icons)){
                iconsBtn = icons;
            }
            for(var i = 0,len = iconsBtn.length; i < len; i++){
                actionBar.setStatus(iconsBtn[i],false);
            }
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
                impls.utils.deleteDisk();
            }
        },{
            icon:"theme/default/images/icons.png",
            iconClass:'icon-recycle-empty',
            tip:ef.util.getLocale('recycle.vm.iconmenu.empty'),//"添加",
            id:2,
            "access":[8,88],
            click:function(){
                impls.utils.emptyDisk();
            }
        },{
            icon:"theme/default/images/icons.png",
            iconClass:'icon-recycle-recovery',
            tip:ef.util.getLocale('recycle.vm.iconmenu.recovery'),//"添加",
            id:3,
            "access":[8,88],
            click:function(){
                impls.utils.recoveryDisk();
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
                    width:"10%",
                    title:ef.util.getLocale('host.hostdetail.blocklistlabel.description.data_disk.tooltip')
                },{
                    field:'displayname',
                    width:"15%",
                    title:ef.util.getLocale('setting.userdetail.datagrid.name'),
                    formatter:function(value,row,index){
                        return value;
                    }
                },{
                    field:'volume_type',
                    title:ef.util.getLocale('log.table.type'),
                    width:"15%",
                    formatter:function(value,row,index){
                        return value;
                    }
                },{
                    field:'size',
                    title:ef.util.getLocale('cal.disk.list.volunm'),
                    width:"15%",
                    formatter:function(value,row,index){
                        return value;
                    }
                },{
                    field:'status',
                    title:ef.util.getLocale('setting.userdetail.datagrid.status'),
                    width:"15%",
                    formatter:function(value,row,index){
                        return value;
                    }

                },{
                    field:'host_name',
                    title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.userfield'),
                    width:"15%"
                },{
                    field:'tenant',
                    title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.tenantfield'),
                    width:"15%",
                    formatter:function(value,row,index){
                        return value.name;
                    }
                },{
                    field:'attachments',
                    title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.remarkfield'),
                    width:"15%"
                }]
            ]
        }
    };
    return impls;
});
