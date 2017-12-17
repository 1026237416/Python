/**
 * Created by lizhao on 2016/5/6.
 */
define([
    'easyui',
    'domReady',
    'clientPaging',
    'api',
    "module",
    "resize"
],function(easyui,domReady,clientPaging,api,module){
    var _iconMenu = null,
        isLocal = false,
        dumyData = [];
    var implement=new ef.Interface.implement();
    implement.userFilter = function () {
        var name = $("#instancename").textbox('getValue').toLowerCase();
        var state=implement.o.$state.combobox("getValue");
        state=state=="all"?"":state;
        $('#instancelist').datagrid({
            loadFilter: function(data){
                return ef.util.search(data,
                    {
                        filterFunction:function(item)
                        {
                            if(name)
                            {
                                return (item.app_id&&item.app_id.toLowerCase().indexOf(name)!=-1)||(item.app_name&&item.app_name.toLowerCase().indexOf(name)!=-1);
                            }
                            return true;
                        }
                    },
                    {
                        key:"state",
                        value:state
                    });

            }
        }).datagrid('clientPaging').datagrid("goto",1);
        implement.getState();
    };
    //@btn addBtn
    implement.addInstance=function(){
        new ef.Dialog('addInstance',{
            title:ef.util.getLocale("apply.instance.create.instance.name"),
            width:965,
            height:593,
            closed:false,
            cache:false,
            nobody:false,
            modal:true,
            href: 'views/addManorInstanceCreate.html',
            onResize: function () {
                $(this).dialog('center');
            },
            onLoad:function(){
                require.undef('manor.instance.create');
                require(["manor.instance.create"],function(module)
                {
                    module.redraw();
                    ef.i18n.parse();
                });
            }
        });
    };

    implement.states=[
        {
            value:"all"
        },
        {
            value:"normal"
        }
        ,{
            value:"building"
        },{
            value:"failure"
        },{
            value:"part"
        },{
            value:"stop"
        },{
            value:"down"
        },{
            value:"offline"
        }];

    //@list manor list
    implement.getManorlist = function (success,error) {
        ef.getJSON(
            {
                url:api.getAPI("manor.instance.list"),
                type:"get",//get,post,put,delete
                success:
                    success|| $.noop
                //    function(res)
                //{
                //    //if(isFirst){
                //    //    $('#instancelist').datagrid({data: res}).datagrid('clientPaging');
                //    //}else{
                //    //     $("#instancelist").datagrid('loadData',res);
                //    //}
                //},
                ,error:error|| $.noop
            });
    };
    implement.redraw=function(){
        $(this.states).each(function(i,item)
        {
            item.label=ef.util.getLocale("apply.instance.list.state."+item.value);
        });
        //init action bar
        implement.utils.initToolBar();
        //init table
        implement.utils.initTable();
        implement.utils.getTableList();
        //init search text
       /* implement.combo();*/
        implement.utils.initSearch();
        implement.o.$refresh.click(function () {
            implement.o.$search.textbox('reset');
            implement.o.$state.combobox("reset");
            implement.utils.getTableList();
         });

    };
    implement.addSocketListeners=function()
    {
        var datas=implement.o.$datagrid.datagrid("getData");
        var ids=ef.util.pluck(datas.rows,"app_serial");
        var _self=this;
        $(ids).each(function(i,item)
        {
            if(item)
            {
                _self.socket.send(JSON.stringify(
                    {
                        app_serial:item
                    }
                ));
            }
        });
    };
    implement.updateGridRow=function(rowData)
    {
        if(!rowData)return;
        rowData=JSON.parse(rowData);
        if(rowData.error)
        {
            ef.placard.warn(ef.util.getLocale(rowData.error.msg));
        }
        if(rowData.status=="working")return;
        var datas=implement.o.$datagrid.datagrid("getData").rows;
        var finderData=ef.util.find(datas,function(item)
        {
            return item.app_serial==rowData.serial;
        });
        if(!finderData)return;
        if(finderData.state=="building"&&rowData.status=="working")
        {

        }else
        {
            finderData.state=rowData.status;
        }

        var index=implement.o.$datagrid.datagrid("getRowIndex",finderData);
        implement.o.$datagrid.datagrid("updateRow",{
            index:index,
            row:finderData
        });
        implement.o.$datagrid.datagrid("unselectRow",index);

    };
    /**获取应用状态*/
    implement.getState=function()
    {
        var _self=this;
        if(this.socket&&this.socket.socket.readyState==1)
        {
            this.addSocketListeners();
            return;
        }else
        {
            //console.log("重生成");
        }
        this.socket=new ef.server.Socket(api.getAPI("manor.instance.state",true),"manor.instance.state");
        this.socket.onopen=function()
        {
            //console.log("已连接");
            _self.addSocketListeners();
        };
        this.socket.onmessage=function(data)
        {
            console.log("socket receive msg:",data.data);
            implement.updateGridRow(data.data);
        };
        this.socket.onerror=function()
        {
            console.log("socket error");
        };
        this.socket.onclose=function()
        {
            console.log("socket closed");
        };
    };

    implement.destroy=function()
    {
        require.undef(module.id);
    };
    implement.config = {
        /*statConfig:{
            start:'<span class="running" style="width:54px;">' +
                        '<i class="easyui-tooltip icon-state" style="background-position: -481px -58px;width:22px;">' +
                            '<span class="host_status">'+
                                ef.util.getLocale('apply.instance.description.data_status2')+
                            '</span>' +
                        '</i>'+
                    '</span>',
            success:'<span class="running" style="width:54px;">' +
                        '<i class=" easyui-tooltip icon-state" style="background-position: -517px -57px;width:22px;">' +
                            '<span class="host_status" >'+
                                ef.util.getLocale('host.hostdetail.blocklistlabel.description.data_status3')+
                            '</span>' +
                        '</i>'+
                    '</span>',
            fail:1,
            progress:2
        },*/
        stateConfig:
        {
            prompt: ef.util.getLocale("apply.instance.search-item.state"),
            height:30,
            width:200,
            data:implement.states,
            textField:"label",
            valueField:"value",
            editable:false,
            formatter:function(row)
            {
                var dom=$('<div useformate="true">' +
                    '<i class="tem_icon"></i>' +
                    '<span class="hostSlave_state manor_list_state" style="display: inline-block;height: 25px;line-height: 14px;vertical-align: middle;"></span></div>');
                dom.find("i").addClass("manor-list-state-"+row.value);
                dom.find("span").text(ef.util.getLocale("apply.instance.list.state."+row.value));
                return dom.get(0).outerHTML;

            },
            onChange:function()
            {
                implement.userFilter();
            }
        },
        searchConfig:{
            prompt: ef.util.getLocale("apply.instance.search-item.instancename"),
            iconCls:'icon-search',
            iconAlign:'left',
            valueField: 'value',
            onChange: function () {
                implement.userFilter();
            }
        },
        datagridConfig:{
            singleSelect: true,
            pagination: true,
            autoHeight:true,
            pageSize: 10,
            onSelect:function(rowIndex, rowData){
                if(rowData.state.toLowerCase() =="building"||rowData.state.toLowerCase()=="working"){
                    _iconMenu.setStatus("5", true);
                }else{
                    _iconMenu.setStatus("5", false);
                }
            },
            onUnselectAll:function(){
                _iconMenu.setStatus("5", true);
            },
            columns:[
                [{
                    field:'app_id',
                    title:ef.util.getLocale("apply.instance.table.id"),
                    width:'20%',
                    formatter: function (val, row, index) {
                        var _row = ef.util.escapeJSON(JSON.stringify(row));
                        if(row.state == 'building' ||
                           row.state == 'failure'||row.state=="working"){
                            return val;
                        }else{
                            var _row = ef.util.escapeJSON(JSON.stringify(row));
                            return  '<a onclick="ef.nav.goto(\'manorInstance.detail.html\',\'manor.instance.detail\',\'' + _row + '\',null,\'manor.instance\')" class="table-link">' + val + '</a>';
                        }
                    }
                },{
                    field:'app_name',
                    title:ef.util.getLocale("apply.template.table.name"),
                    width:'20%'
                },{
                    field:'template_name',
                    title:ef.util.getLocale("apply.instance.table.template.name"),
                    width:'20%'
                },{
                    field:'app_description',
                    title:ef.util.getLocale("host.hostdetail.blocklistlabel.description"),
                    width:'20%',
                    formatter:function(val,row){
                        if(!val){return "-"}
                        return val;
                    }
                },{
                    field:'state',
                    title:ef.util.getLocale("apply.template.table.state"),
                    width:'30%',
                    formatter: function (value,row,index) {
                        var val = value.toLowerCase();
                        return implement.state(val);
                        /*if(val=="start"){
                            return '<span class="running" style="width:54px;"><i class="easyui-tooltip icon-state" style="background-position: -481px -58px;width:22px;"><span class="host_status">'+ef.util.getLocale('apply.instance.description.data_status2')+'</span></i></span>';
                        }else if(val=="success"){
                            return '<span class="running" style="width:54px;"><i class=" easyui-tooltip icon-state" style="background-position: -517px -57px;width:22px;"><span class="host_status" >'+ef.util.getLocale('host.hostdetail.blocklistlabel.description.data_status3')+'</span></i></span>';
                        }else if(val=="creating"){
                            return '<span class="running" style="width:70px;"><i class=" easyui-tooltip icon-state" style="background-position: -555px -57px;width:22px;"><span class="host_status" >'+ef.util.getLocale('host.list.status.creating.tip')+'</span></i></span>';
                        }else if(val=="creatfail"){
                            return '<span class="running" style="width:80px;"><i class=" easyui-tooltip icon-state" style="background-position: -517px -57px;width:22px;"><span class="host_status" >'+ef.util.getLocale('order.ready.info.grid.status.create.fail')+'</span></i></span>';
                        }*/
                    }
                }
            ]]
        },
        iconmenuConfig:[
            {
                iconClass: "icon-menus-icon-add",
                tip: ef.util.getLocale("setting.user.iconmenu.new.tip"),
                id: "0",
                "access": [8,7,88],
                click: function () {
                    implement.addInstance();
                }
            },
            {
                iconClass: "icon-menus-icon-delete",
                tip: ef.util.getLocale("setting.user.delete.tip"),
                id: 5,
                "access": [7,8,88],
                click: function () {
                    implement.utils.deleteBtn();
                }
            }
        ]

    };
    implement.o = {
        $datagrid:$('#instancelist'),
        $search:$('#instancename'),
        $refresh:$("#reset"),
        $state:$("#instanceStateCombo")
    };
    implement.utils = {
        initToolBar:function(){
            _iconMenu = $("#js-menus-wrapper").iconmenu(implement.config.iconmenuConfig);
            _iconMenu.setStatus("5",true);
        },
        initTable:function(){
            implement.o.$datagrid.datagrid(implement.config.datagridConfig).datagrid("loading");
        },
        getTableList:function(){
            implement.getManorlist(function(resp){
                resp.reverse();
                $(resp).each(function(i,row)
                {
                    if(row.state!="building")
                    row.state="working";
                });
                implement.o.$datagrid.datagrid({
                    data:resp
                }).datagrid('clientPaging');
                implement.o.$datagrid.datagrid("autoData");
                implement.getState();
            });
        },
        initSearch:function(){
            implement.o.$search.textbox(implement.config.searchConfig);
            implement.o.$state.combobox(implement.config.stateConfig);
        },
        deleteBtn:function(){
            var message,indexDeleted,userId,userName,dumyElem,
                $grid = implement.o.$datagrid,
                deletedItem = $grid.datagrid('getChecked');
            if(deletedItem == null || deletedItem.length == 0) return;
            $(deletedItem).each(function(index, elem){
                indexDeleted = $grid.datagrid("getRowIndex", elem);
                userId = elem.app_serial;
                userName = elem.app_name;
                dumyElem = elem;
            });
            message = ef.util.getLocale("setting.user.userlist.delete.ok2","'"+userName+"'");
            ef.messager.confirm('deleting',message,null,function(r){
                if(r){
                    ef.getJSON({
                        url:api.getAPI('manor.instance')+userId,
                        type:"delete"
                    }).success(function(response){
                        if(isLocal){
                            $grid.datagrid('deleteRow', indexDeleted);
                            var index = dumyData.indexOf(dumyElem);
                            dumyData.splice(index,1);
                            $grid.datagrid({
                                loadData:dumyData
                            });
                            $grid.datagrid("uncheckAll");
                        }else{
                            $grid.datagrid('deleteRow', indexDeleted);
                            implement.utils.getTableList();
                            $grid.datagrid("uncheckAll");
                        }
                        implement.o.$search.textbox('reset');
                        implement.o.$state.combobox('reset');
                    }).error(function(error){
                        $grid.datagrid("uncheckAll");
                        console.log("manor instance delete",error);
                    });
                }else{
                    $grid.datagrid("uncheckAll");
                }
            });
        },
        getChecked:function(){
            return implement.o.$datagrid.datagrid('getChecked');
        }
    };
    implement.state = function(state){
        /*
        {
            'normal':'',
                'building':'2',
                'failure':'3',
                'part':'4',
                'stop':'5',
                'down':'6',
                'offline':'7'
        }
        */
        return '<div style="display: inline-block;vertical-align: middle"><i style="vertical-align: middle" class="tem_icon manor-list-state-'+state+'"></i>'+
               '<span class="hostSlave_state" style="display: inline-block;vertical-align: middle">' +
                    ef.util.getLocale('manor.list.state.'+state)+
               '</span></div>';
    };
    return implement;
});
