/**
 * Created by wangahui1 on 15/11/6.
 */
define(["module","domReady","easyui","clientPaging","user","api","cal.image","cal.host","cal.backup","resize"],function(module,domReady,easyui,clientPaging,user,api,image,cal_host,backup)
{
    var implement=new ef.Interface.implement( );
    //新建云硬盘
    implement.addDisk=function()
    {
        require(["modules/cal/cal.disk.adddisk"],function(addDisker)
        {
            new ef.Dialog("addDiskDialog",{
                title: ef.util.getLocale("cal.disk.adddisk"),
                width: 802,
                height: 464,
                closed: false,
                cache: false,
                nobody: false,
                href: 'views/addDisk.html',
                modal: true,
                onResize: function () {
                    $(this).dialog('center');
                },
                onLoad: function () {
                    addDisker.redraw();
                },
                onClose: function () {
                    addDisker.destroy();
                }
            });
        });
    };
    implement.filter = function () {
        var opt = $("#username").textbox('getValue').toLowerCase();
        var pro = $("#project").combobox('getValue');
        var state = $("#status").combobox('getValue');
        pro=pro=="全部"?"":pro;
        state=state=="all"?"":state;
        var _states=["attaching","snapshoting","deleteing","creating","recovering"];
        $('#gridtable').datagrid({
            loadFilter: function(data){
                var tmp = {total:0,rows:[]};
                $(data).each(function (i,il) {
                    if(!opt){opt = il.name.toLowerCase()}
                    if(!state){state = il.status}
                    if(state=="other"){state = _states;}
                    if(!pro){pro = il.tenantName}
                    if(!il.host){il.host="";}
                    if(!il.username){il.username=""}
                    //if(il.attachments.length) {
                    //    var id,host;
                    //    $(il.attachments).each(function (e, el) {
                    //        id = el.vm_id;
                    //    });
                    //    host=implement.tool(id,false,$("<div></div>"));
                    //}
                    if(pro==il.tenantName&&(state==il.status||state.indexOf(il.status)!=-1)&&(il.name.toLowerCase().indexOf(opt)!=-1||il.username.toLowerCase().indexOf(opt)!=-1||il.displayname.toLowerCase().indexOf(opt)!=-1)){
                        tmp.total = tmp.total+1;
                        tmp.rows.push(il);
                    }
                    opt = $("#username").textbox('getValue').toLowerCase();
                    state = $("#status").combobox('getValue');
                    pro = $("#project").combobox('getValue');
                    pro=pro=="全部"?"":pro;
                    state=state=="all"?"":state;
                });
                return tmp;
            }
        }).datagrid('clientPaging').datagrid("goto",1);
    };
    implement.table= function () {
        $("#gridtable").datagrid({
            singleSelect:true,
            pagination:true,
            autoHeight:true,
            pageSize:10,
            onLoadSuccess:function()
            {
                $.parser.parse(".menuBound");
            },
            columns:
                [[
                    {field:"name" , width:"8%",title:ef.util.getLocale('host.hostdetail.blocklistlabel.description.data_disk.tooltip')},
                    {field:"displayname", width:"10%",title:ef.util.getLocale('setting.userdetail.datagrid.name')},
                    {field:"location", width:"17%",title:ef.util.getLocale('log.table.type'),formatter: function (val) {
                        if(!val){return "<span>-</span>";}
                        var last = val.substring(val.lastIndexOf('#')+1,val.length);
                        var first = val.substring(0,val.indexOf('@'));
                        var dom = $('<div><span class="location-type"></span><span class="location-vm"></span></div>');
                        dom.find('.location-vm').text("("+first+")");
                        dom.find('.location-type').text(last);
                        return dom;
                    }},
                    {field:'size_gb', width:"10%",title:ef.util.getLocale('cal.disk.list.volunm')},
                    {field:"status", width:"10%", formatter:function(val,row,index)
                    {
                        if(val=="available"){
                            return '<span class="status_icon_box"><i class="icon-status-done-unmount"></i><span>'+ef.util.getLocale('cal.disk.status1')+'</span> </span>';
                        }
                        else if(val=="in-use"){
                            return '<span class="status_icon_box"><i class="icon-status-done-mount"></i><span>'+ef.util.getLocale('cal.disk.statusready')+'</span> </span>';
                        }
                        else if(val=="error"){
                            return '<span class="running"><i class=" easyui-tooltip icon-state" style="background-position: -517px -57px;"><span class="host_status" style="color:#6e6e6e;">'+ef.util.getLocale('host.list.status.error.tip')+'</span></i>';
                        }
                        else if(val=="deleting") {
                            return '<span class="status_icon_box"><i class="icon-status-doing"></i><span>'+ef.util.getLocale('host.list.status.delete.tip')+'</span> </span>';
                        }
                        else if(val=="snapshoting"){
                            return '<span class="status_icon_box"><i class="icon-status-doing"></i><span>'+ef.util.getLocale('cal.disk.backuping')+'</span> </span>';
                        }
                        else if(val=="recovering"){
                            return '<span class="status_icon_box"><i class="icon-status-doing"></i><span>'+ef.util.getLocale('cal.disk.else')+'</span> </span>';
                        }
                        else if(val=="creating"){
                            return '<span class="status_icon_box"><i class="icon-status-doing"></i><span>'+ef.util.getLocale('host.list.status.creating.tip')+'</span> </span>';
                        }
                        else if(val=="attaching"){
                            return '<span class="status_icon_box"><i class="icon-status-doing"></i><span>'+ef.util.getLocale('cal.disk.status.attaching')+'</span> </span>';
                        }
                        else if(val=="detaching"){
                            return '<span class="status_icon_box"><i class="icon-status-doing"></i><span>'+ef.util.getLocale('cal.disk.status.detaching')+'</span> </span>';
                        }
                    },title:ef.util.getLocale('setting.userdetail.datagrid.status')},
                    {field:"host", formatter: function (val, row) {
                        if (row.status == "deleting") {
                            return null;
                        }
                        _row = ef.util.escapeJSON(JSON.stringify(row));
                        if (row.status == "available") {
                            var _id = row.id + "_menucontent";
                            if (!row.username) {
                                var dom = $('<div></div>');
                                dom.text('挂载');
                                dom.addClass("menuBoundDisabled");
                                return dom;
                            }
                            if (row.username) {
                                var _dom = $('<div class="menuBound">' +
                                    '<a href="#" gridid="' + row.id + '" style="padding:0;margin:0;border:0;border-radius:0;width:59px;height:25px" class="easyui-menubutton menu_txt " data-options="menu:\'#' + _id + '\'">挂载</a>'
                                    +
                                    '<div id="' + _id + '" class="menu-content" style="text-align:left;display: none;width: 415px;height: 190px;overflow-y:auto;padding-left:5px;padding-right:5px;">' +
                                    '<div style="border-bottom:1px solid #ced7e4;background-color: #ffffff;text-align: center;height: 28px;font-size: 14px;color:#a5a5a5;margin-bottom: 10px">选择挂载</div>' +
                                    '<div class="loading"><span class="inner-loading2"></span></div>' +
                                    '<table class="context_table easyui-datagrid"  style="width:400px;display: block;height: 135px;overflow-y: auto"><thead>' +
                                    '</table>' +
                                    '' +
                                    '</div>' +
                                    '' +
                                    '</div>');
                                _dom.find(".menu_txt").attr("relation", _id);
                                var host = row.location;var hostStart;
                                var hostLast = host.substring(host.indexOf("#")+1,host.length);
                                if(hostLast=="lvm"){hostStart = host.substring(0,host.indexOf("@"));}
                                _dom.find(".menu_txt").mouseover(function (e) {
                                    $("#" + _id).find(".loading").show();
                                    implement.hostGrid(row, "#" + _id,hostStart);
                                });
                                _dom.find(".menu_txt").mouseout(function()
                                {
                                    $("#" + _id).find(".loading").hide();

                                });
                                return _dom;
                            }
                        }
                        var $dom=$('<div></div>');
                        var $sDom=$('<a style="text-decoration: none;color: #4DA4D6" href="#"></a>');
                        if(val&&!ef.util.isEmpty(val)){
                            $sDom.text(val.displayname);
                            $sDom.tooltip({
                                content:"<p>ID:" + val.name + "</p>" + "<p>" + ef.util.getLocale('setting.userdetail.datagrid.name') + ":" + val.displayname + "</p>" + "<p>IP:" + cal_host.getRealIp(val) + "</p>" + "<p>" + ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.operatingsystemfield') + ":" + val.image.os + "</p>"
                            });
                            $dom.append($sDom);
                            $sDom.click(function () {
                                $sDom.tooltip('destroy');
                                setTimeout(function () {
                                    ef.nav.goto("hostDetail.html", "cal.host.hostDetail", val.id, null, "cal.host");
                                }, 10);
                                return false;
                            });
                            return $dom;
                        }
                        },title:ef.util.getLocale('framework.component.nav.cal.host.label'),width:"13%"},
                    {field:"tenant", width:"12%",title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.tenantfield'),
                         formatter:function(val){
                              if(ef.util.isEmpty(val)){
                                  return '-';
                               }
                             else{
                                   return val.name;
                               }
                       }
                    },
                    {field:"username" ,width:"12%",title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.userfield'),formatter: function (val,row) {
                        if(!val){return "-";}
                        var $dom=$('<div></div>');
                        $dom.text(val);
                        $dom.attr({title:row.user.name});
                        return $dom;
                    }},
                    {field:"des", width:"13%",title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.remarkfield'),formatter:function(val){
                        if(!val){return "-";}
                        var dom=$("<div class='disk-des'></div>");
                        dom.text(val).attr("title",val);
                        return dom;
                    }}
                ]]
        });
    };
    implement.diskWebSocket = function () {
        var dataRows = $("#gridtable").datagrid('getData').rows;
        if(!implement.socket){
            implement.socket=new ef.server.Socket(api.getAPI('cal.disk.list.socket',true),"cal.disk.list.socket");
        }
        implement.socket.onmessage = function(data){
            var useData = JSON.parse(data.data);
            if(useData.response=="refresh"){
                implement.diskRef(false);
                return;
            }
            $(dataRows).each(function (i,il) {
                for(var e in useData.response){
                    if(il.name==e){
                        il.status = useData.response[e].state;
                        il.attachments = useData.response[e].attachments;
                        if(useData.response[e].state=="in-use"){
                            $(il.attachments).each(function (e,el) {
                                ef.getJSON({
                                    url:api.getAPI("cal.host.getHostlist")+"/"+el.vm_id,
                                    type:"get",
                                    success: function (resp) {
                                        il.host = resp;
                                        $('#gridtable').datagrid('loadData',dataRows).datagrid('goto',1);
                                    }
                                });
                            });
                        }else{il.host = []; $("#gridtable").datagrid('loadData',dataRows).datagrid('goto',1);}
                    }
                }
            });
        };
    };
    implement.diskRef= function (isFirst,callback) {
        ef.getJSON({
            url:api.getAPI("cal.disk.datagrid")+"?detailed=true",
            type:"get",//get,post,put,delete
            isForce:true,
            success:function(response) {
                var a = 0,d = 0;
                var b = [];
                var result = [];
                $(response).each(function (i,il) {
                    if(il.type=="0"){
                        result.push(il);
                    }
                });
                if(result.length!=0){
                    $(result).each(function (i,il) {
                        d++;
                        il.username=il.user.displayname;
                        if(il.tenant!=null){
                            il.tenantName=il.tenant.name;
                        }
                        il.des = il.metadata.des;
                        il.displayname = il.metadata.displayname;
                        if(il.attachments.length!=0){
                            b.push(il);
                            $(il.attachments).each(function (e,el) {
                                ef.getJSON({
                                    url:api.getAPI("cal.host.getHostlist")+"/"+el.vm_id,
                                    type:"get",
                                    success: function (resp) {
                                        a++;
                                        il.host = resp;
                                        if(a== b.length){
                                            if(isFirst){
                                                $('#gridtable').datagrid({data:result}).datagrid('clientPaging',{onPage: function () {
                                                    if(callback){
                                                        callback();
                                                    }
                                                }});
                                                implement.diskWebSocket();
                                            }
                                            else{
                                                $('#gridtable').datagrid('loadData',result).datagrid('goto',1);
                                                implement.diskWebSocket();
                                            }
                                        }
                                    }
                                });
                            });
                            return;
                        }
                        if(d==result.length){
                            if(isFirst){
                                $('#gridtable').datagrid({data:result}).datagrid('clientPaging',{onPage: function () {
                                    if(callback){
                                        callback();
                                    }
                                }});
                                implement.diskWebSocket();
                            }
                            else{
                                $('#gridtable').datagrid('loadData',result).datagrid('goto',1);
                                implement.diskWebSocket();
                            }
                        }
                    });
                }
               else{
                    if(isFirst){
                        $('#gridtable').datagrid({data:result}).datagrid('clientPaging',{onPage: function () {
                            if(callback){
                                callback();
                            }
                        }});
                        implement.diskWebSocket();
                    }
                    else{
                        $('#gridtable').datagrid('loadData',result).datagrid('goto',1);
                        implement.diskWebSocket();
                    }
                }
            }
        });
    };
    implement.combo= function () {
        $("#username").textbox({
            prompt:ef.util.getLocale('cal.disk.comboxtoinput.username'),
            iconCls:'icon-search',
            iconAlign:'left',
            width:250,
            onChange: function (newValue, oldValue) {
                implement.filter();
            }
        });
        ef.getJSON({
            url:api.getAPI("setting.project.datagrid_tenants"),
            type:"get",//get,post,put,delete
            success:function(response) {
                var result = [];
                $(response).each(function (i, il) {
                    if (il.name == "admin" || il.name == "services") {
                        return;
                    }
                    result.push(il);
                });
                result.unshift({"name":"全部"});
                $("#project").combobox({
                    prompt:ef.util.getLocale('cal.disk.comboxtoinput.selectproject'),
                    data: result,
                    textField:'name',
                    valueField:'name',
                    onSelect: function (newValue,oldValue) {
                        $(this).combobox('setValue', newValue.name);
                        implement.filter();
                    },
                    filter: function(p, row){
                        if(p == ""){
                            return true
                        }
                        var opts = $(this).combobox('options');
                        return row[opts.textField].toLowerCase().indexOf(p) !== -1;
                    },
                    onHidePanel: function(){
                        var opt = $(this).combobox('options');
                        var data = opt.data;
                        var val = $(this).combobox('getText');
                        var index = _.findKey(data, function (item) {
                            return item.name == val
                        });
                        if(!index){
                            $(this).combobox('setValue', '');
                            implement.filter();
                        }
                    }
                });
            }
        });
        //请选择状态
        ef.getJSON({
            url:api.getAPI("cal.disk.combobox.status"),
            type:"get",//get,post,put,delete
            useLocal:true,
            success:function(response) {
                $("#status").combobox({
                    prompt:ef.util.getLocale('cal.disk.comboxtoinput.selectstatus'),
                    valueField:'value',
                    data:response,
                    textField:'label',
                    editable:false,
                    onChange: function (newValue,oldValue) {
                        implement.filter();
                    }
                });
            }
        });
    };
    implement.init=function ( ) {
        //var winheight = window.innerHeight;
        //var ch=$(".search-item").height();
        //var height=parseFloat(winheight)-(parseFloat(ch)+16+16+36+47+10);
        //$(".tablebox")[0].style.height=height+"px";
        //$(window).on('resize.cal.disk',function(){
        //    var winheight = window.innerHeight;
        //    var ch=$(".search-item").height();
        //    var height=parseFloat(winheight)-(parseFloat(ch)+16+16+36+47+10);
        //    if($(".tablebox")[0]){
        //        $(".tablebox")[0].style.height=height+"px";
        //    }
        //});
    };
    implement.hostGrid= function (diskId,id,host) {
        if(diskId){
            ef.getJSON({
                url: api.getAPI("cal.disk")/*+"/"+diskId*/,
                isForce: false,
                type: "get",
                useLocal:true,
                success: function (resp) {
                    var tenantId = diskId.tenant.id,
                        userId = diskId.user.id;
                    var data = {tenant_id:tenantId, user_id:userId};
                    if(host){data.host=host;}
                    ef.getJSON({
                        url: api.getAPI("hostList"),
                        isForce: true,
                        type: "get",
                        data:data,
                        success: function (response) {
                            $(id).find(".loading").hide();
                            $(response).each(function (i,il) {
                                il.ip = cal_host.getRealIp(il);
                            });
                            $(id).find(".context_table").datagrid(
                                {
                                    rowStyler: function(index,row){
                                        if (row.state!="active"&&row.state!="stopped"&&row.state!="error"){
                                            return 'background-color:#f7f1e7';
                                        }
                                    },
                                    singleSelect:true,
                                    pagination:false,
                                    columns:[[
                                        {field:"name" , width:"20%",title:ef.util.getLocale('host.hostdetail.blocklistlabel.description.data_disk.tooltip')},
                                        {field:"displayname", width:"25%",title:ef.util.getLocale('setting.userdetail.datagrid.name')},
                                        {field:"ip" , width:"35%",title:ef.util.getLocale('setting.userdetail.datagrid.ip')},
                                        {field:"state" , width:"35%",title:ef.util.getLocale('setting.userdetail.datagrid.status'),formatter: function (val,row,index) {
                                            var $dom = $('<span class="status_icon_box"><i></i><span></span></span>');
                                            var icon = $dom.find("i");
                                            var text = $dom.find("span");
                                            var style=cal_host.getStyleByStatus(val);
                                            if(val=="stopped"||val=="active"||val=="error"){
                                                icon.addClass(style.icon);
                                                text.text(style.text);
                                                return $dom[0].outerHTML;
                                            }
                                        }}]],
                                    data:response,
                                    loadFilter:function(data)
                                    {
                                        return ef.util.search(data,{
                                            filterFunction:function(item)
                                            {
                                                return item.state=="active"||item.state=="stopped";
                                            }
                                        });
                                    },
                                    onCheck: function (rowIndex,rowData) {
                                        $(".menu-content").hide();
                                        $(".menu-shadow").hide();
                                        ef.getJSON({
                                            //url: api.getAPI("cal.disk") + "/server/attach",
                                            url:api.getAPI("cal.disk.mount"),
                                            isForce: true,
                                            type: "post",
                                            data:{
                                                "volume_id": diskId.id,
                                                "vm_id": rowData.id
                                            },
                                            success: function (response) {
                                                if(rowData.state=="active"||rowData.state=="stopped"){
                                                    ef.placard.doing(ef.util.getLocale("cal.disk.bridge.success.doing"));
                                                    implement.diskRef(false);
                                                }
                                            },
                                            error: function (error) {
                                                console.log(error)
                                            }
                                        });
                                    }
                                });
                        },
                        error: function (error) {
                            console.log(error);
                        }
                    });
                },
                error: function (error) {
                    console.log(error);
                }
            });
        }
    };
    implement.redraw=function()
    {
        domReady(function()
        {
            var _iconMenu = $("#js-menus-wrapper").iconmenu([
                {
                    iconClass:"icon-menus-create-bat",
                    tip:ef.util.getLocale('cal.disk.iconmenu.add'),//"添加",
                    click:function()
                    {
                        //sta();
                        _self.addDisk();
                    }
                },
                {
                    iconClass: "icon-menus-icon-edit",
                    tip: ef.util.getLocale("global.button.edit.label"),//编辑
                    id:"2",
                    click: function () {
                        sta();
                        new  ef.Dialog('editdisk',{
                            title: ef.util.getLocale('cal.disk.editdisk'),
                            width:683,
                            height:313,
                            closed: false,
                            cache: false,
                            nobody:false,
                            href: 'views/disk.editdisk.html',
                            modal: true,
                            onResize:
                                function(){
                                    $(this).dialog("center");
                                },
                            onLoad:function()
                            {
                                require(['cal.disk.editdisk'], function (editdisk) {
                                    editdisk.redraw();
                                })
                            },
                            onClose:function()
                            {
                                require.undef('cal.disk.editdisk');
                                $('#gridtable').datagrid('unselectAll');
                                $("#username").textbox('clear');
                                $("#project").combobox('clear');
                                $("#status").combobox('clear');
                            }
                        });

                    }
                },
                {
                    iconClass:"icon-menus-icon-backup",
                    tip:ef.util.getLocale('framework.component.nav.cal.backup.label'),//"备份",
                    id:"3",
                    click:function(){
                        sta();
                        new  ef.Dialog('backupdisk',{
                            title: ef.util.getLocale('cal.disk.iconmenu.backup'),//'备份',
                            width:683,
                            height:313,
                            closed: false,
                            cache: false,
                            nobody:false,
                            href: 'views/disk.backup.html',
                            modal: true,
                            onResize:
                                function(){
                                    $(this).dialog("center");
                                },
                            onClose:function()
                            {
                                require.undef('cal.disk.backup');
                                $('#gridtable').datagrid('unselectAll');
                            },
                            onLoad:function()
                            {
                                require(['cal.disk.backup'], function (backup) {
                                    backup.redraw();
                                })
                            }
                        });
                    }
                },
                {
                    iconClass: "icon-menus-icon-setting_mgr",
                    tip: ef.util.getLocale('host.iconmenu.backupmngr.tip'),//"备份管理",
                    id:"5",
                    click:function () {
                        //implement.diskRef();
                        var row =  $("#gridtable").datagrid('getChecked');
                        var DiskID,DiskName;
                        $(row).each(function (i,il) {
                            DiskID = il.id;
                            DiskName = il.name;
                        });
                        var _row=ef.util.escapeJSON(JSON.stringify({id:DiskID,type:2,name:DiskName}));
                        ef.nav.goto("backupDetail.html", "cal.backupDetail",_row,null,"cal.backup");
                    }
                },
                {
                    iconClass: "icon-menus-icon-delete",
                    tip:ef.util.getLocale('cal.disk.iconmenu.delete'),//"删除",
                    id:"4",
                    click: function () {
                        var griddata = $("#gridtable").datagrid('getChecked');
                        var diskid,diskName;
                        $(griddata).each(function (i,il) {
                            diskid = il.id;
                            diskName = il.name;
                        });
                        ef.messager.confirm('deleting', ef.util.getLocale('cal.disk.messagerhi.confirmdisk')+"'"+diskName+"'"+'?'+'<div style="color: red;font-size: 12px;">'+ef.util.getLocale('cal.disk.delete')+'</div>',null, function (ok) {//是否删除云硬盘  所有相关备份同时删除
                            if (ok) {
                                ef.getJSON({
                                    url:api.getAPI("cal.disk")+"/"+diskid,
                                    type:"delete",//get,post,put,delete
                                    isForce:true,
                                    success:function(response) {
                                        ef.placard.doing(ef.util.getLocale("cal.disk.deleting.success.doing"));
                                        ef.nav.reload();
                                    }
                                });
                                sta();
                            }
                            else{$('#gridtable').datagrid('unselectAll');sta();}
                        });
                    }
                },
                {
                    iconClass: "icon-menus-icon-allotUser",
                    tip: ef.util.getLocale('cal.disk.iconmenu.user'),//"分配用户",
                    id:"6",
                    click:function () {
                        sta();
                        var row =  $("#gridtable").datagrid('getChecked');
                        var tenantId,diskId;
                        console.log(row);
                        $(row).each(function (i,il) {
                            tenantId = il.tenant.id;
                            diskId = il.id;
                        });
                        ef.localStorage.put("diskUserTenantId",tenantId);
                        ef.localStorage.put("diskId",diskId);
                        new  ef.Dialog('userdisk',{
                            title: ef.util.getLocale('cal.disk.iconmenu.user'),//'分配用户',
                            width:785,
                            height:585,
                            closed: false,
                            cache: false,
                            nobody:false,
                            href: 'views/disk.user.html',
                            modal: true,
                            onResize:
                                function(){
                                    $(this).dialog("center");
                                },
                            onClose:function()
                            {
                                require.undef('cal.disk.user');
                                $('#gridtable').datagrid('unselectAll');
                            },
                            onLoad:function()
                            {
                                require(['cal.disk.user'], function (backup) {
                                    backup.redraw();
                                })
                            }
                        });

                    }
                }
            ]);
            implement.init();
            implement.combo();
            implement.table();
            function sta(){
                _iconMenu.setStatus(2,true);
                _iconMenu.setStatus(3,true);
                _iconMenu.setStatus(4,true);
                _iconMenu.setStatus(5,true);
                _iconMenu.setStatus(6,true);
            }
            implement.diskRef(true, function () {
                sta();
            });
            $("#reset").click(function () {
                $("#username").textbox('clear');
                $("#project").combobox('clear');
                $("#status").combobox('clear');
                implement.diskRef(false);

            });
            var _self=implement;
            sta();
            $("#gridtable").datagrid({
                onCheck: function (rowIndex,rowData) {
                    if(rowData.status!='deleting'){
                        _iconMenu.setStatus(2,false);
                        _iconMenu.setStatus(5,false);
                    }
                    if(rowData.status=="available"){
                        _iconMenu.setStatus(3,false);
                    }else{_iconMenu.setStatus(3,true);}
                    if(rowData.attachments.length==0&&rowData.status!='deleting'){
                        _iconMenu.setStatus(4, false);
                        _iconMenu.setStatus(6,false);
                    }
                    else if(rowData.status=="in-use"){
                        _iconMenu.setStatus(4,true);
                        _iconMenu.setStatus(5,false);
                        _iconMenu.setStatus(6,true);
                    }
                    var doingState = ['attaching','snapshoting','deleting','creating','recovering'];
                    if(_.contains(doingState, $.trim(rowData.status))){
                        sta();
                        _iconMenu.setStatus(5,false);
                    }
                }
            });
            $("#gridtable").datagrid("autoData");
            $("#gridtable").datagrid('loading');
        });
    };
    implement.destroy=function()
    {
        $(window).off("resize.cal.host");
        implement.socket && implement.socket.close();
        require.undef(module.id);
    };
    return implement;
});