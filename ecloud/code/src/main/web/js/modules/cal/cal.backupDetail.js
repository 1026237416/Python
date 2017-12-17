/**
 * Created by wangahui1 on 15/11/6.
 */
define(["easyui", "module", "clientPaging","role", "api","cal.backup","cal.disk.editbackup","dashboard","user"], function (easyui, module,clientPaging, role, api,calBackup,editbackup,dashboard,user) {
    var isLocal = false;
    var implement = new ef.Interface.implement();
    implement.il8 = function () {
        $("#operation").append(ef.util.getLocale('host.hostdetail.blocklistlabel.operation'));
        $("#backup").append(ef.util.getLocale('setting.project.detail.quota.backfield'));
        $(".backupdetail-icon-box").iconmenu([{
            iconClass: "icon-menus-icon-back",
            tip: ef.util.getLocale('framework.component.iconmenu.back.tip'),//"返回",
            "access": [6,7,8, 9,10, 88],
            click: function () {
                ef.nav.goto("backup.html", "cal.backup");
            }
        },{
                iconClass: "icon-menus-icon-refresh",
                tip: ef.util.getLocale('framework.component.iconmenu.refresh.tip'),//"刷新",
                "access": [6,7,8, 9, 10, 88],
                click: function () {
                    ef.nav.reload();
                }
            }]);
    };

    var backup;
    implement.refreshBackup=function(data,state,diskState) {
        if(!data.backups){
            data.backups=data.snapshots;
        }
        if(data.status=="snapshoting"){data.status = "backuping";}
        $(data.backups).each(function (i,il) {
            if(il.status=="snapshoting"){il.status = "backuping";}
        });
        delete data.snapshots;
        var config={isEdit:true};
        if(user.isAudit())
        {
            config.isEdit=false;
        }
        backup = $(".backupBox").backup(data,config);
        var rows = backup.getRows();
        var menu = null,
            dataMenus = null;
        if(!_.isNumber(state)){
            $(rows).each(function(index, row){
                menu = row.menu;
                if(state === 'all'){
                    dataMenus = [1,2,3];
                }else if(state === 'recovery'){
                    dataMenus = [1]
                }
                $(dataMenus).each(function(i, il){
                    menu.setStatus(il,true);
                });
            });
        }else{
            $(rows).each(function(index, row){
                menu = row.menu;
                $([1,2,3]).each(function(i, il){
                    menu.setStatus(il,false);
                });
            });
        }
        //if(diskState === 'in-use'){
        //    $(rows).each(function(index, row){
        //        row.menu.setStatus(1,true);
        //    });
        //}
    };
    implement.getOperateAction=function(type,opearation,vmd)
    {
        var arrs=["server.operate",type,opearation,vmd];
        return ef.util.getLocale(arrs.join("."));
    };
    implement.backupDetailWebsocket = function () {
        var backupTemp = {
            status:'',
            snapshots:[]
        };
        if(!implement.socket){
            implement.socket=new ef.server.Socket(api.getAPI('cal.backup.detail.socket',true),"cal.backup.detail.socket");
        }
        implement.socket.onopen = function () {
            var item = {id:implement.name};
            implement.socket.send(JSON.stringify(item));
        };
        implement.socket.onmessage = function(data){
            var useData = JSON.parse(data.data);
            var response = useData.response;
            var type = useData.type;
            switch (type){
                case 'snapshots':{
                    if(response=="refresh"){
                        implement.getBackupData(implement.type,implement.name);
                        return;
                    }
                    if(response=="quit"){
                        ef.nav.goto("backup.html","cal.backup");
                        return;
                    }
                    implement.dataHandle(response);
                    break;
                }
                case "snapshot_log":
                {
                    if(response == 'refresh'){
                        implement.logRef(0,implement.name);
                    }
                }
            }
        }
    };
    implement.logTab = function () {
        $("#backup_log").datagrid(
            {
                pagination: true,
                pageSize: 10,
                singleSelect: true,
                height: 430,
                fitColumns:true,
                resizeHandle:"left",
                columns: [[
                    {
                        field: 'time',
                        title: ef.util.getLocale("log.table.time"),
                        width: '24%',
                        align:"left",
                        resizable:true,
                        formatter: function (val) {
                            return ef.util.number2time(val, "Y-M-D h:m:s", true);
                        }
                    },
                    {
                        field: 'user', title: ef.util.getLocale("log.table.user"), width: '23%',
                        align:"left",
                        resizable:true
                    },
                    {
                        field: 'role', title: ef.util.getLocale("log.table.role"), width: '23.2%',
                        align:"left",
                        resizable:true,
                        formatter: function (val) {
                            return role.getRoleByType(val).label;
                        }
                    },
                    {
                        field: 'operation',
                        title: ef.util.getLocale("log.table.operate"),
                        width: '20%',
                        align:"left",
                        resizable:true,
                        formatter: function (val) {
                            return ef.util.getLocale("server.operate." + val);
                        }
                    },
                    {field: 'des', title: ef.util.getLocale("log.table.event"), width: '12.5%',
                        align:"left",
                        resizable:true,
                        formatter:function(val,row){

                            var $dom = $("<ul></ul>");
                            $dom.css({"overflow":"hidden","text-overflow":"ellipsis","white-space":"nowrap"});
                        //dashboard.updateLog(row,$dom,true);
                        //$dom.text(val).attr("title",val);
                        //return $dom;
                            /*if(row.object.indexOf("vm")!=-1){
                                var txt=implement.getOperateAction(row.type,row.operation,"vm")+row.des;
                            }else if(row.object.indexOf("vd")!=-1){
                                var txt=implement.getOperateAction(row.type,row.operation,"vd")+row.des;
                            }*/
                            var txt=val?val:"-";
                            $dom.text(txt).attr('title',txt);
                            return $dom;
                            //return ef.util.getLocale("server.operate." + row.operation)+"备份"+val
                    }}
                ]]
            });
    };
    implement.logRef = function(startNumber,object){
        var arg=arguments,
            logname = arg[1],
            url = api.getAPI('log.getLoglist');
        ef.getJSON({
            url:url,
            type:"get",
            type:"get",
            useLocal:false,
            data: {
                start:startNumber,
                type:"snapshot",
                object:object,
                limit:10,
                fuzzy:false
            },
            success:function(response,allResult){//,allResult
                $('#backup_log').datagrid("loadData",response).datagrid('getPager').pagination(
                    {
                        showPageList:false,
                        showRefresh:false,
                        onSelectPage:function(pageNumber, pageSize)
                        {
                            var pagenumber = (pageNumber-1)*10;
                            arg.callee(pagenumber,logname);//调用logRef（）
                        }
                    }).pagination("refresh",{total:allResult.total,pageNumber:(startNumber/10)+1});
            },
            error:function(error){
                console.log(error);
            }
        });
    };
    implement.dataHandle = function (response) {
        var backupTemp = {
            status:'',
            snapshots:[]
        };
        if(response.snapshots.length == 0){
            $('#backup-log-list').hide();
            return;
        }
        var bpdata= [];
        var state = -1;
        if(response.status == 'in-use'||response.status=='powering-on'||response.status=='powering-off'||response.status=='snapshoting'
            ||response.status == 'recovering'||response.status=='deleting'||response.status=='migrating'||response.status=='uploading'
            ||response.status=='wait_reboot'||response.status=='wait_boot'||response.status=='attaching'||response.status=='detaching'
        ){
            state = 'recovery';
        }
        backupTemp.status = response['recover-status'];
        $(response.snapshots).each(function (i,il) {
            bpdata.push({
                title:il.displayname,
                time:il.create_at,
                size:il.size,
                unit: "GB",
                des:il.des,
                id:il.id,
                status:il.status
            });
            if(il.status == 'creating' || il.status == 'recovering'||il.status == 'deleting'){
                state = 'all';
            }
        });
        backupTemp.snapshots = bpdata;
        implement.backupData = backupTemp;
        implement.stateValue = state;
        implement.statusValue = response.status;
        implement.refreshBackup(backupTemp, state,response.status);
        backup.hideTip();

        backup.click(function(rowData,btnData){
            var type;
            if(ef.localStorage.get("backuptype")==0){
                type = "vm";
            }
            if(ef.localStorage.get("backuptype")==1){
                type = "volume";
            }
            // console.log(rowData,btnData);
            if (btnData.type == "revert") {//恢复
                $.messager.confirm(ef.alert.warning, ef.util.getLocale('cal.backupDetail.message.revert') + "'" + rowData.title + "'" + '?', function (ok) {
                    if (ok) {
                        //ef.placard.tick(ef.util.getLocale("cal.backup.reverting"));
                        ef.getJSON({
                            url: api.getAPI("backupCreating") + "/"+rowData.id+"/recover",
                            type: "get",//get,post,put,delete
                            useLocal:isLocal,
                            success: function (response) {
                                var text = '';
                                if(String(name).indexOf('vm') > -1){
                                    text = ef.util.getLocale("cal.backupRevert.success.doing");
                                }else if(String(name).indexOf('vd') > -1){
                                    text = ef.util.getLocale("cal.disk.backupRevert.success.doing");
                                }else{
                                    console.log('back up name---',name);
                                }
                                ef.placard.doing(text);
                                //implement.getBackupData(type,name);
                            },
                            error: function (error) {
                                console.log(error);
                            }
                        });
                    }
                });
            }
            if (btnData.type == "delete") {//删除
                $.messager.confirm(ef.alert.warning, ef.util.getLocale('cal.backupDetail.message.delete') + "'" + rowData.title + "'" + '?', function (ok) {
                    if (ok) {
                        //ef.placard.tick(ef.util.getLocale("cal.backup.deleting"));
                        ef.getJSON({
                            url: api.getAPI("backupCreating") + "/" + rowData.id,
                            type: "delete",//get,post,put,delete
                            useLocal:isLocal,
                            success: function () {
                                var text = '';
                                if(String(name).indexOf('vm') > -1){
                                    text = ef.util.getLocale("cal.backupDelete.success.doing");
                                }else if(String(name).indexOf('vd') > -1){
                                    text = ef.util.getLocale("cal.disk.backupDelete.success.doing");
                                }else{
                                    console.log('back up name---',name);
                                }
                                ef.placard.doing(text);
                                //implement.getBackupData(type,name);
                            },
                            error: function (error) {
                                console.log(error);
                            }
                        });
                    }
                });
            }
            if(btnData.type=="edit"){//编辑
                new  ef.Dialog('editbackup',{
                    title: ef.util.getLocale('cal.disk.editbackup'),
                    width:685,
                    height:314,
                    closed: false,
                    cache: false,
                    nobody:false,
                    href: 'views/cal.editbackup.html',
                    modal: true,
                    onResize:
                        function(){
                            $(this).dialog("center");
                        },
                    onLoad:function()
                    {
                        require(['cal.disk.editbackup'], function (editbackup) {
                            editbackup.redraw();
                            $("#diskeditname").empty().textbox('setValue', rowData.title);
                            $("#diskeditbackup").empty().val(rowData.des);
                            $("#disk_ok").click(function () {
                                var newname = $("#diskeditname").textbox('getValue');
                                var newbackup = $("#diskeditbackup").val();
                                if ($("#edit_ok").css("opacity") == 1) {
                                    if (!$("#diskeditname").textbox('isValid')) {
                                        return;
                                    }
                                    ef.loading.show();
                                    ef.getJSON({
                                        url: api.getAPI("backup.edit")+'/'+ rowData.id,
                                        type: "post",
                                        isForce: !isLocal,
                                        useLocal:isLocal,
                                        data: {
                                            'name': newname,
                                            'des': newbackup
                                        },
                                        success: function (response) {
                                            ef.loading.hide();
                                            ef.Dialog.closeAll();
                                            ef.nav.reload();
                                        },
                                        error: function (error) {
                                            ef.loading.hide();
                                            console.log(error);
                                        }
                                    });
                                }
                            });
                        })
                    },
                    onClose:function()
                    {
                        require.undef('cal.disk.editbackup');
                    }
                });
            }
        });
    };
    implement.getBackupData = function (type,name) {
        var url = api.getAPI("backup.list.name");
        if(!isLocal){
            url += ('/'+name);
        }
        ef.getJSON({
            url: url,
            type:"get",
            useLocal:isLocal,
            success: function (response) {
                implement.dataHandle(response);
            },
            error: function (error) {
                console.log(error);
            }
        });
    };
    implement.redraw = function () {
        $(".backupBox").preload(210);
        implement.il8();
        implement.logTab();
        ef.util.ready(function (dom) {
            var _data = ef.util.getCrossData(dom);
            implement.id = _data.id;
            implement.name = _data.name;
            if(_data.type==0){implement.type="vm";}else{implement.type="volume"}
            implement.backupDetailWebsocket();
            var _iconMenu = $("#js-menus-wrapper").iconmenu([
                {
                    iconClass:"icon-return-vm-disk",
                    tip:ef.util.getLocale('cal.backup.return'),//"新建"
                    id:1,
                    click:function(menu)
                    {
                        if(_data.type&&_data.type==1){
                            ef.nav.goto("hostDetail.html", "cal.host.hostDetail", _data.id, null, "cal.host");
                        }
                        if(_data.type&&_data.type==2){
                            ef.nav.goto("disk.html", "cal.disk", _data.id, null, "cal.disk");
                        }
                    }
                }
            ]);
            implement.logRef(0,_data.name);
            if(_data.type&&_data.type==1){//备份管理云主机
                implement.getBackupData("vm",_data.name);
                return;
            }
            if(_data.type&&_data.type==2){//备份管理云硬盘
                implement.getBackupData("volume",_data.name);
                return;
            }
            if(ef.localStorage.get("backuptype")==0){
                implement.getBackupData("vm",_data.name);
            }
            if(ef.localStorage.get("backuptype")==1){
                implement.getBackupData("volume",_data.name);
            }
        });
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});