/**
 * Created by wangahui1 on 15/11/6.
 */
define(["easyui","clientPaging","role","module","user","api","domReady","resize"],function(easyui,clientPaging,role,module,user,api,domReady)
{
   var tableGird = null;
    var implement=new ef.Interface.implement();
    implement.isForce=true;
    implement.doingStates=["building","powering-on","powering-off","rebooting","backuping","recovering","deleting","migrating","uploading","preparation","wait_create","wait_boot","wait_reboot"];
    var projectTmp=null;
    /**获取真实ip*/
    implement.getRealIp=function(data)
    {
        var result="";
        if(data.network)
        {
            for(var i in data.network)
            {
                $(data.network[""+i+""]).each(function (e,el) {
                    result+=(el+',')
                });
            }
        }
        result = result.substring(0,result.lastIndexOf(','));
        return result;
    };
    /**获取云主机列表*/
    implement.getHostList=function(isForce,callback)
    {
        ef.getJSON({
            url:api.getAPI("hostList"),
            type:"get",//get,post,put,delete
            useLocal:false,
            success:function(response){
                $(response).each(function (i,il) {
                    il.ip =implement.getRealIp(il);
                    il.username = il.user.displayname;
                    il.tenantname = (il.tenant&&il.tenant.name)?il.tenant.name:"";
                    il.hypervisor = il.host?il.host.name:"";
                });
                if(callback)
                {
                    callback(response);
                }
            },
            error:function(error)
            {
                console.log(error);
            }
        });
    };
    implement.hostWebSocket = function () {
        var dataRows = $("#dg").datagrid('getData').originalRows;
        if(!implement.socket){
            implement.socket=new ef.server.Socket(api.getAPI('cal.host.list.socket',true),"cal.host.list.socket");
        }
        implement.socket.onmessage = function(data){
            var useData = JSON.parse(data.data);
            if(useData.response=="refresh"){
                implement.hostref(false);
                return;
            }
            $(dataRows).each(function (i,il) {
                for(var e in useData.response){
                    if(il.name==e){
                        il.id = useData.response[e].id;
                        il.state = useData.response[e].state;
                    }
                }
            });
            var num=$("#dg").datagrid("options").pageNumber;
            $("#dg").datagrid('loadData',dataRows).datagrid('goto',num);
        };
    };
    implement.state=
    {

        active:"active",//运行
        stop:"stopped",//停止
        error:"error",//异常,
        creating:"building",//创建中
        poweron:"powering-on",//开机中
        poweroff:"powering-off",//关机中
        rebooting:"rebooting",//重启中
        snapshoting:"snapshoting",//快照中
        recovering:"recovering",//恢复中
        deleting:"deleting",//删除中
        migrating:"migrating",//迁移中
        uploading:"uploading",//上传镜像中
        preparation:"preparation",//准备中
        wait_create:"wait_create",//等待创建
        wait_boot:"wait_boot",//等待启动
        wait_reboot:"wait_reboot"//等待重启
    };
    implement.Style=function()
    {
        this.icon="";
        this.text="";
        this.color="";
        this.status="";
    };
    /**根据状态获取样式对象*/
    implement.getStyleByStatus=function(state)
    {
        var style=new this.Style();
        state=state||"unknow";
        style.text=ef.util.getLocale("host.list.status."+state+".tip");
        switch(state)
        {
            case implement.state.active://运行
            {
                style.icon="icon-status-done-success";
                style.color="status_play_color";
                break;
            }
            case implement.state.stop://停止
            {
                style.icon="icon-status-done-fail";
                style.color="status_stop_color";
                break;
            }
            case implement.state.error://异常
            {
                style.icon="icon-status-done-error";
                style.color="status_stop_color";
                break;
            }
            case this.state.creating://创建中
            {
                style.icon="icon-status-doing";
                style.color="status_exec_color";
                break;
            }
            case implement.state.poweron://开机中
            {
                style.icon="icon-status-vm-doing";
                style.color="status_exec_color";
                break;
            }

            case implement.state.poweroff://关机中
            {
                style.icon="icon-status-vm-doing";
                style.color="status_exec_color";
                break;
            }

            case implement.state.rebooting://重启中
            {
                style.icon="icon-status-vm-doing";
                style.color="status_exec_color";
                break;
            }
            case implement.state.snapshoting://快照中
            {
                style.icon="icon-status-doing";
                style.color="status_exec_color";
                break;
            }
            case implement.state.recovering://恢复中.
            {
                style.icon="icon-status-doing";
                style.color="status_exec_color";
                break;
            }
            case implement.state.deleting://删除中
            {
                style.icon="icon-status-fail";
                style.color="status_exec_color";
                break;
            }

            case implement.state.migrating://迁移中
            {
                style.icon="icon-status-image";
                style.color="status_exec_color";
                break;
            }
            case implement.state.uploading://上传镜像中.
            {
                style.icon="icon-status-image";
                style.color="status_exec_color";
                break;
            }
            case implement.state.preparation://准备中.
            {
                style.icon="icon-status-doing";
                style.color="status_exec_color";
                break;
            }
            case implement.state.wait_create://等待创建.
            {
                style.icon="icon-status-doing";
                style.color="status_exec_color";
                break;
            }
            case implement.state.wait_boot://等待启动.
            {
                style.icon="icon-status-doing";
                style.color="status_exec_color";
                break;
            }
            case implement.state.wait_reboot://等待重启.
            {
                style.icon="icon-status-doing";
                style.color="status_exec_color";
                break;
            }
            case "unknow":
            {
                style.icon="icon-status-done-fail";
                style.color="status_stop_color";
                break;
            }

        }
        return style;
    };

    implement.hostref = function (isFrist,callback) {
        this.getHostList(implement.isForce,function(result)
        {
            if(isFrist)
            {
                tableGird.datagrid({data:result}).datagrid("clientPaging",{onPage: function (num,size) {
                    implement.setStatu(implement._iconMenu);
                    if(callback){
                        callback();
                    }
                },onBeforePage: function (num,size,data) {
                    implement.pageData = data;
                }});
                tableGird.datagrid("autoData");
                implement.hostWebSocket();
            }else {
                tableGird.datagrid({
                    data: result
                }).datagrid('clientPaging');
                implement.hostWebSocket();
               /* tableGird.datagrid("loadData",result).datagrid("goto",1);*/
            }
            if(callback){
                callback();
            }
        });
    };

    //action支持：开机、关机、重启
    implement.Action= function (ids,action,callback,errorCallback,isReload) {
        //console.log(ids);
        ef.getJSON({
            url: api.getAPI("cal.host.getHostlist")+"/control",
            type: "post",//get,post,put,delete
            data:{
                "ids":ids,
                "action":action
            },
            isForce: true,
            success: function (response) {
                if(callback)
                {
                    callback(response);
                }
                if(!isReload){implement.hostref(false)};

                //if(isReload)
                //{
                //    ef.nav.reload();
                //}
            },
            error: function (error) {
                console.log(error);
                if(errorCallback)
                {
                    errorCallback(error);
                }
            }
        });
    };
    implement.operate=function(action,callback,errorCallback)
    {
        var dg= ef.util.getTablePageData($('#dg'),implement.pageData);
        var ids=[];
        $(dg).each(function(i,el)
        {
            if(action=="shutdown"&&!el.keepalive){
                if(el.state == 'active'){
                    ids.push(el.id);
                }
            }else if(action=="start"/*&&!el.keepalive*/){
                if(el.state == 'stopped'){
                    ids.push(el.id);
                }
            }else if(action=="reboot"&&!el.keepalive){
                if(el.state == 'active'){
                    ids.push(el.id);
                }
            }
            //if(action!="shutdown"){
            //    ids.push(el.id);
            //    //implement.Action(el.id,action,callback,errorCallback);
            //}
            tableGird.datagrid("uncheckAll");
        });
        if(ids && ids.length){
            implement.Action(ids,action,callback,errorCallback);
        }
    };
    implement.addListener=function()
    {
        ef.event.on("cal.allotuser.event",function(event,data)
        {
            ef.Dialog.close("hostAllotUserDialog");
            ef.loading.hide();
            console.log(data);
            var userId=data.id;
            var vmId=tableGird.datagrid('getChecked');
            for(var i= 0,vm_user=[];i<vmId.length;i++){
                vm_user.push({
                    "user_id":userId,
                    "vm_id":vmId[i].id
                });
            }
            ef.getJSON({
                url:api.getAPI("cal.host.allotuser"),
                type:"post",
                data:{
                    "vm-user": vm_user
                },
                success: function (response) {
                    ef.Dialog.closeAll();
                    ef.loading.hide();
                    ef.nav.reload();
                    ef.placard.tick(ef.util.getLocale("cal.host.hostuser.placard"));
                    $("#username").textbox('clear');
                    $("#project").combobox('clear');
                    $("#status").combobox('clear');
                },
                error: function (error) {
                    console.log(error);
                    ef.loading.hide();
                }
            })
        });
    };
    implement.removeListener=function()
    {
        ef.event.off("cal.allotuser.event");
    };
    //新建云主机
    implement.addHost=function()
    {
        require.undef('modules/cal/cal.host.addHost');
        require(["modules/cal/cal.host.addHost"],function(addHoster)
        {
            new ef.Dialog("addHostDialog",{
                title: ef.util.getLocale("host.addhost.dialog.title"),
                width:750,
                height:535,
                closed: false,
                cache: false,
                nobody:false,
                border:false,
                href: 'views/addHost.html',
                modal: true,
                expandWidth:410,
                isExpand:true,
                onResize:
                    function(){
                        $(this).dialog("vcenter");//垂直居中窗口
                    },
                onClose:function()
                {
                    addHoster.destroy();
                    way.clear("resultData");
                },
                onLoad:function()
                {
                    addHoster.redraw();//刷新屏幕
                    $(".drawer_btn").click(function()
                    {
                        var dialog=ef.Dialog.getDialog("addHostDialog");
                        if(dialog)
                        {
                            dialog.toggle();
                            var expand=dialog.isExpand;
                            expand?$("#resultBox").show():$("#resultBox").hide();
                        }

                    })
                }
            });
        });
    };
    implement.isSameProject=function()
    {
        var arrs = [];
        if($('#dg').length){
            arrs=ef.util.getTablePageData($('#dg'),implement.pageData);
        }
        if(arrs.length!=0){
            var isSample=ef.util.every(arrs,function(item)
            {
                if(!item.tenant||!arrs[0].tenant){return false}
                return item.tenant.id==arrs[0].tenant.id;
            });
            if(isSample&&!this.isDoingState(arrs))
            {
                return arrs[0].tenant.id;
            }
            return false;
        }

    };
    implement.setStatu= function (_iconMenu) {
            implement.status();
            var a = [];
            if($('#dg').length){
                implement.host = ef.util.getTablePageData($('#dg'),implement.pageData);
                for(var i=0;i<implement.host.length;i++){
                    a.push(implement.host[i].state);
                }
            }
            var choose = $.inArray('stopped',a)==-1;//在数组a中找到1
            var cho = $.inArray('active',a)==-1;
            var noError= $.inArray("error",a)==-1;
            if(!choose&&!cho){
                _iconMenu.setStatus("1", false);
                _iconMenu.setStatus("2", false);
                _iconMenu.setStatus("3", false);
            }
            if(choose){
                _iconMenu.setStatus("1", true);//设置1的图标显示
                _iconMenu.setStatus("2", false);//图标隐藏
                _iconMenu.setStatus("3", false);
            }
            if(cho){
                _iconMenu.setStatus("1", false);
                _iconMenu.setStatus("2", true);
                _iconMenu.setStatus("3", true);
            }
            if(cho&&choose){
                _iconMenu.setStatus("1", true);
                _iconMenu.setStatus("2", true);
                _iconMenu.setStatus("3", true);
            }
            projectTmp=this.isSameProject();
            if(projectTmp)
            {
                _iconMenu.setStatus("5", false);

            }else
            {
                _iconMenu.setStatus("5", true);
            }
            if(!noError)
            {
                _iconMenu.setStatus("1", false);
                _iconMenu.setStatus("2", false);
                _iconMenu.setStatus("3", false);
                _iconMenu.setStatus("5", true);
            }

    };
    implement.getCheckStatus=function(datagd,status)
    {
        var _bool=true;
        $(datagd).each(function(i,el)
        {
            if(el.status==status)
            {
                _bool=false;
            }
        });
        return _bool;
    };
    implement.isDoingState=function(arrs)
    {
        var bool=false;
        _.each(arrs,function(item)
        {
            var checking=ef.util.find(implement.doingStates,function(itm)
            {
                return item.state==itm;
            });
            if(checking)
            {
                bool=true;
            }
        });
        return bool;
    };
    implement.filter = function () {
        var opt = $("#username").textbox('getValue').toLowerCase();
        var tenant = $("#project").combobox('getValue');
        var state = $("#status").combobox('getValue');
        tenant=tenant=="全部"?"":tenant;
        state=state=="all"?"":state;
        tableGird.datagrid({
            loadFilter:function(data)
            {
                return ef.util.search(data,{filterFunction:function(item)
                    {
                        if(opt)
                        {
                            return ((item.name&&item.name.toLowerCase().indexOf(opt)!=-1)||(item.displayname&&item.displayname.toLowerCase().indexOf(opt)!=-1)||(item.ip&&item.ip.toLowerCase().indexOf(opt)!=-1)||(item.user&&item.user.display_name&&String(item.user.display_name).toLowerCase().indexOf(opt)!=-1));
                        }else
                        {
                            return true;
                        }
                    }},
                    {
                        key:"tenantname",
                        value:tenant
                    },
                    {
                      filterFunction:function(item)
                      {
                          if(state)
                          {
                              if(state=="other")
                              {
                                  var _states=["building","powering-on","powering-off","rebooting","backuping","recovering","deleting","migrating","uploading","preparation","wait_create","wait_boot","wait_reboot"];
                                  return ef.util.find(_states,function(itm)
                                  {
                                      return item.state==itm;
                                  })
                              }else
                              {
                                  return item.state==state;
                              }
                          }else
                          {
                              return true;
                          }
                      }
                    }
                )
            }
        }).datagrid('clientPaging').datagrid("goto",1);
    };
    implement.initTable = function (callback) {
        tableGird = $("#dg").datagrid({
            singleSelect:false,
            remoteSort:false,
            multiSort:false,
            autoHeight:true,
            pageSize:10,
            columns:[[
                {field:'ck',checkbox:true},
                {field:"name", width:"13%",title:ef.util.getLocale('host.datagrid.ID'),formatter:function(val,row,index)//id
                {
                    if(!row.id||row.state=="building"||row.state=="preparation"||row.state=="wait_create")
                    {
                        return val;
                    }
                    return '<a onclick="ef.nav.goto(\'hostDetail.html\',\'cal.host.hostDetail\',\''+row.id+'\',null,\'cal.host\')" class="table-link">'+val+'</a>';
                }},
                {field:"displayname" ,width:"13%",title:ef.util.getLocale('host.comboxtoinput.name'),formatter:function(val,row){
                    return val?val:"-"
                }},//名称
                {field:"ip", width:"13%",title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.ipfield'),formatter:function(val,row)
                {
                    var temp = val ? val : '-';
                    var $a = $('<a href="javascript:void(0)" style="text-decoration: none;color:#000;"></a>');
                    $a.text(temp);
                    if(temp === '-'){
                        return $a;
                    }
                    var tempArray = String(temp).split(','),
                        html = '',len = tempArray.length;
                    _.each(tempArray,function(item,key){
                        if(key == len-1){
                            html +=('<div>'+item+'</div>');
                        }else{
                            html += ('<div>'+item+'</div></br>');
                        }
                    });
                    $a.hover(
                        function(e){
                            $a.tooltip({
                                content:html
                            });
                            $(this).tooltip('show');
                        },
                        function(e){
                            $(this).tooltip('destroy');
                        }
                    );

                    return $a;
                }},//ip
                {field:"cores", width:"13%",title:ef.util.getLocale('order.ready.info.grid.head.quota'),formatter:function(val,row)
                {
                    if(val&&row.memory_mb){
                        return val+"核"+ef.util.mb2gb(row.memory_mb)+"GB"
                    }else{
                        return "-"
                    }
                }},
                {field:"username", width:"13%" ,title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.userfield'),formatter: function (val,row) {
                    var $dom=$('<div></div>');
                    val=row.user?(row.user.display_name||"-"):"-";
                    $dom.text(val);
                    $dom.attr({title:row.user.name});
                    return $dom;
                }},//用户
                {field:"tenant", width:"13%",title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.tenantfield'),formatter:function(val,row)
                {
                    return row.tenant?row.tenant.name:"-";
                }},//项目
                {field:"state", width:"13%",title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.atatusfield'),formatter:function(val,row,index)//状态
                {
                    var $dom = $('<span class="status_icon_box"><i></i><span></span></span>');
                    var icon = $dom.find("i");
                    var text = $dom.find("span");
                    var style=implement.getStyleByStatus(val);
                    icon.addClass(style.icon);
                    text.text(style.text);
                    return $dom[0].outerHTML;
                }},
                {field:"hypervisor", width:"13%",title:ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.hypervisorfield'),formatter:function(val,row)
                {
                    return val||"-";
                }}//宿主机
            ]]
        });
        implement.hostref(true,callback);
        if(user.isSec()||user.isAudit()) {
            tableGird.datagrid('hideColumn', 'ck')
            tableGird.datagrid('hideColumn', 'ck')

        }else {
            tableGird.datagrid('showColumn', 'ck')
        }
    };
    implement.autoHeight=function(EventName,datagridDOM,dgParent,DOMArry){
        var WH = window.innerHeight;
        var DH =83;
        $(DOMArry).each(function(il,i){
            DH+=(parseInt($(il).height())+parseInt($(il).css("marginTop"))+parseInt($(il).css("marginBottom"))+parseInt($(il).css("paddingTop"))+parseInt($(il).css("paddingBottom")))
        })
        var ht=WH-DH;
        ht=ht>450?ht:450;
        $(dgParent)[0].style.height=ht+"px";
        var num =  Math.floor(parseInt((ht-36-31)/36));
        $(datagridDOM).datagrid("getPager").pagination({pageSize:num});
        var pnum=$(datagridDOM).datagrid("options").pageNumber;
        $(datagridDOM).datagrid("goto",pnum);
        $(window).on(EventName,function(){
            var WH = window.innerHeight;
            var DH =83;
            $(DOM).each(function(il,i){
                DH+=(parseInt($(il).height())+parseInt($(il).css("marginTop"))+parseInt($(il).css("marginBottom"))+parseInt($(il).css("paddingTop"))+parseInt($(il).css("paddingBottom")))
            })
            var ht=WH-DH;
            if($(dgParent)[0]){
                ht=ht>450?ht:450;
                $(dgParent)[0].style.height=ht+"px";
                var num =  Math.floor(parseInt((ht-36-31)/36));
                $(datagridDOM).datagrid("getPager").pagination({pageSize:num});
                var pnum=$(datagridDOM).datagrid("options").pageNumber;
                $(datagridDOM).datagrid("goto",pnum);
            }
        });
    };
    implement.init = function () {
        var nameIp=ef.util.getLocale("host.comboxtoinput.nameip");
        var project=ef.util.getLocale("host.comboxtoinput.project");
        var status=ef.util.getLocale("host.comboxtoinput.status");
        $("#username").textbox({
            prompt: nameIp,
            iconCls: 'icon-search',
            iconAlign: 'left',
            onChange: function (newValue,oldValue) {
                implement.filter();
            }
        });
        ef.getJSON({
            url: api.getAPI("setting.project.datagrid_tenants"),
            type: "get",//get,post,put,delete
            success:function(response) {
                var result = [];
                //response=ef.util.sort("name",response);
                $(response).each(function (i, il) {
                    if (il.name == "admin" || il.name == "services") {
                        return;
                    }
                    result.push(il);
                });
                result.unshift({"name":"全部"});
                $("#project").combobox({
                    prompt:project,
                    data:result,
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
        ef.getJSON({
            url:api.getAPI("cal.host.combobox.status"),
            type:"get",//get,post,put,delete
            useLocal:true,
            success:function(response) {
                $(response).each(function(i,item)
                {
                    item.label=ef.util.getLocale("host.list.status."+item.value+".tip");
                });
                $("#status").combobox({
                    prompt:status,
                    data:response,
                    valueField:'value',
                    textField:'label',
                    editable:false,
                    onChange: function (newValue,oldValue) {
                        implement.filter();
                    }
                });
            }
        });
    };
    implement.redraw=function()
    {
        domReady(function()
        {
            // implement.autoHeight();
            implement.init();
            //重置按钮
            $("#reset").click(function () {
                $("#username").textbox('clear');
                $("#project").combobox('clear');
                $("#status").combobox('clear');
                implement.hostref(false);
            });
            var _self=this;
            //系统管理员||超级管理员
            if(user.isSys()||user.isTenant()||user.isSuper()){
                $(".icon-menus-box").show();
            }
            else{
                $(".icon-menus-box").hide();
                $("#content").removeClass('search-item padding_top60');
                $("#content").addClass('search-item');
                $(".search-item").addClass("padding_top25");
            }
            implement._iconMenu = $("#js-menus-wrapper").iconmenu([
                {
                    iconClass:"icon-menus-create-bat",
                    tip:ef.util.getLocale('host.iconmenu.new.tip'),//"新建"
                    "access":[6,7,8,88],
                    click:function(menu)
                    {
                        implement.addHost();
                    }
                },
                {
                    iconClass:"icon-menus-icon-run",
                    id:"1",
                    tip:ef.util.getLocale('host.iconmenu.poweron.tip'),//开机
                    "access":[6,7,8,88],
                    "disable":true,
                    click:function()
                    {
                        implement.operate("start");
                        $("#username").textbox('clear');
                        $("#project").combobox('clear');
                        $("#status").combobox('clear');
                    }
                },

                {
                    iconClass:"icon-menus-icon-restart",
                    id:"3",
                    tip:ef.util.getLocale('global.button.reopen.label'),//"重启",
                    "access":[6,7,8,88],
                    "disable":true,
                    click:function()
                    {
                        var dg=tableGird.datagrid('getChecked');
                        var gd_id=[];
                        $(dg).each(function (i,il) {
                                gd_id.push(il.name);
                        });
                        if(gd_id.length>1){
                            ef.messager.confirm('reminding',ef.util.getLocale('host.iconmenu.shutdown.select.message.confirmokall')+'?',null,function(ok)//是否重启已选主机
                            {

                                if(ok)
                                {
                                    implement.operate("reboot");
                                    $("#username").textbox('clear');
                                    $("#project").combobox('clear');
                                    $("#status").combobox('clear');

                                }else
                                {
                                    tableGird.datagrid("uncheckAll");
                                }
                            });
                        }
                        else{
                            ef.messager.confirm('reminding',ef.util.getLocale('host.iconmenu.shutdown.select.message.confirmok')+"'"+gd_id+"'"+'?',null,function(ok)//是否重启云主机
                            {
                                if(ok)
                                {
                                    implement.operate("reboot");
                                    $("#username").textbox('clear');
                                    $("#project").combobox('clear');
                                    $("#status").combobox('clear');

                                }else
                                {
                                    tableGird.datagrid("uncheckAll");
                                }
                            });
                        }

                    }
                },
                {
                    iconClass:"icon-menus-icon-shutdown",
                    id:"2",
                    tip:ef.util.getLocale('host.iconmenu.shutdown.tip'),//"关机",
                    "access":[6,7,8,88],
                    "disable":true,
                    click:function()
                    {
                        var dg=tableGird.datagrid('getChecked');
                        var gd_id=[];
                        $(dg).each(function (i,il) {
                            gd_id.push(il.name);
                        });
                        if(gd_id.length>1){
                           ef.messager.confirm('reminding',ef.util.getLocale('host.iconmenu.shutdown.select.message.confirmcloseall')+'？',null,function(ok){//是否关闭已选主机
                                if(ok)
                                {
                                    implement.operate("shutdown");
                                    $("#username").textbox('clear');
                                    $("#project").combobox('clear');
                                    $("#status").combobox('clear');

                                }else
                                {
                                    tableGird.datagrid("uncheckAll");
                                }
                            });
                        }
                        else{
                            ef.messager.confirm('reminding',ef.util.getLocale('host.iconmenu.shutdown.select.message.confirmclose')+"'"+gd_id+"'"+'？',null,function(ok)//是否关闭主机
                            {
                                if(ok)
                                {
                                    implement.operate("shutdown");
                                    $("#username").textbox('clear');
                                    $("#project").combobox('clear');
                                    $("#status").combobox('clear');
                                }else
                                {
                                    tableGird.datagrid("uncheckAll");
                                }
                            });
                        }

                    }
                },
                {
                    iconClass:"icon-menus-icon-allotUser",
                    id:"5",
                    tip:ef.util.getLocale('cal.host.allot.label'),//"分配用户",
                    "access":[6,7,8,88],
                    "disable":true,
                    click:function()
                    {
                        new  ef.Dialog('hostAllotUserDialog',{
                            title: ef.util.getLocale('cal.disk.iconmenu.user'),//'分配用户',
                            width:783,
                            height:584,
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
                                implement.removeListener();
                            },
                            onLoad:function()
                            {
                                implement.addListener();
                                require(['cal.disk.user'], function (backup) {
                                    backup.redraw(true,projectTmp);
                                })
                            }
                        });

                    }
                }
            ]);
            ////按钮状态设置
            implement. status=function() {
                implement._iconMenu.setStatus("1", true);
                implement._iconMenu.setStatus("2", true);
                implement._iconMenu.setStatus("3", true);
                implement._iconMenu.setStatus("5", true);
            }
            implement.initTable(function () {
            });
            function keepaliveStatus(){
                var c = [],d = [];
                $(tableGird.datagrid('getChecked')).each(function (i,il) {
                    //if(il.state=="active"){
                    c.push(Number(Boolean(il.keepalive)));
                    //}
                });
                var m = $.inArray(0,c)==-1;
                if(m){implement._iconMenu.setStatus("2", true);implement._iconMenu.setStatus("3", true);}
            }
            function err(){
                var c = [],d = [];
                $(tableGird.datagrid('getChecked')).each(function (i,il) {
                    if(il.state=="error"){
                        c.push(il.state);
                    }
                });
                var m = $.inArray("error",c)==-1;
                if(!m){implement._iconMenu.setStatus("1", false);}
            }
            var datacheck;
            try
            {
                datacheck=tableGird.datagrid('getChecked');
                if(datacheck.length==0){
                    implement.status();
                }
            }catch(err)
            {

            }

            tableGird.datagrid({
                onCheck: function (rowIndex, rowData) {
                    implement.setStatu(implement._iconMenu);
                    keepaliveStatus();
                    err();
                },
                onCheckAll: function () {
                    implement.setStatu(implement._iconMenu);
                },
                onUncheckAll: function () {
                    implement.status();
                },
                onUncheck: function (Index, Data) {
                    if(tableGird.datagrid('getChecked').length==0){
                        implement.status();
                        return;
                    }
                    implement.setStatu(implement._iconMenu);
                    keepaliveStatus();
                    err();
                }
            });
            //获取json数据
            tableGird.datagrid('loading');
            // implement.autoHeight("resize.cal.host","#dg",".tablebox",["#content"]);

        });
        $(".right-entity").resize(function()
        {
            console.log("resize:right-entity");
        });
    };
    implement.destroy=function()
    {
        $(window).off("resize.cal.host");
        require.undef(module.id);
    };
    return implement;
});