/**
 * Created by xuyuxnia on 15/11/6.
 */
define(['easyui', 'user', 'clientPaging', 'domReady', "module", 'api', "cal.host.hostDetail","resize"], function (eu, user, clientPaging, domReady, module, api, hostDetail) {
    var implement = new ef.Interface.implement();
    implement.filterDefault = function (response) {
        var result = [];
        $(response).each(function (i, il) {
            if (il.name == "admin" || il.name == "services") {
                return;
            }
            result.push(il);
        });
        return result;
    };
    //i18n
    implement.projectData = function (callback) {
        ef.getJSON(
            {
                url: api.getAPI("setting.project.datagrid_tenants"),
                type: "get",//get,post,put,delete
                isForce: true,
                success: function (response) {
                    response = implement.filterDefault(response);
                    response = ef.util.sort("name", response);
                    callback(response);
                }
            });
    };
    implement.projectTen = function (j,il) {
        ef.getJSON({
            url:api.getAPI("setting.project.datagrid_project")+"/"+il.id+"/quota",
            type:"get",
            success: function (response) {
                $(response).each(function (e,el) {
                    for(var i in el){
                        il["used_"+el.quota_name+""] = el.quota_used;
                        if(el.quota_limit==-1){
                            il[""+el.quota_name+""]="-";
                            return ;
                        }
                        il[""+el.quota_name+""] = el.quota_limit;
                    }
                });
                $('#tenantlist').datagrid('refreshRow',j);
            }
        });
        //ef.getJSON({
        //    url:api.getAPI("setting.project.datagrid_project")+"/"+il.id+"/users",
        //    type:"get",
        //    success: function (response) {
        //        il.user_count = response.length;
        //        $('#tenantlist').datagrid('refreshRow',j);
        //    }
        //});
    };
    implement.projectRef = function (isFirst,callback) {
        implement.projectData(function (response) {
            if (isFirst) {
                $('#tenantlist').datagrid({data: response}).datagrid('clientPaging',{
                    onPage:function(number,size)
                    {
                        var _row = $('#tenantlist').datagrid('getRows');
                        $(_row).each(function (j,il) {
                            implement.projectTen(j,il);
                        });
                        if(callback){
                            callback();
                        }
                    }
                });
                var rows = $('#tenantlist').datagrid('getRows');
                $(rows).each(function (j,il) {
                    implement.projectTen(j,il);
                });
            } else {
                $('#tenantlist').datagrid("loadData", response).datagrid("goto", 1);
            }
        });
    };
    implement.filter = function () {
        var opt =  $("#username").textbox('getValue').toLowerCase();
        $("#tenantlist").datagrid({
            loadFilter: function (data) {
                var tmp = {total:0,rows:[]};
                $(data).each(function (i,il) {
                    if(!opt){
                        tmp.total=i+1;
                        tmp.rows.push(il);
                    }
                    if(opt&&il.name.toLowerCase().indexOf(opt)!=-1){
                        tmp.total = tmp.total+1;
                        tmp.rows.push(il);
                    }
                });
                return tmp;
            }
        }).datagrid('clientPaging',{
            onPage:function() {
                var _row = $('#tenantlist').datagrid('getRows');
                $(_row).each(function (j, il) {
                    implement.projectTen(j, il);
                });
            }
        }).datagrid("goto",1);
        //var rows = $('#tenantlist').datagrid('getRows');
        //$(rows).each(function (j,il) {
        //    implement.projectTen(j,il);
        //});

    };
    implement.init = function () {

        $("th[field='name']").append(ef.util.getLocale('setting.project.datagrid.username'));
        $("th[field='description']").append(ef.util.getLocale('setting.project.datagrid.remark'));
        $("th[field='used_cores']").append(ef.util.getLocale('setting.project.datagrid.core'));
        $("th[field='used_memory']").append(ef.util.getLocale('setting.project.datagrid.memo'));
        $("th[field='used_disks']").append(ef.util.getLocale('setting.project.datagrid.disk'));
        $("th[field='used_snapshot__capacity']").append(ef.util.getLocale('setting.project.datagrid.diskgb'));
        $("th[field='used_backups']").append(ef.util.getLocale('setting.project.datagrid.backunit'));
        $("th[field='used_backup_capacity']").append(ef.util.getLocale('setting.project.datagrid.backgb'));
        $("th[field='user_count']").append(ef.util.getLocale('setting.project.datagrid.usernum'));
    };
    implement.formatter = function (val,row,param) {
        if(row[''+param+'']==-1){
            return val+"/-";
        }
        return val+"/"+row[''+param+''];
    };
    implement.redraw = function () {
        domReady(function () {
            implement.init();
            $("#reset").click(function () {
                $("#username").textbox('clear');
                implement.projectRef(true, function () {
                    //project manager will not show icon menus
                    if (user.isTenant()) {
                        return false;
                    }
                    _iconmenu.setStatus("2", true);
                })
            });
            $("#tenantlist").datagrid({
                singleSelect: true,
                pagination: true,
                height:'100%',
                pageSize: 10,
                autoHeight:true,
                columns: [
                    [
                        {field: 'name', title: '名称', formatter: function (val, row, index) {
                            var _row = ef.util.escapeJSON(JSON.stringify(row));
                            return  '<a onclick="ef.nav.goto(\'tenanteDetail.html\',\'setting.tenanteDetail\',\'' + _row + '\',null,\'setting.project\')" class="table-link">' + val + '</a>';
                        },
                            width: '12%'},
                        {
                            field: 'used_cores', title: 'CPU(核)', width: '13%', formatter: function (val, row) {
                            val=(!val||isNaN(val))?0:val;
                            row.cores=(isNaN(row.cores))?-1:row.cores;
                            return '<span style="padding-left: 3px;">' + implement.formatter(val,row,"cores") + '</span>';
                        }
                        },
                        {
                            field: 'used_memory', title: '内存(GB)', width: '13%', formatter: function (val, row) {
                            val=(!val||isNaN(val))?0:val;
                            row.memory=(isNaN(row.memory))?-1:row.memory;
                            if(row.memory==-1){
                                return '<span style="padding-left: 3px;">' +(Math.round(val/1024) + "/-")+ '</span>';
                            }
                            return Math.round(val/1024) + "/" + row.memory/1024 ;
                        }
                        },
                        {
                            field: 'used_disks', title: '云硬盘(个)', width: '14%', formatter: function (val, row) {
                            val=(!val||isNaN(val))?0:val;
                            row.disks=(isNaN(row.disks))?-1:row.disks;
                            return '<span style="padding-left: 6px;">' +implement.formatter(val,row,"disks")+ '</span>';
                        }
                        },
                        {
                            field: 'used_disk_capacity', title: '云硬盘(GB)', width: '14%', formatter: function (val, row) {
                            val=(!val||isNaN(val))?0:val;
                            row.disk_capacity=(isNaN(row.disk_capacity))?-1:row.disk_capacity;
                            return '<span style="padding-left: 7px;">' +implement.formatter(val,row,"disk_capacity")+ '</span>';
                        }
                        },
                        {
                            field: 'used_snapshots', title: '快照(个)', width: '13%', formatter: function (val, row) {
                            val=(!val||isNaN(val))?0:val;
                            row.snapshots=(isNaN(row.snapshots))?-1:row.snapshots;
                            return '<span style="padding-left: 6px;">' +implement.formatter(val,row,"snapshots")+ '</span>';
                        }
                        },
                        {
                            field: 'used_snapshot_capacity', title: '快照(GB)', width: '13%',
                            formatter: function (val, row) {
                                val=(!val||isNaN(val))?0:val;
                                row.snapshot_capacity=(isNaN(row.snapshot_capacity))?-1:row.snapshot_capacity;
                                return '<span style="padding-left: 8px;">' +implement.formatter(val,row,"snapshot_capacity")+ '</span>';
                            }
                        },
                        {field: 'count', title: '用户个数', width: '14%',
                            formatter: function(val) {
                                if(val){
                                    return '<span style="padding-left: 7px;">' + val +'</span>'
                                }else{
                                    return '<span>-</span>'
                                }
                            }
                        }
                    ]
                ]
            });
            $("#username").textbox({
                prompt: ef.util.getLocale('setting.project.search-item.username.prompt'),//'请输入名称',
                iconCls:'icon-search',
                iconAlign:'left',
                onChange: function (newValue,oldValue) {
                    implement.filter();
                }
            }).textbox("clear");
            //project manager will not show icon menus
            if (user.isTenant()) {
                implement.projectRef(true, function () {
                    return false;
                });
                $('#tenantlist').datagrid('loading');
                $("#js-menus-wrapper").empty();
                return;
            }
            var _iconmenu = $("#js-menus-wrapper").iconmenu([
                {
                    iconClass: "icon-menus-icon-add",
                    tip: ef.util.getLocale("setting.project.iconmenu.new.tip"),
                    "access": [8, 88],
                    click: function () {
                        new ef.Dialog('settingaddPro', {
                            title: ef.util.getLocale("setting.project.iconmenu.new.tip.project"),
                            width: 600,
                            height: 326,
                            closed: false,
                            cache: false,
                            nobody: false,
                            href: 'views/setting.addProject.html',
                            modal: true,
                            onResize: function () {
                                $(this).dialog('center');
                            },
                            onClose: function () {
                                require.undef('setting.addProject');
                            },
                            onLoad: function () {
                                require(['setting.addProject'], function (addProject) {

                                    addProject.redraw();
                                });
                            }
                        });
                    }
                },
                {
                    iconClass: "icon-menus-icon-delete",
                    tip: ef.util.getLocale("setting.project.delete.tip"),
                    id: 2,
                    "access": [8, 88],
                    click: function () {
                        var tenantlist = $("#tenantlist").datagrid('getChecked');
                        var tenantId;
                        for (i = 0; i < tenantlist.length; i++) {
                            var name = tenantlist[i].name;
                            tenantId = tenantlist[i].id;
                        }
                        ef.messager.confirm('deleting', ef.util.getLocale("setting.project.tenantlist.delete.ok")+ "'" + name + "'？",null, function (ok) {
                            if (ok) {
                                ef.getJSON(
                                    {
                                        url: api.getAPI("setting.project.datagrid_project") + "/" + tenantId,
                                        type: "delete",//get,post,put,delete
                                        success: function (response) {
                                            implement.projectRef(false,function () {
                                                _iconmenu.setStatus("2", true);
                                            });
                                            ef.placard.tick(ef.util.getLocale("setting.project.placard.delproject"));
                                            _iconmenu.setStatus("2", true);
                                            $("#username").textbox('clear');
                                        },
                                        error: function (error) {
                                            console.log(error);
                                        }
                                    });
                            } else {
                                //_iconmenu.setStatus("2", true);
                                //$("#tenantlist").datagrid("uncheckAll");
                                //implement.projectRef(true, function () {
                                //    _iconmenu.setStatus("2", true);
                                //})
                                //$("#username").textbox('clear');
                            }
                        });
                    }
                }
            ]);
            _iconmenu.setStatus("2", true);
            $("#tenantlist").datagrid({
                onCheck: function (rowIndex, rowData) {
                    _iconmenu.setStatus("2", false);
                }
            });
            implement.projectRef(true, function () {
                _iconmenu.setStatus("2", true);
            });
            $('#tenantlist').datagrid("autoData");
            $('#tenantlist').datagrid('loading');
        })
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});