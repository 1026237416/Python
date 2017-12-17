/**
 * Created by wangahui1 on 15/11/6.
 */
define(["easyui", "module", "clientPaging", "api", "user", "resize"], function (easyui, module, client, api, user) {
    var implement = new ef.Interface.implement();
    implement.isForce = true;
    /**获取用户列表*/
    var statusList = [{text:"全部",value:"all"},{text:"等待上传",value:"queued "},{text:"正在保存",value:"saving"},{text:"激活",value:"active"},{text:"异常",value:"killed"},{text:"删除中",value:"pending_delete"}];
    var osData = [{text:'全部'},{text:'windows'},{text:'centos'},{text:'ubuntu'},{text:'redhat'},{text:'suse'},{text:'fedora'},{text:'debian'},{text:'neokylin'}];
    implement.getImageList = function (isForce, callback, errorCallback, data, isFirst) {
        ef.getJSON(
            {
                url: api.getAPI("image"),
                type: "get",
                data:data?data:{},
                success: function (response) {
                    callback ? callback(response) : null;
                },
                error: function (error) {
                    errorCallback ? errorCallback(error) : null;
                }
            });
    };
    implement.loadFilter = function (value) {
         implement.getImageList(true, function (response) {
             $("#mirrorlist").datagrid({data: response}).datagrid('goto',1);
             implement.loadFilterName();
         }, function () {},value);
    };
    implement.loadFilterName = function () {
        var name = ($("#mirror").textbox('getValue')).toLowerCase();
        $('#mirrorlist').datagrid({
            loadFilter: function(data){
                var tmp = {total:0,rows:[]};
                $(data).each(function (i,il) {
                    if(il.name.toLowerCase().indexOf(name)!=-1){//过滤项和输入框匹配
                        tmp.total = tmp.total+1;
                        tmp.rows.push(il);
                    }
                    name = $("#mirror").textbox('getValue').toLowerCase();
                });
                return tmp;
            }
        }).datagrid('clientPaging').datagrid("goto",1);
    };
    implement.operateImage = function () {
        new ef.Dialog("operateImgDialog", {
            title: ef.util.getLocale("cal.image"),
            width: 900,
            height: 550,
            closed: false,
            cache: false,
            nobody: false,
            border: false,
            href: 'views/operateImage.html',
            modal: true,
            onResize: function () {
                $(this).dialog("vcenter");//垂直居中窗口
            },
            onClose: function () {
                require.undef("operateImgDialog")
            },
            onLoad: function () {
                require(['cal.operateImage'], function (operateImage) {
                    operateImage.redraw();
                })
            }
        });
    };
    implement.init = function () {
        $("#reset").click(function () {
            ef.nav.reload();
        });
        $("#mirror").textbox({
            prompt: '请输入名称',
            iconCls: 'icon-search',
            iconAlign: 'left',
            onChange: function (newValue, oldValue) {
                if(newValue!=oldValue){
                    implement.loadFilterName();
                }
            }
        });
        $("#imageStatus").combobox({
            prompt: '请选择状态',
            data:statusList,
            textField:'text',
            editable:false,
            valueField:'value',
            onChange: function (newValue,oldValue) {
                if(newValue!=oldValue){
                    if(newValue=="all"){newValue="";}
                    var os = $("#imageOsInter").combobox('getValue');
                    if(os=='全部'){os="";}
                    implement.loadFilter({status:newValue,os:os});
                }
            }
        });
        $("#imageOsInter").combobox({
            prompt: '请选择操作系统',
            data:osData,
            editable:false,
            textField:'text',
            valueField:'text',
            onChange: function (newValue,oldValue) {
                if(newValue!=oldValue){
                    if(newValue=="全部"){newValue="";}
                    var status = $("#imageStatus").combobox('getValue');
                    if(status=='all'){status="";}
                    implement.loadFilter({os:newValue,status:status});
                }
            }
        });
        $("#mirrorlist").datagrid({
            singleSelect: true,
            pagination: true,
            pageSize: 10,
            autoHeight:true,
            columns: [[
                {field: 'name', title: ef.util.getLocale("host.comboxtoinput.name"), width: '10%'},
                {
                    field: 'type',
                    title: ef.util.getLocale("cal.image.table.property"),
                    width: '8%',
                    formatter: function (val) {
                        if (val == 1) {
                            return ef.util.getLocale("cal.image.table.property.use");
                        }
                        else {
                            return ef.util.getLocale("cal.image.table.property.all");
                        }
                    }
                },
                {
                    field: 'size',
                    title: ef.util.getLocale("cal.image.table.size"),
                    width: '10%',
                    formatter: function (val) {
                        if(val==null){return "-";}
                       var value = ef.util.format1024(val);
                        return Number(value.value).toFixed(2)+value.unit;
                    }
                },
                {
                    field: 'status',
                    title: ef.util.getLocale("cal.image.table.status"),
                    width: '12%',
                    formatter: function (val) {
                        return '<span class="status_icon_box"><i class="icon-image icon-image-'+val+'"></i><span>'+ef.util.getLocale('cal.image.table.status.'+val)+'</span> </span>';
                    }
                },
                {field: 'disk_format', title: ef.util.getLocale("cal.image.table.gif"), width: '8%'},
                {
                    field: 'min_disk',
                    title: ef.util.getLocale("cal.image.table.sys_vol_size"),
                    width: '14%',
                    formatter: function (val) {
                        return val+"GB";
                    }
                },
                {
                    field: 'created_at',
                    title: ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.timestampfield"),
                    width: '16%',
                    formatter: function (val) {
                        return ef.util.number2time(val,"Y-M-D h:m:s",true);
                    }
                },
                {field: 'os', title: ef.util.getLocale("order.ready.info.label.os"), width: '10%'},
                {field: 'des', title: ef.util.getLocale("cal.image.table.des"), width: '16%',formatter: function (val) {
                    if(!val){return '-';}
                    var dom = $('<div></div>');
                    dom.text(val);
                    dom.attr({title:val});
                    return dom;
                }}
            ]]
        });
    };
    implement.imageWebSocket = function () {
        if(!implement.socket){
            implement.socket=new ef.server.Socket(api.getAPI('cal.image.list.socket',true),"cal.image.list.socket");
        }
        implement.socket.onmessage = function(data){
            var dataRows = $("#mirrorlist").datagrid('getData').originalRows;
            var useData = JSON.parse(data.data);
            var num=$("#mirrorlist").datagrid("options").pageNumber;
            if(useData.response=="refresh"){
                implement.getImageList(true,function (response) {
                    var num=$("#mirrorlist").datagrid("options").pageNumber;
                    $("#mirrorlist").datagrid('loadData',response).datagrid('goto',num);
                }, function () {
                    $("#mirrorlist").datagrid('loadData',[]).datagrid('goto',1);
                });
                return;
            }
            $(dataRows).each(function (i,il) {
                for(var e in useData.response){
                    if(il.id==e){
                        il.status = useData.response[e];
                    }
                }
            });
            $("#mirrorlist").datagrid('loadData',dataRows).datagrid('goto',num);
        };
    };
    implement.redraw = function () {
        $(document).ready(function () {
            implement.init();
            implement.getImageList(true, function (response) {
                $("#mirrorlist").datagrid({data: response}).datagrid('clientPaging');
                implement.imageWebSocket();
            }, function () {
            });
            var _iconMenu = $("#js-menus-wrapper").iconmenu([
                {
                    iconClass: "icon-menus-icon-add",
                    tip: ef.util.getLocale("setting.user.iconmenu.new.tip"),
                    id: 1,
                    click: function () {
                        new ef.Dialog('addImage', {
                            title: ef.util.getLocale("cal.image.add"),
                            width: 850,
                            height:446,
                            closed: false,
                            cache: false,
                            nobody: false,
                            href: 'views/addImage.html',
                            modal: true,
                            onResize: function () {
                                $(this).dialog('center');
                            },
                            onLoad: function () {
                                require(['cal.image.addImage'], function (addImage) {
                                    addImage.redraw();
                                })
                            },
                            onClose: function () {
                                require.undef('cal.image.addImage');
                            }
                        });
                    }
                },
                {
                    iconClass: "icon-menus-icon-edit",
                    tip: ef.util.getLocale("cal.image.icon.tip.edit"),
                    id: 2,
                    click: function () {
                        new ef.Dialog('editImage', {
                            title: ef.util.getLocale("cal.image.edit"),
                            width: 846,
                            height: 400,
                            closed: false,
                            cache: false,
                            nobody: false,
                            href: 'views/editImage.html',
                            modal: true,
                            onResize: function () {
                                $(this).dialog('center');
                            },
                            onLoad: function () {
                                require(['cal.image.editImage'], function (editImage) {
                                    editImage.redraw();
                                })
                            },
                            onClose: function () {
                                require.undef('cal.image.editImage');
                            }
                        });
                    }},
                {
                    iconClass: "icon-image-list-download",
                    tip: "下载",
                    id: 3,
                    click: function () {
                        var rowData = $("#mirrorlist").datagrid('getSelected');
                        try{
                            var elemIF = document.createElement("iframe");
                            elemIF.src = api.getAPI('image.download')+"/"+rowData.id;
                            elemIF.style.display = "none";
                            document.body.appendChild(elemIF);
                        }catch(e){
                            console.log(e);
                        }
                    }
                },
                {
                    iconClass: "icon-menus-icon-delete",
                    tip: ef.util.getLocale("setting.user.delete.tip"),
                    id: 4,
                    click: function () {
                        var rowData = $("#mirrorlist").datagrid('getSelected');
                        ef.messager.confirm('deleting', ef.util.getLocale("cal.image.delete.tip") +"'"+ rowData.name + '\'？',null, function (ok) {
                            if (ok) {
                                ef.loading.show();
                                ef.getJSON(
                                    {
                                        url: api.getAPI("imageOperate")+"/"+rowData.id,
                                        type: "delete",//get,post,put,delete
                                        success: function (response) {
                                            ef.loading.hide();
                                            ef.placard.tick("删除镜像成功");
                                            ef.nav.reload();
                                        },
                                        error: function () {
                                            ef.loading.hide();
                                        }
                                    });
                            }
                        });
                    }
                }
            ]);
            _iconMenu.setStatus(2,true);
            _iconMenu.setStatus(3,true);
            _iconMenu.setStatus(4,true);
            $("#mirrorlist").datagrid({
                onSelect: function (rowIndex,rowData) {
                    if(rowData.status=="active"){
                        _iconMenu.setStatus(2,false);
                        _iconMenu.setStatus(3,false);
                    }else{ _iconMenu.setStatus(2,true);_iconMenu.setStatus(3,true);}
                    if(rowData.status=="active"||rowData.status=="killed"||rowData.status=="queued"){
                        _iconMenu.setStatus(4,false);
                    }else{_iconMenu.setStatus(4,true);}
                }
            });
            $("#mirrorlist").datagrid('loading');
            $("#mirrorlist").datagrid("autoData");
        });
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});