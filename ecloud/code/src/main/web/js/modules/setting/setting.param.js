/**
 * Created by wangahui1 on 15/11/6.
 */
define(['user', 'domReady', 'clientPaging', "module", "api", "strategy"], function (user, domReady, clientPaging, module, api, strategy) {
    var implement = new ef.Interface.implement();
    implement.reStartParams = [
        'compute.boot_interval',
        'compute.cpu_allocation_ratio',
        'compute.max_booting',
        'compute.memory_allocation_ratio',
        'log.file_path',
        'log.file_ttl',
        'log.files_max_size',
        'log.syslog_server_ip',
        'log.syslog_server_port'
    ];
    implement.init = function () {
        this.isForce = true;
       // implement.getList(true, function (response) {
            if (user.isSys() || user.isSuper()) {
                $(".paramBtn").parent().show();
                $('#parameterlist').datagrid({
                    singleSelect: true,
                    pagination: false,
                    pageSize: 100000,
                    //height:dL,
                    onAfterEdit: function (rowIndex, rowData, changes) {
                        if(rowData.name=="storage.default_type"&&rowData.value=="默认"){
                            rowData.value="";
                        }

                        implement.modifyList([rowData], implement.isForce, function (response) {
                            ef.placard.tick(ef.util.getLocale("setting.param.modify.restart.success",rowData.name));
                            /*if(_.contains(implement.reStartParams,rowData.name)){
                             ef.placard.tick(ef.util.getLocale("setting.param.modify.restart.success",rowData.name));
                             }else{
                             ef.placard.tick(ef.util.getLocale("setting.param.modify.success",rowData.name));
                             }*/
                        }, function (error) {
                            ef.placard.show(error.msg);
                        });
                    },
                    onCancelEdit: function () {
                        console.log(arguments);
                    },
                    columns: [[
                        {field: 'name', title: ef.util.getLocale("setting.param.table.name"), width: '27%',
                             formatter:function(val){
                                 if(val){
                                     return '<span style="padding-left: 3px">'+val+'</span>';
                                 }
                                 else{
                                     return '<span style="padding-left: 3px">-</span>';
                                 }
                             }
                        },//参数名
                        {
                            field: 'value',
                            title: ef.util.getLocale("setting.param.table.number"),
                            width: '30%',
                            formatter: function (val, row) {
                                this.editor = "text";
                                var txt=row.value;
                                if(row.type=="Boolean")
                                {
                                    console.log(row.value);
                                    txt=(row.value===true||row.value=="true")?"true":"false";
                                }
                                if(row.name=="compute.policy"){
                                    txt = strategy.getStrategy(txt);
                                }
                                if(row.name=="storage.default_type"&&row.value==""){
                                    txt="默认";
                                }
                                return ef.util.isArray(txt)?txt.join(","):txt;
                            }
                        },//数值
                        {
                            field: 'des',
                            title: ef.util.getLocale("setting.param.table.description"),
                            width: '27%',
                            formatter: function (val, row) {
                                var $dom=$("<div></div>");
                                var text=ef.util.getLocale("server.setting." + row.name);
                                $dom.attr("title",text);
                                $dom.append(text);
                                return $dom;
                            }
                        },//描述
                        {   //操作
                            field: "operate",
                            title: ef.util.getLocale("host.hostdetail.blocklistlabel.alarm.operate"),
                            width: '20%',
                            formatter: function (val, rowData, rowIndex) {
                                if (rowData.readonly)return "";
                                var $dom = $('<div class="param-operate-btn" style="height: 35px;"></div>');
                                $dom.togglebutton([
                                    [
                                        {
                                            index: rowIndex,
                                            iconClass: 'icon-menus-icon-edit',
                                            tip: ef.util.getLocale("global.button.edit.label"),//编辑
                                            access: [8, 88],
                                            position:
                                            {
                                                x:0,
                                                y:6
                                            },
                                            click: function (menu) {
                                                menu.owner.owner.goto(1);
                                                var index = this.index;
                                                data = $('#parameterlist').datagrid("getData");
                                                $("#parameterlist").datagrid('beginEdit', this.index);
                                                var row=implement.getComboRow(data.rows,index);
                                                console.log(row);
                                                if (row) {
                                                    var ed = $('#parameterlist').datagrid('getEditor', {
                                                        index: index,
                                                        field: 'value'
                                                    });
                                                    if(row.type=="Boolean")
                                                    {
                                                        $(ed.target).combobox(
                                                            {
                                                                height: 35,
                                                                panelHeight:80,
                                                                width: "100%",
                                                                editable: false,
                                                                valueField: "value",
                                                                "textField": "name",
                                                                data:[
                                                                    {
                                                                        name:"true",
                                                                        value:true
                                                                    },
                                                                    {
                                                                        name:"false",
                                                                        value:false
                                                                    }],
                                                                onSelect: function (record) {

                                                                    var textbox = $(ed.target).combobox("textbox");
                                                                    textbox.parent().siblings().val(record.value==true?"true":"false");
                                                                }
                                                            });
                                                        $(ed.target).combobox("setValue",(row.value=="true"||row.value==true)?true:false);
                                                    }else
                                                    {
                                                        if(rowData.name=="compute.policy"){
                                                            $(ed.target).combobox({
                                                                height: 35,
                                                                panelHeight:80,
                                                                width: "100%",
                                                                editable: false,
                                                                valueField: "id",
                                                                textField: "name",
                                                                onSelect: function (record) {
                                                                    var textbox = $(ed.target).combobox("textbox");
                                                                    textbox.parent().siblings().val(record.id);
                                                                }
                                                            }).combobox({
                                                                data:strategy.getStrategyList()
                                                            });
                                                        }else{
                                                            $(ed.target).combobox(
                                                                {
                                                                    height: 35,
                                                                    panelHeight:80,
                                                                    width: "100%",
                                                                    editable: false,
                                                                    valueField: "id",
                                                                    "textField": "name",
                                                                    onSelect: function (record) {
                                                                        var textbox = $(ed.target).combobox("textbox");
                                                                        textbox.parent().siblings().val(record.name);
                                                                    }
                                                                });
                                                            implement.getVolumnTypes(implement.isForce, function (volumnResponse) {
                                                                //volumnResponse.unshift({name:"默认",id:""});
                                                                $(ed.target).combobox("loadData", volumnResponse);
                                                            });
                                                        }
                                                    }
                                                }
                                                else{
                                                    var ed = $('#parameterlist').datagrid('getEditor', {
                                                        index: index,
                                                        field: 'value'
                                                    });
                                                    switch (rowData.type){
                                                        case "List of String":
                                                            $(ed.target).textbox({
                                                                height:35,
                                                                maxlength:60,
                                                                required: true,
                                                                validType:'whitelist["0-9a-zA-Z@.,","'+ef.util.getLocale("setting.param.string.list")+'"]'
                                                            });
                                                            break;
                                                        case "String":
                                                            if(rowData.name=="log.syslog_server_ip"){
                                                                $(ed.target).textbox({
                                                                    height:35,
                                                                    validType: 'blacklist["\u4e00-\u9fa5","'+ef.util.getLocale("setting.param.string.cn")+'"]'
                                                                });
                                                            }
                                                            else if(rowData.name!="log.syslog_server_ip"){
                                                                $(ed.target).textbox({
                                                                    height:35,
                                                                    maxlength:60,
                                                                    required: true,
                                                                    validType: 'blacklist["\u4e00-\u9fa5","'+ef.util.getLocale("setting.param.string.cn")+'"]'
                                                                });
                                                            }
                                                            break;
                                                        case "Integer":
                                                            if(rowData.name=="log.syslog_server_port"){
                                                                $(ed.target).textbox({
                                                                    height:35,
                                                                    maxlength: 15,
                                                                    validType: 'whitelist["0-9","整数"]'
                                                                });
                                                            }
                                                            if(rowData.name!="log.syslog_server_port"){
                                                                $(ed.target).textbox({
                                                                    height: 35,
                                                                    maxlength: 5,
                                                                    required: true,
                                                                    validType: 'whitelist["0-9","整数"]'
                                                                });
                                                            }
                                                            break;
                                                        case "Float":
                                                            $(ed.target).textbox({
                                                                height:35,
                                                                maxlength:20,
                                                                required: true,
                                                                validType:'whitelist["0-9.","数字"]'
                                                            });
                                                            break;
                                                    }
                                                }
                                            }
                                        }
                                    ],
                                    [
                                        {
                                            index: rowIndex,
                                            iconClass: "icon-menus-icon-save",
                                            tip: ef.util.getLocale("global.button.save.label"),//保存
                                            access: [8, 88],
                                            position:
                                            {
                                                x:0,
                                                y:-6
                                            },
                                            click: function (menu) {
                                                var index = this.index;
                                                var ed = $('#parameterlist').datagrid('getEditor', {
                                                    index: index,
                                                    field: 'value'
                                                });
                                                if(!$(ed.target).textbox('isValid')){return;}
                                                menu.owner.owner.goto(0);
                                                $("#parameterlist").datagrid('endEdit', this.index);
                                            }
                                        },
                                        {
                                            index: rowIndex,
                                            iconClass: "icon-menus-icon-cancel",
                                            tip: ef.util.getLocale("global.button.cancel.label"),//取消
                                            access: [8, 88],
                                            position:
                                            {
                                                x:0,
                                                y:-6
                                            },
                                            click: function (menu) {
                                                menu.owner.owner.goto(0);
                                                $("#parameterlist").datagrid('cancelEdit', this.index);
                                            }
                                        }
                                    ]
                                ]);
                                return $dom;
                            }
                        }
                    ]]
                }).datagrid('loading');
            } else {
                $('#parameterlist').datagrid({
                    singleSelect: true,
                    pagination: false,
                    pageSize: 100000,
                    columns: [[
                        {field: 'name', title: ef.util.getLocale("setting.param.table.name"), width: '35%'},//参数名
                        {
                            field: 'value',
                            title: ef.util.getLocale("setting.param.table.number"),
                            width: '30%',
                            formatter: function (val, row) {
                                this.editor = "text";
                                var txt=row.value;
                                if(row.type=="Boolean")
                                {
                                    txt=(row.value===true||row.value=="true")?"true":"false";
                                }
                                return txt;
                            }
                        },//数值
                        {
                            field: 'des',
                            title: ef.util.getLocale("setting.param.table.description"),
                            width: '40%',
                            formatter: function (val, row) {
                                return ef.util.getLocale("server.setting." + row.name);
                            }
                        }//描述
                    ]]
                }).datagrid('loading');
            }
            $('.datagrid-empty-tip').hide();
       // });
    };
    implement.getComboRow = function (rows,index) {
        var row;
        $(rows).each(function (i, il) {
            if (il.name == "storage.default_type"||il.type=="Boolean" || il.name == "compute.policy") {
                var _index=$('#parameterlist').datagrid("getRowIndex", il);
                if(index==_index)
                {
                    row=il;
                }
            }
        });
        return row;
    };
    implement.filterPushData = function (response) {
        var arrs = [];
        $(response).each(function (i, il) {
            if (il.readonly)return;
            var item = {};
            item.name = il.name;
            item.value = il.value;
            arrs.push(item);
        });
        return arrs;
    };
    implement.refreshList = function (response) {
        $('#parameterlist').datagrid("loadData", response);
    };
    /**获取卷类型*/
    implement.getVolumnTypes = function (isForce, success, error) {
        ef.getJSON(
            {
                url: api.getAPI("volumn.type"),
                type: "get",
                isForce: isForce,
                success: function (response) {
                    success ? success(response) : null;
                },
                error: function (msg) {
                    error ? error(msg) : null;
                }
            });
    };
    /**根据参数名获取参数值*/
    implement.getParam=function(success,key)
    {
          success=success||$.noop;
          this.getList(true,function(resp)
          {
               var finder=ef.util.find(resp,function(item)
               {
                   return item.name==key;
               });
              success(finder?finder.name:undefined);
          });
    };
    /**获取全局参数列表*/
    implement.getList = function (isForce, success, error) {
        ef.getJSON(
            {
                url: api.getAPI("global.param"),
                isForce: isForce,
                type: "get",//get,post,put,delete
                success: function (response) {
                    response = ef.util.sort("name", response);
                    success ? success(response) : null
                },
                error: function (msg) {
                    error ? error(msg) : null;
                }
            });
    };
    /**
     * 修改参数列表
     * */
    implement.modifyList = function (data, isForce, success, error) {
        var _data=data[0];
        ef.getJSON(
            {
                url: api.getAPI("global.param.set"),
                isForce: isForce,
                type: "post",//get,post,put,delete
                data:
                {
                    name:_data.name,
                    value:ef.util.isArray(_data.value)?_data.value.toString():_data.value
                },
                success: function (response) {
                    response = ef.util.sort("name", response);
                    success ? success(response) : null
                },
                error: function (msg) {
                    error ? error(msg) : null;
                }
            });
    };
    implement.getAndRefreshList = function () {
        implement.getList(implement.isForce, function (response) {
            var len = response.length*35;
            var dL = len+60;
            $(".plain-datagrid.paramGrid").css({height:len+60+'px'});
            $('#parameterlist').datagrid({height:dL});
            implement.refreshList(response);
            $('#parameterlist').datagrid('loaded');
        }, function (error) {
            ef.placard.show(error.msg);
        });
    };
    implement.redraw = function () {
        domReady(function () {
                       //var heightValue = $(window).height();
            //$('#parameterlist').css({height:heightValue});

            implement.init();
            implement.getAndRefreshList();
            //$('#parameterlist').css({height:'auto'});
            //$('#parameterlist').datagrid('loading');
        })
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});