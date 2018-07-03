/**
 * Created by wangahui1 on 15/11/9.
 */
define(["easyui", "clientPaging", "echart", "module", "user", "domReady", "api", "cal.host", "setting.userDetail", "setting.tenanteDetail", "cal.image","role","dashboard","warn.host","alarm","cal.backup"], function (eu, clientPaging, echarts, module, user, domReady, api, calHost, userDetail, tenantDetail, calImage,role,dashboard,host_warn,alarm,backup) {
    var implement = new ef.Interface.implement();
    implement.isForce = true;
    var _pageData,_iconMenu,switcher;
    ef.util.EchartsColor.clearColor(true);
    /**获取格式化后日期*/
    implement.alarm = function (target) {//初始化某个云主机告警列表
        $("#host_alarmList").datagrid({
            pagination:true,
            pageSize:10,
            singleSelect:true,
            columns:[[
                {field:'id',title:'ID',width:'10%',
                    formatter: function (val){
                        if(!val){
                            return '<span style="padding-left: 0px;">-</span>';
                        }
                        else{
                            return '<span style="padding-left: 0px;">'+val+'</span>';
                        }
                    }
                },
                {field:'target',title:ef.util.getLocale("alarm.host.table.target"),width:'21%',
                    formatter: function (val){
                        if(!val){
                            return '<span style="padding-left: 3px;">-</span>';
                        }
                        else{
                            return '<span style="padding-left: 3px;">'+val+'</span>';
                        }
                    }
                },
                //{field:'type',title:ef.util.getLocale("alarm.host.table.type"),width:'15%',formatter: function (val) {
                //    return alarm.getType(val).label;
                //}},
                //{field:'times',title:ef.util.getLocale("alarm.host.table.times"),width:'10%'},
                {field:'message',title:ef.util.getLocale("alarm.host.table.message"),width:'20%',formatter: function (val,row) {
                    if(row.message!=null){
                        return '<span style="padding-left: 4px;">'+ef.util.getLocale(val)+'</span>';
                    }else{
                        return '<span style="padding-left: 4px;">-</span>';
                    }

                }},
                {field:'level',title:ef.util.getLocale("alarm.host.table.level"),width:'18%',formatter: function (val) {
                    return '<span style="padding-left: 5px;">'+alarm.getLevel(val).label+'</span>';
                }},
                {field:'create_at',title:ef.util.getLocale("alarm.host.table.create_at"),width:'21%',formatter: function (val) {
                    return '<span style="padding-left: 5px;">'+ef.util.number2time(val,"Y-M-D h:m:s",true)+'</span>';
                }},
                //{field:'update_at',title:ef.util.getLocale("alarm.host.table.update_at"),width:'16%',formatter: function (val) {
                //    if(!val){
                //        return "-"
                //    }else{
                //        return ef.util.number2time(val,"Y-M-D h:m:s",true);
                //    }
                //}},
                {field:'operate',title:ef.util.getLocale("alarm.host.table.operate"),width:'15%',formatter: function (val,row) {
                    var dom = $("<a href='#' style='text-decoration: none;color: #4DA4D6; padding-left:7px;'>"+ef.util.getLocale("alarm.host.table.operate.value")+"</a>");
                    dom.click(function () {
                       ef.messager.confirm('deleting', ef.util.getLocale("alarm.delete.warning")+'？',null,function(ok){
                            if (ok) {
                                ef.loading.show();
                                ef.getJSON({
                                    url: api.getAPI("alarmAction") + "/" + row.id,
                                    type: "delete",
                                    useLocal: false,
                                    success: function () {
                                        ef.loading.hide();
                                        implement.alarmRef(target, true,0);
                                        ef.placard.tick(ef.util.getLocale("alarm.delete.success.placard"));
                                    }
                                })
                            }else{
                                $("#host_alarmList").datagrid("uncheckAll");
                            }
                        });
                    });
                    return dom;
                }}
            ]]
        });
    };
    implement.alarmElse = function () {//不能进行操作的云主机告警列表
        $("#host_alarmList").datagrid({
            pagination:false,
            singleSelect: true,
            columns:[[
                {field:'id',title:'ID',width:'15%',
                    formatter: function (val){
                       if(!val){
                           return '<span>-</span>';
                       }
                       else{
                           return '<span>'+val+'</span>';
                       }
                    }},
                {field:'target',title:ef.util.getLocale("alarm.host.table.target"),width:'15%'},
                //{field:'type',title:ef.util.getLocale("alarm.host.table.type"),width:'15%',formatter: function (val) {
                //    return alarm.getType(val).label;
                //}},
                {field:'message',title:ef.util.getLocale("alarm.host.table.message"),width:'25%',formatter: function (val,row) {
                    return ef.util.getLocale(val);
                }},
                {field:'level',title:ef.util.getLocale("alarm.host.table.level"),width:'15%',formatter: function (val) {
                    return alarm.getLevel(val).label;
                }},
                {field:'create_at',title:ef.util.getLocale("alarm.host.table.create_at"),width:'20%',formatter: function (val) {
                    return ef.util.number2time(val,"Y-M-D h:m:s",true);
                }}
            ]]
        });
    };
    implement.alarmRef = function (target,isFirst,startnumber) {
        //return;
        var arg=arguments,alarmname=arg[0];
        ef.getJSON({
            url:api.getAPI("alarmAction")+"/resource_detail",
            type:"get",
            useLocal:false,
            data:{
                target:target,
                start:startnumber,
                limit:10
            },
            success: function (response,allResult) {
                response=ef.util.sort("id",response);
                response  = response.reverse();
                if(isFirst){
                    $('#host_alarmList').datagrid({data:response}).datagrid("getPager").pagination(
                        {
                            showPageList:false,
                            showRefresh:false,
                            onSelectPage:function(pageNumber, pageSize)
                            {
                                var pagenumber = (pageNumber-1)*10;
                                arg.callee(alarmname,true,pagenumber);//调用alarmRef（）
                            }
                        }).pagination("refresh",{total:allResult.total,pageNumber:(startnumber/10)+1});
                }
                else{
                    $("#host_alarmList").datagrid("loadData",response);
                }
            }
        });
    };
    implement.getDetail=function() {
        var id=ef.localStorage.get("hostDetail_id");
        if(!id)return;
        var cover=$(".data_state").coverlayer({loadingHeight:30},{opaque:true});
        ef.getJSON(
            {
                url:api.getAPI("cal.host.getHostlist") + "/"+id,
                success:function(response)
                {
                    cover.hide();
                    var style=calHost.getStyleByStatus(response.state);
                    var dom=$(".data_state");
                    dom.empty();
                    var span=$("<span></span>");
                    span.addClass(style.color);
                    span.text(style.text);
                    dom.append(span);
                    implement.controlState(response);
                },error:function()
            {
                cover.hide();
            }
            });
    };
    implement.controlState=function(resp)
    {
        _pageData=resp;
        if (_pageData.state == "active") {
            //if(_pageData.systemdisk.type=="lvm"){
            //    _iconMenu.setStatus("9",false);
            //}else{
                _iconMenu.setStatus("9",false);
            //}
            _iconMenu.setStatus("8",true);
            _iconMenu.setStatus("1", true);
            _iconMenu.setStatus("2", false);
            _iconMenu.setStatus("3", false);
            _iconMenu.setStatus("5", false);
            _iconMenu.setStatus("4", true);
            _iconMenu.setStatus("11", true);
            _iconMenu.setStatus("7", true);
            _iconMenu.setStatus("10", false);
            _iconMenu.setStatus("6", false);
        }
        else if(_pageData.state == "error"){
            _iconMenu.setStatus("8",true);
            _iconMenu.setStatus("1", false);
            _iconMenu.setStatus("2", false);
            _iconMenu.setStatus("3", false);
            _iconMenu.setStatus("4", true);
            _iconMenu.setStatus("11", true);
            _iconMenu.setStatus("5", true);
            _iconMenu.setStatus("6", false);
            _iconMenu.setStatus("10", true);
            _iconMenu.setStatus("7", false);
        }
        else if (_pageData.state == "stopped") {
            //if(_pageData.systemdisk.type=="lvm"){
            //    _iconMenu.setStatus("9",false);
            //}else{
                _iconMenu.setStatus("9",false);
            //}
            implement.utils.setCpuMemDatas([]);
            implement.renderGuage({cpu_util:0});
            implement.renderGuage({memory_util:0});
                _iconMenu.setStatus("8",false);
            _iconMenu.setStatus("1", false);
            _iconMenu.setStatus("2", true);
            _iconMenu.setStatus("3", true);
            _iconMenu.setStatus("4", false);
            _iconMenu.setStatus("5", false);
            _iconMenu.setStatus("11", false);
            _iconMenu.setStatus("7", false);
            _iconMenu.setStatus("6", false);
            _iconMenu.setStatus("10", true);
        }
        else {
            _iconMenu.setStatus("7", true);
            _iconMenu.setStatus("8",true);
            _iconMenu.setStatus("1", true);
            _iconMenu.setStatus("2", true);
            _iconMenu.setStatus("3", true);
            _iconMenu.setStatus("4", true);
            _iconMenu.setStatus("11", true);
            _iconMenu.setStatus("6", false);
            _iconMenu.setStatus("10", true);
        }
        if(_pageData.keepalive==1){
            _iconMenu.setStatus("2",true);
            _iconMenu.setStatus("3",true);
        }
        if(_pageData.sys_volume.type=="lvm"){
            _iconMenu.setStatus("9",true);
        }
        /* if(_pageData.state =="stopped" || _pageData.state == "error"||_pageData.state == "creating"){
         implement.initChart();
         $("#abc").combobox("disable",true);
         }*/
        if(_pageData.state !="stopped" && _pageData.state != "active"){
            _iconMenu.setStatus("9",true);
        }
    };
    implement.getFormatDate = function (val) {
        var result = "";
        var date = new Date(val);
        result = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        return result;
    };
    implement.i18n = function () {
        $("#description").text(ef.util.getLocale('host.hostdetail.blocklistlabel.description'));
        $("#namefield").text(ef.util.getLocale('cal.hostDetail.hostdetaildescript.namefield') + "：");
        $("#idfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.idfield') + "：");
        $("#atatusfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.atatusfield') + "：");
        $("#tenantfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.tenantfield') + "：");
        $("#userfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.userfield') + "：");
        $("#hypervisorfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.hypervisorfield') + "：");
        $("#orderfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.orderfield') + "：");
        $("#ipfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.ipfield') + "：");
        $("#operatingsystemfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.operatingsystemfield') + "：");
        $("#mirrorfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.mirrorfield') + "：");
        $("#formatfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.formatfield') + "：");
        $("#timestampfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.timestampfield') + "：");
        $("#systemdiskfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.systemdiskfield') + "：");
        $("#openclosefield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.openclosefield') );
        $("#diskfield").text(ef.util.getLocale('framework.component.nav.cal.disk.label') + "：");
        $("#remarkfield").text(ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.remarkfield') + "：");
        $("#monitor").text(ef.util.getLocale('host.hostdetail.blocklistlabel.monitor'));
        $("#alarm").text(ef.util.getLocale('host.hostdetail.blocklistlabel.alarm'));
        $("#operation").text(ef.util.getLocale('host.hostdetail.blocklistlabel.operation'));
        $("#time").text(ef.util.getLocale('log.table.time'));
        $("#user").text(ef.util.getLocale('log.table.user'));
        $("#role").text(ef.util.getLocale('log.table.role'));
        $("#type").text(ef.util.getLocale('log.table.type'));
        $("#backup").text(ef.util.getLocale('log.table.event'));
        $("#cpuChart").text(ef.util.getLocale('cal.host.series.name.cpu'));
        $("#memChart").text(ef.util.getLocale('cal.host.series.name.memo'));
        $("#diskinput").text(ef.util.getLocale('cal.host.hostDetail.diskinput'));
        $("#diskoutput").text(ef.util.getLocale('cal.host.hostDetail.diskoutput'));
        $("#networkinput").text(ef.util.getLocale('cal.host.hostDetail.networkinput'));
        $("#networkoutput").text(ef.util.getLocale('cal.host.hostDetail.networkoutput'));
        $('th[field="id"]').text(ef.util.getLocale('host.datagrid.ID'));
        $('th[field="data_id"]').text(ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.data_id'));
        $('th[field="warntime"]').text(ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.warntime'));
        $('th[field="info"]').text(ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.info'));
        $('th[field="starttime"]').text(ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.starttime'));
        $('th[field="updatetime"]').text(ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.updatetime'));
        $('th[field="operate"]').text(ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.operate'));
        $(".float-table .sys_user_span i").tooltip({content:ef.util.getLocale("host.hostdetail.user.password.tip")});
        $(".float-table .sys_user_span i").mousedown(function()
        {
            $(this).tooltip("update",ef.util.getLocale("host.user.super.password.tip")+(_pageData.image&&_pageData.image.super_user_pass?_pageData.image.super_user_pass:""));
        });
        $(".float-table .sys_user_span i").mouseup(function()
        {
            $(this).tooltip("update",ef.util.getLocale("host.hostdetail.user.password.tip"));
        });
        $(".float-table .sys_user_span i").hover(function()
        {
            $(this).tooltip("update",ef.util.getLocale("host.hostdetail.user.password.tip"));
        });
        $(".float-table .sys_user_span i").blur(function()
        {
            $(this).tooltip("hide");
        });
    };
    /**
     *M转化为G
     * */
    implement.mb2gb = function (mb) {
        var num = mb / 1024;
        if (num == Math.floor(num) || num == 0) {
            return num;
        }
        return num.toFixed(2);
    };
    implement.formatter = function () {
        ef.formatter['operateFormatter'] = function (val, row) {
            return '<span><a class="table-btn-ignore">' + ef.util.getLocale("host.list.status") + '</a></span>';
        };
        ef.formatter['statusFormatter'] = function(status) {
            var style = calHost.getStyleByStatus(status);
            var dom = $('<div><i class="hostDetail-status-icon"></i><span></span></div>');
            dom.find('span').text(style.text);
            dom.find('i').addClass(style.icon);
            return dom[0].outerHTML;
        };
        ef.formatter['diskFormatter'] = function (disk) {
            if(!disk||ef.util.isEmpty(disk)){return "-";}
            var dom = $('<div style="width: auto;float:left;"></div>');
            var _result = "";
            _result += (disk.type?disk.type:"默认") + " " + (disk.size ? disk.size : 0) + "GB";
            if(disk.type == '' || disk.type == null){
                disk.type = "默认";
            }
            dom.html(_result).tooltip({
                content:"<p>类型："+disk.type+"</p><p>容量："+disk.size+"GB</p>"
            });
            return dom;
        };
        ef.formatter["userFormat"]=function(user)
        {
            if(!user||ef.util.isEmpty(user))
            {
                return "-";
            }
            return user.display_name;
        }
    };
    implement.init = function () {
        this.i18n();
        this.formatter();

    };
    var _oldname, _boolean = 0, _bool, _oldremark;
    implement.setDetail = function (data,success) {
        var _user = data.user;
        var _tenant = data.tenant;
        var _image = data.image;
        ef.localStorage.put("tenantid",_tenant.id);
        //userDetail.getUserInfo(_user, this.isForce, function (response) {
        //    $(".host-detail-descript").find(".data_" + "user").html(response.displayname);
        //});
        //calImage.getImageList(this.isForce, function (response) {
        //    $(response).each(function (i, il) {
        //        if (il.id == _image) {
        //            $(".host-detail-descript").find(".data_" + "image").html(il.name);
        //            $(".host-detail-descript").find(".data_" + "os").html(il.os);
        //        }
        //    });
        //});
        if(data.image&&data.image.super_user)
        {
            $(".sys_user_field").text(data.image.super_user);
        }else{
            $(".sys_user_span").hide();
            $(".sys_user_field").text("-");
        }
        data.hypervisor = data.host ? data.host.name:"-";
        data.systemdisk = data.sys_volume||{};
        data.remark = data.des||"-";
        data.tenant = data.tenant?data.tenant.name:"-";
        data.format = "co";
        data.ip = calHost.getRealIp(data);
        data.os=data.image?data.image.os:"-";
        _pageData = data;
        _oldname = data.displayname;
        _oldremark = data.remark;
        _boolean = Number(Boolean(data.keepalive));
        _oldname = ef.util.copyDeepProperty(data.displayname);
        _oldremark = ef.util.copyDeepProperty(data.remark);
        if(user.isSys()||user.isSuper()||user.isTenant()||user.isUser()){//设置告警查看和操作权限
            implement.alarm(data.name);
        }
        else if(user.isSec()||user.isAudit){
            implement.alarmElse();
        }
        implement.alarmRef(data.name,true,0);//获取告警信息
        if(success&&ef.util.isFunction(success))
        {
            success();
        }
        for (var i in data) {
            var _val = data[i];
            if (i == "state") {
                _val = ef.formatter['statusFormatter'](_val);
            }
            if (i == "systemdisk") {
                _val = ef.formatter['diskFormatter'](_val);
            }
            if (i == "created_at") {
                _val = ef.util.number2time(_val,"Y-M-D h:m:s",true);
            }
            if (i == "order") {
                var row = {};
                row.id = _val;
                row = ef.util.escapeJSON(JSON.stringify(row));
                _val = '<a href="#" class="table-link" onclick="ef.nav.goto(\'order.ready.detail.html\',\'order.ready.detail\',\'' + row + '\',null,\'order.ready\')">' + _val + '</a>';
            }
            if (i == "format") {
                _val = data.cores + "核 " + implement.mb2gb(data.memory_mb) + "GB";
            }
            if(i=="user")
            {
                _val=ef.formatter["userFormat"](_val);
            }
            if(i=="image")
            {
                _val=data.image.image_name?data.image.image_name:"-";
            }
            $(".host-detail-descript").find(".data_" + i).empty();
            $(".host-detail-descript").find(".data_" + i).html(_val);
            if(i=="os"){
                if(!data["os"]){
                     $(".data_os").text("-");
                    return;
                }
                ef.getJSON({
                    url:api.getAPI("ShostOs"),
                    useLocal:true,
                    type:"get",
                    success: function (response) {
                        ef.util.map(response, function (num) {
                            if(num.name==data["os"]){

                                $(".data_os").html('<i style="float: left;" class="'+num.class+'"></i><span>'+num.name+'</span>');
                            }
                        })
                    }
                })
            }
        }    };
    //此方法在修改配置中也用到了，修改时请注意
    implement.setvlans=function(vmid,issetting,dom){
        ef.getJSON({
            url:api.getAPI("getvnc")+"/"+vmid+"/nics",
            success:function(response){
                var arr=[];
                if(response.length==0){
                    return dom.text("-");
                }
                $(response).each(function(i,il){
                    $(il.fixed_ips).each(function(e,el){
                        arr.push({
                            "net":il.phy_network?il.phy_network:"-",
                            "vlan":il.name,
                            "ip":el.ip_address,
                            "childnet":el.subnet_name,
                            "port_id":el.port_id,
                            "mac_addr":il.mac_addr
                        });
                    });

                });
                if(!issetting){
                    dom.empty();
                    $(arr).each(function(o,ol){
                        var html=$('<span class="ip vlancontent">'+ol.ip+'</span>');
                        $(html).tooltip({
                            content:'<div><span>网络：</span><span>'+ol.vlan+'</span></div>'+
                                    '<div><span>子网：</span><span>'+ol.childnet+'</span></div>'+
                                    '<div><span>物理网络：</span><span>'+ol.net+'</span></div>'
                                    //'<div><span>物理地址：</span><span>'+ol.mac_addr+'</span></div>'
                        });
                        dom.append(html);
                    });
                }else{
                    dom.empty();
                    $(arr).each(function(o,ol){
                        var html='<span class="ip vlancontent" title="'+ol.ip+'">'+ol.ip+'</span>';
                        dom.append(html);
                    });
                    ef.localStorage.put("vlans",arr);
                    if($(arr).length==1){
                        $("i.delete").removeClass("icons-delete-done");
                        $("i.delete").addClass("icon-delete-disable");
                    }
                }
            },
            error:function(err){
                var html='<span class="ip vlancontent"></span>';
                $("#vlanshow").append(html);
            }
        });
    };
    implement.close = function () {
        /* $('#hostdetail_warn').datagrid('insertRow', {
         index: 1,	// 索引从0开始
         row: {
         level: ef.util.getLocale('host.hostdetail.blocklistlabel.table.level'),
         no: 100002,
         info: ef.util.getLocale('host.hostdetail.blocklistlabel.table.info'),
         frequency: 2,
         time: '2015-11-16 17:12',
         operate: ef.util.getLocale('host.list.status')
         }
         });*/
    };
    var datadiskid = ef.util.getLocale('host.hostdetail.blocklistlabel.description.data_disk.tooltip');//ID
    var datadiskname = ef.util.getLocale('host.comboxtoinput.name');//名称
    var capabilition = ef.util.getLocale('host.hostdetail.blocklistlabel.description.datadisk.capability');//容量
    var datadisktype = ef.util.getLocale('host.hostdetail.blocklistlabel.description.datadisk.type');//类型
    implement.hostDisk = function (id) {
        ef.getJSON({
            url: api.getAPI("cal.host.getHostlist") + "/" + id+"/attach/volumes",
            type: "get",//get,post,put,delete
            isForce: true,
            success: function (response) {
                var disk, capability,disk_ID,vm_id;
                $(".data_disk").empty();
                $(".data_disk").append("<div id='disk-field'></div>");
                $("#disk-field").css({'max-height':'95px','overflow':'hidden','overflow-y':'auto'});
                if(!response.length)
                {
                    $("#disk-field").text("-");
                }
                $(response).each(function (i, il) {
                    vm_id = il.vm_id;
                    disk = il.displayname;
                    capability = il.size + "GB";
                    var _html = $('<div class="host_disk">' +
                    '<span class="mount"></span>' +
                    '<i class="mounticon" style="background-position: -558px -11px;height: 19px;width: 18px;"></i>' +
                    '<span class="host_disk_name hostDetail-disk-show"></span>' +
                    '<span class="host_disk_capability hostDetail-disk-show" style="margin-left: 5px;"></span>' +
                    '<span class="diskIdValue" style="display: none"></span>'+
                    '</div>').appendTo('.host-detail-descript .data_disk #disk-field');
                    _html.find(".host_disk_name").data("diskData", disk);
                    _html.find(".host_disk_name").empty().text(disk);
                    _html.find(".host_disk_capability").empty().text(capability);
                    _html.find(".diskIdValue").empty().text(il.volume_id);
                    _html.find(".host_disk_name").tooltip({
                        position: 'bottom',
                        content: '<div class="data_hostdisk"><span>' + datadiskid + '：</span>' + il.name + '</div><div class="data_hostdisk"><span>' + datadiskname +
                        '：</span>' + disk + '</div><div class="data_hostdisk"><span>' + capabilition +
                        '：</span>' + capability + '</div><div><span>' + datadisktype +
                        '：</span>' + il.type + '</div>'
                    });
                });
                if (user.isSys() ||user.isTenant()|| user.isSuper()) {
                    $(".mounticon").click(function () {
                        var mount = $(this);//'是否卸载'
                        var name = $(mount).next().text();
                        disk_ID = $(this).next().next().next().text();
                        $.messager.confirm(ef.alert.warning, ef.util.getLocale('host.cal.host.hostDetail.messager.confirm') + name + "?", function (ok) {//是否卸载云硬盘
                            if (ok) {
                                ef.getJSON({
                                    url: api.getAPI("cal.host.getHostlist") + "/volume/detach",
                                    type: "post",//get,post,put,delete
                                    isForce: true,
                                    useLocal: true,
                                    data: {
                                        "volume_id": disk_ID,
                                        "vm_id": vm_id
                                    },
                                    success: function (response) {
                                        ef.placard.doing(ef.util.getLocale("cal.disk.unbridge.success.doing"));
                                        mount.parent().remove();
                                        if($("#disk-field").children().length==0){
                                            $("#disk-field").text('-');
                                        }
                                    },
                                    error: function (error) {
                                        console.log(error);
                                    }
                                });
                            }
                        });
                    })
                }
                $(".mounticon").tooltip({
                    position: 'bottom',
                    content: '<span>' + ef.util.getLocale('host.hostdetail.blocklistlabel.description.diskdelete') + '</span>'//卸载
                });
                $(".name .data_hostdisk").css('margin-right', '10px');
            },
            error: function (error) {
                console.log(error);

            }
        });
    };
    implement.deleteVm = function (deleteDisks) {
        console.log(deleteDisks);
        var deleteStr = [],url;
        if(deleteDisks&&deleteDisks.length!=0){
            deleteStr.push(deleteDisks.join(","));
            url = api.getAPI("cal.host.getHostlist") + "/" + ef.localStorage.get("hostDetail_id")+"?delete_volume_ids="+deleteStr;
        }
        else
        {url = api.getAPI("cal.host.getHostlist") + "/" + ef.localStorage.get("hostDetail_id")}
        ef.getJSON({
            url: url,
            type: "delete",//get,post,put,delete
            isForce: true,
            useLocal:true,
            success: function (response) {
                ef.loading.hide();
                ef.Dialog.closeAll();
                var abc = "deleteing";

                ef.nav.goto("host.html", "cal.host", abc, null, "cal.host");
                ef.placard.doing(ef.util.getLocale("cal.host.delhost.placard"));
            },
            error: function (error) {
                ef.loading.hide();
                console.log(error);
            }
        });
    };
    implement.cpuGuage = function (data) {
        /**
         * @thomas cpu左边利用率
         */
        if (!$(".guage-box").length)return;
        var guagecpu = echarts.init($(".guage-box")[0]);
        var option = {
            tooltip: {
                formatter: "{a} : {c}%"
            },
            series: data
        };
        guagecpu.setOption(option, true);
    };
    implement.initCpu = function () {
        var cserise = [];
        cserise.push({
            name: ef.util.getLocale('cal.host.series.name.cpu'),
            type: 'gauge',
            data: {value:0,name:ef.util.getLocale('cal.host.series.name.cpu')},
            radius: '75%',
            title:{
                show:"true",
                offsetCenter:[0,"90%"]
            },
            detail : {
                textStyle: {
                    color: 'auto',
                    fontWeight: 'normal',
                    fontSize:18
                }
            },
            axisLine : { // 坐标轴线
                lineStyle : { // 属性lineStyle控制线条样式
                    color : [[0.2, '#7bc23f'],
                        [0.8, '#5abdee'],
                        [1, '#ff6d5b']]
                }
            }
        });
        if(ef.util.isFirefox()){
            cserise[0].detail.offsetCenter = [0, '45%'];
        }
        implement.cpuGuage(cserise);
    };
    implement.memoGuage = function (data) {
        /**
         * @thomas men右边利用率
         */
        if (!$(".memo-box").length)return;
        var memobox = echarts.init($(".memo-box")[0]);
        var option = {
            tooltip: {
                formatter: "{a} : {c}%"
            },
            series: data
        };
        memobox.setOption(option, true);
    };
    implement.initMemo = function () {
        var mserise = [];
        mserise.push({
            name: ef.util.getLocale('cal.host.series.name.memo'),
            type: 'gauge',
            data: {value:0,name:ef.util.getLocale('cal.host.series.name.memo')},
            radius : '75%',
            title:{
                show:"true",
                offsetCenter:[0,"90%"]
            },
            detail : {
                textStyle: {
                    color: 'auto',
                    fontWeight: 'normal',
                    fontSize:18
                }
            },
            axisLine : { // 坐标轴线
                lineStyle : { // 属性lineStyle控制线条样式
                    color : [ [ 0.2, '#458324' ],
                        [ 0.8, '#4f89b9' ],
                        [ 1, '#ef5e3b' ] ]
                }
            }
        });
        if(ef.util.isFirefox()){
            mserise[0].detail.offsetCenter = [0, '45%'];
        }
        implement.memoGuage(mserise);
    };
    implement.getCpuinfo = function (data) {
        var cpu_per = [], gserise = [];
        if(data){
            var cpuvalue = Number(data).toFixed(2);
            if(cpuvalue>100){
                cpuvalue=100;
            }
            cpu_per.push({value:cpuvalue,name: ef.util.getLocale('cal.host.series.name.cpu')});
        }else{
            cpu_per.push({value:0,name:ef.util.getLocale('cal.host.series.name.cpu')});
        }
        gserise.push({
            name: ef.util.getLocale('cal.host.series.name.cpu'),
            type: 'gauge',
            data: cpu_per,
            radius: '75%',
            title:{
                show:"true",
                offsetCenter:[0,"90%"]
            },
            detail : {
                /* formatter:'{value}%',*/
                textStyle: {
                    color: 'auto',
                    fontWeight: 'normal',
                    fontSize:18
                }
            },
            axisLine : { // 坐标轴线
                lineStyle : { // 属性lineStyle控制线条样式
                    color : [[0.2, '#7bc23f'],
                        [0.8, '#5abdee'],
                        [1, '#ff6d5b']]
                }
            }
        });
        if(ef.util.isFirefox()){
            gserise[0].detail.offsetCenter = [0, '45%'];
        }
        implement.cpuGuage(gserise);
        /*ef.getJSON({
         url: api.getAPI("Monitoring") + "/cpu_util",
         type: "get",
         isForce: true,
         useLocal:true,
         data: {
         vm: id,
         limit:10
         },
         success: function (response) {
         var cpu_per = [], gserise = [];
         if(response.length==0){
         cpu_per.push({value:0,name:ef.util.getLocale('cal.host.series.name.cpu')});
         }else if(response[0].value != null){
         var cpuvalue = ($(response)[0].value).toFixed(2);
         if(cpuvalue>100){
         cpuvalue=100;
         }
         cpu_per.push({value:cpuvalue,name: ef.util.getLocale('cal.host.series.name.cpu')});
         }else{
         cpu_per.push({value:0,name:ef.util.getLocale('cal.host.series.name.cpu')});
         }
         gserise.push({
         name: ef.util.getLocale('cal.host.series.name.cpu'),
         type: 'gauge',
         data: cpu_per,
         radius: '75%',
         title:{
         show:"true",
         offsetCenter:[0,"90%"]
         },
         axisLine : { // 坐标轴线
         lineStyle : { // 属性lineStyle控制线条样式
         color : [[0.2, '#7bc23f'],
         [0.8, '#5abdee'],
         [1, '#ff6d5b']]
         }
         }
         });
         implement.cpuGuage(gserise);
         },
         error: function (error) {
         console.log(error);
         }
         })*/
    };
    implement.getMemoinfo = function (data) {
        var memo_per = [], gserise = [];
        if(data){
            var memovalue = Number(data).toFixed(2);
            if(memovalue>100){
                memovalue=100;
            }
            memo_per.push({value:memovalue,name: ef.util.getLocale('cal.host.series.name.memo')});
        }else{
            memo_per.push({value:0,name:ef.util.getLocale('cal.host.series.name.memo')});
        }
        gserise.push({
            name: ef.util.getLocale('cal.host.series.name.memo'),
            type: 'gauge',
            data: memo_per,
            radius : '75%',
            title:{
                show:"true",
                offsetCenter:[0,"90%"]
            },
            detail : {
                /* formatter:'{value}%',*/
                textStyle: {
                    color: 'auto',
                    fontWeight: 'normal',
                    fontSize:18
                }
            },
            axisLine : { // 坐标轴线
                lineStyle : { // 属性lineStyle控制线条样式
                    color : [ [ 0.2, '#458324' ],
                        [ 0.8, '#4f89b9' ],
                        [ 1, '#ef5e3b' ] ]
                }
            }
        });
        if(ef.util.isFirefox()){
            gserise[0].detail.offsetCenter = [0, '45%'];
        }
        implement.memoGuage(gserise);
        /*ef.getJSON({
         url: api.getAPI("Monitoring") + "/memory_util",
         type: "get",
         isForce: true,
         useLocal:true,
         data: {
         vm: id,
         limit:10
         },
         success: function (response) {
         var memo_per = [], gserise = [];
         if(response.length==0){
         memo_per.push({value:0,name:ef.util.getLocale('cal.host.series.name.memo')});
         }else if(response[0].value != null){
         var memovalue = ($(response)[0].value).toFixed(2);
         if(memovalue>=100){
         memovalue=100;
         }
         memo_per.push({value:memovalue,name: ef.util.getLocale('cal.host.series.name.memo')});
         }else{
         memo_per.push({value:0,name:ef.util.getLocale('cal.host.series.name.memo')});
         }
         gserise.push({
         name: ef.util.getLocale('cal.host.series.name.memo'),
         type: 'gauge',
         data: memo_per,
         radius : '75%',
         title:{
         show:"true",
         offsetCenter:[0,"90%"]
         },
         axisLine : { // 坐标轴线
         lineStyle : { // 属性lineStyle控制线条样式
         color : [ [ 0.2, '#458324' ],
         [ 0.8, '#4f89b9' ], [ 1, '#ef5e3b' ] ]
         }
         }
         });
         implement.memoGuage(gserise);
         },
         error: function (error) {
         console.log(error);
         }
         })*/
    };
    implement.yAmax = function () {
        var yMax = [];
        yMax.push(//y轴
            {
                type: 'value',
                min:0,
                max:100,
                splitNumber:5,
                interval:20,
                axisLabel: {
                    formatter: '{value}%'
                }
            });
        return yMax;
    };
    implement.yAais=function(max,unit){
        /*var yAais=[];
        yAais.push( {type: 'value',
            min:0,
            max:max,
            splitNumber:5,
            interval:parseInt(max/5),
            axisLabel: {
                formatter: '{value}'+unit
            }
        });
        return yAais;*/
        return {type: 'value',
            min:0,
            max:max,
            splitNumber:5,
            interval:parseInt(max/5),
            axisLabel: {
                formatter: '{value}'+unit
            }
        };
    };
    implement.getProgressionTime = function(distance,number){
        var temp= [],
            tempStr = '',
            currentTime = new Date().getTime(),
            number = _.isNumber(number) ? Math.ceil(number) : 5;
        distance = _.isNumber(distance) ? Math.ceil(distance) : 5000;
        for(var i = 0; i < number; i++){
            tempStr = ef.util.number2time((currentTime-distance*i),'Y-M-D h:m:s',true);
            tempStr = tempStr.substr(10).trim();
            temp.push(tempStr);
        }
        return temp.reverse();
    };
    implement.cpu_controll=function(dataArray){
        if(!_.isArray(dataArray)){
            dataArray = [];
        }
        var response = _.clone(dataArray);
        var valPercent = [];
        var time = [];
        var cpu_per=[];
        if(response.length==0||response==null){
            /* valPercent.push((0).toFixed(2));*/
            valPercent = (function(num){
                var temp = [];
                for(var i = 0; i < num; i++){
                    temp.push('-');
                }
                return temp;
            })(10);
            time = implement.getProgressionTime(null, 10);
        }
        cpu_per.push({
            name:'CPU利用率',
            type:'line',
            data:valPercent
        });
        implement.cpuChartGuage("CPU利用率",cpu_per,implement.yAmax(),time);
    };
    implement.memo_controll=function(dataArray){
        if(!_.isArray(dataArray)){
            dataArray = [];
        }
        var response = _.clone(dataArray);
        var memoPercent = [];
        var time = [];
        var memo_per = [];
        if (response.length == 0||response==null) {
            /*memoPercent.push((0).toFixed(2));*/
            memoPercent = (function(num){
                var temp = [];
                for(var i = 0; i < num; i++){
                    temp.push('-');
                }
                return temp;
            })(10);
            time = implement.getProgressionTime(null, 10);
        } else{
            response = _.sortBy(response,'timestamp');
            $(response).each(function (i, il) {
                if(il.value == null){
                    memoPercent.push('-');
                }else{
                    if(il.value>100){
                        il.value=100;
                    }
                    memoPercent.push(Number(il.value).toFixed(2));
                }
                var timeData = ef.util.number2time(il.timestamp,"Y-M-D h:m:s",true);
                time.push(timeData.substr(10,timeData.length));
            });
        }
        memo_per.push({
            name: '内存使用率',
            type: 'line',
            time:time,
            data: memoPercent
        });
        implement.cpuChartGuage("内存使用率",memo_per,implement.yAmax(),time);
    };
    implement.diskChartGuage = function (titText,diskdata,max,xdata) {
        /**
         * @thomas cpu折线图
         */
        if(!$(".disk-box").length)return;
        if(implement.diskbox && !implement.diskbox.isDisposed()){
            implement.diskbox.dispose();
            implement.diskbox = null;
            implement.option4 = null;
            $(".disk-box").empty();
        }
        implement.diskbox = echarts.init($(".disk-box")[0]);
        implement.option4 = {
            title:{
                text:titText,
                left:'40%'
            },
            addDataAnimation:false,
            tooltip: {
                trigger: 'axis'
            },
            calculable: true,
            xAxis: {
                splitLine:{
                    show:true
                },
                type: 'category',
                boundaryGap: false,
                data: xdata
            },
            yAxis:  max,
            series:diskdata
        };
        //implement.diskbox.resize();
        implement.diskbox.setOption(implement.option4,true);
    };
    implement.initChart=function(){
        // if(!$(".disk-box").length)return;
        var diskbox = echarts.init($(".disk-box")[0]);
        option4 = {
            title:{
                text:'CPU利用率',
                left:'40%'
            },
            tooltip: {
                trigger: 'axis'//触发类型
                /*formatter:function(params){
                 return   params.name+params.seriesName+":"+params.data+"</br>";
                 //   params[0].name+'<br/>'+':'+params[0].value;
                 }*/
            },
            toolbox: {
                show: false,
                feature: {
                    mark: {show: true},//辅助线标志
                    dataView: {show: true, readOnly: false},//数据视图
                    magicType: {show: true, type: ['line', 'bar', 'stack', 'tiled']},//图表类型切换，当前仅支持直角系下的折线图、柱状图转换
                    restore: {show: true},//还原，复位原始图表
                    saveAsImage: {show: true} //保存为图片
                }
            },
            calculable: true,
            xAxis: [
                {
                    splitLine:{
                        show:true
                    },
                    type: 'category',
                    boundaryGap: false,
                    data:["0s","10s","15s","20s","25s","30s","35s","40s"]
                }
            ],
            yAxis:[
                {
                    type : 'value',
                    axisLabel : {
                        formatter: '{value} %'
                    },
                    max:100,
                    splitNumber:5,
                    interval:parseInt(100/5),
                    min:0
                }
            ],
            series:
            {
                name: 'cpu利用率',
                type: 'line',
                data: [0,0,0,0,0,0,0,0]
            }
        };
        diskbox.setOption(option4,true);
    };
    implement.cpuChartGuage = function (titText,diskdata,max,xdata) {
        if(!$(".disk-box").length)return;
        if(implement.diskbox && !implement.diskbox.isDisposed()){
            implement.diskbox.dispose();
            implement.diskbox = null;
            implement.option4 = null;
            $(".disk-box").empty();
        }
        implement.diskbox = echarts.init($(".disk-box")[0]);
        implement.option4 = {
            title:{
                text:titText,
                left:'43%'
            },
            addDataAnimation:false,
            tooltip: {
                trigger: 'axis'/*,//触发类型
                formatter:function(diskdata){
                    return  diskdata[0].name+'<br/>'+diskdata[0].seriesName+'(%): '+diskdata[0].data;
                }*/
            },
            calculable: true,
            xAxis: [
                {
                    splitLine:{
                        show:true
                    },
                    type: 'category',
                    boundaryGap: false,
                    data:xdata /*['0s', '5s', '10s', '15s', '20s', '25s', '30s', '35s', '40s', '45s']*/
                }
            ],
            yAxis:  max,
            series:diskdata
        };
        implement.diskbox.resize();
        implement.diskbox.setOption(implement.option4,true);
        $(".disk-box").append('<div style="position: absolute; height: 20px;width: 20px;top: 15px;left: 0px;background-color: #fff;z-index:20;"></div>');
    };
    implement.unit = function (max,item,el) {
        var itemName,unit;
        if(el == null){
            el = '-';
        }
        if (max > 1024&&max<(1024*1024)) {
            el = (el / 1024).toFixed(2);
            itemName=item+'(KB/s)';
            unit='KB/s';
        }else if(max > (1024*1024)&&max<(1024*1024*1024)){
            el = (el / (1024*1024)).toFixed(2);
            itemName=item+'(MB/s)';
            unit='MB/s';
        }else if(max > (1024*1024*1024)&&max<(1024*1024*1024*1024)){
            el = (el / (1024*1024*1024)).toFixed(2);
            itemName=item+'(GB/s)';
            unit='GB/s';
        }else if(max>(1024*1024*1024*1024)){
            el = (el / (1024*1024*1024*1024)).toFixed(2);
            itemName=item+'(TB/s)';
            unit='TB/s';
        }
        else {
            el = Number(el).toFixed(2);
            itemName=item+'(B/s)';
            unit='B/s';
        }
        if(_.isNaN(el) || String(el).toLowerCase() === 'nan'){
            el = '-';
        }
        return {
            name: itemName,
            data: el,
            unit: unit
        };
    };
    implement.diskReadinfo = function (dataArray) {
        if(!_.isArray(dataArray)){
            dataArray = [];
        }
        var response = _.clone(dataArray);
        var disk_read = [],
            unit;
        var diskRead = [];
        var time=[];
        if(response.length==0||response==null){
            diskRead = (function(num){
                var temp = [];
                for(var i = 0; i < num; i++){
                    temp.push('-');
                }
                return temp;
            })(10);
            time = implement.getProgressionTime(null, 10);
        }
        var diskReadGroup = _.groupBy(diskRead,function(item){
            return item == '-' ? 'selected':'unselected';
        });
        var MaxDisk = -1;
        if(diskReadGroup && diskReadGroup.unselected && diskReadGroup.unselected.length){
            MaxDisk = parseInt(Math.max.apply(Math,diskReadGroup.unselected));
        }else{
            MaxDisk = 0;
        }
        var dataChart = [],
            tempData = null,
            itemName = '',
            unit = '';
        $(diskRead).each(function(e ,el){
            tempData = implement.unit(MaxDisk,"磁盘Input",el);
            dataChart.push(tempData.data);
            unit = tempData.unit;
            itemName = tempData.name;
        });
        var dataChartGroup = _.groupBy(dataChart,function(item){
            return item == '-' ? 'selected':'unselected';
        });
        var Max = -1;
        if(dataChartGroup && dataChartGroup.unselected && dataChartGroup.unselected.length){
            Max = parseInt(Math.max.apply(Math,dataChartGroup.unselected));
        }else{
            Max = 0;
        }
        disk_read.push({
            name: itemName,
            type: 'line',
            time:time,
            data: dataChart
        });
        if(Max < 100){
            Max = 100;
        }
        implement.diskChartGuage("磁盘Input",disk_read,implement.yAais(Max,unit),time);
    };
    implement.diskWriteinfo = function (dataArray) {
        if(!_.isArray(dataArray)){
            dataArray = [];
        }
        var response = _.clone(dataArray);
        var disk_write = [],
            diskWrite = [],
            unit;
        var time=[];
        if(response.length==0||response==null){
            /*diskWrite.push((0).toFixed(2));*/
            diskWrite = (function(num){
                var temp = [];
                for(var i = 0; i < num; i++){
                    temp.push('-');
                }
                return temp;
            })(10);
            time = implement.getProgressionTime(null, 10);
        }
        var diskReadGroup = _.groupBy(diskWrite,function(item){
            return item == '-' ? 'selected':'unselected';
        });
        var MaxDisk = -1;
        if(diskReadGroup && diskReadGroup.unselected && diskReadGroup.unselected.length){
            MaxDisk = parseInt(Math.max.apply(Math,diskReadGroup.unselected));
        }else{
            MaxDisk = 0;
        }
        var dataChart = [],
            tempData = null,
            itemName = '',
            unit = '';
        $(diskWrite).each(function(e ,el){
            tempData = implement.unit(MaxDisk,"磁盘Output",el);
            dataChart.push(tempData.data);
            unit = tempData.unit;
            itemName = tempData.name;
        });
        var dataChartGroup = _.groupBy(dataChart,function(item){
            return item == '-' ? 'selected':'unselected';
        });
        var Macx = -1;
        if(dataChartGroup && dataChartGroup.unselected && dataChartGroup.unselected.length){
            Macx = parseInt(Math.max.apply(Math,dataChartGroup.unselected));
        }else{
            Macx = 0;
        }
        disk_write.push({
            name:itemName,
            type: 'line',
            time:time,
            data: dataChart
        });
        if(Macx < 100){
            Macx = 100;
        }
        implement.diskChartGuage("磁盘Output",disk_write,implement.yAais(Macx,unit),time);
    };
    implement.networkIninfo = function (data) {
        //@todo network input
        var response= [];
        if(_.isArray(data)){
            response = data.slice();
        }else{
            response = [];
        }
        var disk_inflow = [],diskData = [],unit;
        var time=[];
        if(response.length==0||response==null){
            diskData = (function(num){
                var temp = [];
                for(var i = 0; i < num; i++){
                    temp.push('-');
                }
                return temp;
            })(10);
            time = implement.getProgressionTime(null, 10);
            unit = 'B/s';
            itemName = '网络Input'+'('+unit+')';
        }else{
            response = _.sortBy(response,'timestamp');
            $(response).each(function (i, il) {
                if(il.value == null){
                    diskData.push('-');
                }else{
                    diskData.push(Number(il.value));
                }
                var timeData = ef.util.number2time(il.timestamp,"Y-M-D h:m:s",true);
                time.push(timeData.substr(10,timeData.length));
            });
        }
        var diskReadGroup = _.groupBy(diskData,function(item){
            return item == '-' ? 'selected':'unselected';
        });
        var MaxDisk = -1;
        if(diskReadGroup && diskReadGroup.unselected && diskReadGroup.unselected.length){
            MaxDisk = parseInt(Math.max.apply(Math,diskReadGroup.unselected));
        }else{
            MaxDisk = 0;
        }
        var dataChart = [];
        var itemName,
            tempData = null;
        $(diskData).each(function(e ,el){
            tempData = implement.unit(MaxDisk,"网络Input",el);
            unit = tempData.unit;
            itemName = tempData.name;
            dataChart.push(tempData.data);
        });
        var dataChartGroup = _.groupBy(dataChart,function(item){
            return item == '-' ? 'selected':'unselected';
        });
        var Macx = -1;
        if(dataChartGroup && dataChartGroup.unselected && dataChartGroup.unselected.length){
            Macx = parseInt(Math.max.apply(Math,dataChartGroup.unselected));
        }else{
            Macx = 0;
        }
        disk_inflow.push({
            name: itemName,
            type: 'line',
            time:time,
            data: dataChart
        });
        implement.diskChartGuage("网络Input",disk_inflow,implement.yAais(Macx+100,unit),time);
    };
    implement.networkOutinfo = function (data) {
        var response=[];
        if(_.isArray(data)){
            response = data.slice();
        }else{
            response = [];
        }
        var disk_inflow = [],diskData = [],unit;
        var time=[];
        if(response.length==0||response==null){
            /*diskData.push((0).toFixed(2));*/
            diskData = (function(num){
                var temp = [];
                for(var i = 0; i < num; i++){
                    temp.push('-');
                }
                return temp;
            })(10);
            time = implement.getProgressionTime(null,10);
            unit = 'B/s';
            itemName = '网络Output'+'('+unit+')';
        }else {
            response = _.sortBy(response,'timestamp');
            $(response).each(function (i, il) {
                if(il.value == null){
                    diskData.push('-');
                }else{
                    diskData.push(Number(il.value));
                }
                var timeData = ef.util.number2time(il.timestamp,"Y-M-D h:m:s",true);
                time.push(timeData.substr(10,timeData.length));
            });
        }
        /* var MaxDisk = parseInt(Math.max.apply(Math,diskData));
         if(_.isNaN(MaxDisk)){
         MaxDisk = 0;
         }*/
        var diskReadGroup = _.groupBy(diskData,function(item){
            return item == '-' ? 'selected':'unselected';
        });
        var MaxDisk = -1;
        if(diskReadGroup && diskReadGroup.unselected && diskReadGroup.unselected.length){
            MaxDisk = parseInt(Math.max.apply(Math,diskReadGroup.unselected));
        }else{
            MaxDisk = 0;
        }
        var dataChart = [];
        var itemName,
            tempData = null;
        $(diskData).each(function(e ,el){
            /*if (MaxDisk > 1024&&MaxDisk<(1024*1024)) {
             el = (el / 1024).toFixed(2);
             itemName='网络Output'+'(KB/s)';
             unit='(KB/s)';
             }
             else if(MaxDisk > (1024*1024)&&MaxDisk<(1024*1024*1024)){
             el = (el / (1024*1024)).toFixed(2);
             itemName='网络Output'+'(MB/s)';
             unit='(MB/s)';
             }else if(MaxDisk > (1024*1024*1024)&&MaxDisk<(1024*1024*1024*1024)){
             el = (el / (1024*1024*1024)).toFixed(2);
             itemName='网络Output'+'(GB/s)';
             unit='(GB/s)';
             }else if(MaxDisk>(1024*1024*1024*1024)){
             el = (el / (1024*1024*1024*1024)).toFixed(2);
             itemName='网络Output'+'(TB/s)';
             unit='(TB/s)';
             }
             else {
             el = Number(el).toFixed(2);
             itemName='网络Output'+'(B/s)';
             unit='(B/s)';
             }*/
            tempData = implement.unit(MaxDisk,"网络Output",el);
            unit = tempData.unit;
            itemName = tempData.name;
            dataChart.push(tempData.data);
        });
        /* var Macx= parseInt(Math.max.apply(Math,dataChart));
         if(_.isNaN(Macx)){
         Macx = 0;
         }*/
        var dataChartGroup = _.groupBy(dataChart,function(item){
            return item == '-' ? 'selected':'unselected';
        });
        var Macx = -1;
        if(dataChartGroup && dataChartGroup.unselected && dataChartGroup.unselected.length){
            Macx = parseInt(Math.max.apply(Math,dataChartGroup.unselected));
        }else{
            Macx = 0;
        }
        disk_inflow.push({
            name: itemName,
            type: 'line',
            time:time,
            data: dataChart
        });
        implement.diskChartGuage("网络Output",disk_inflow,implement.yAais(Macx+100,unit),time);//Number(ef.util.max(MaxDisk))+10);
        /*ef.getJSON({
         url: api.getAPI("Monitoring") + "/network.outgoing.bytes.rate",
         type: "get",
         isForce: true,
         useLocal:true,
         data: {
         vm: id,
         limit: 10
         },
         success: function (response) {
         response=response.reverse();
         var disk_inflow = [],diskData = [],unit;
         var time=[];
         if(response.length==0||response==null){
         diskData.push((0).toFixed(2));
         }else {
         $(response).each(function (i, il) {
         diskData.push(Number(il.value).toFixed(2));
         var timeData = ef.util.number2time(il.timestamp,"Y-M-D h:m:s",true);
         time.push(timeData.substr(10,timeData.length));
         });
         }
         var MaxDisk = parseInt(Math.max.apply(Math,diskData));
         var dataChart = [];
         var itemName;
         $(diskData).each(function(e ,el){
         implement.unit(MaxDisk,"网络Output",el,function(resp){
         dataChart.push(resp);
         });
         });
         var Macx= parseInt(Math.max.apply(Math,dataChart));
         disk_inflow.push({
         name: itemName,
         type: 'line',
         time:time,
         data: dataChart
         });
         implement.diskChartGuage("网络Output",disk_inflow,implement.yAais(Macx+100,unit),time);//Number(ef.util.max(MaxDisk))+10);
         },
         error: function (error) {
         console.log(error);
         }
         })*/
    };
    implement.conClick = function () {
        function preparedRequestData(id,name,limit){
            var requestData = {
                id: id || implement.id,
                chart:{
                    counter_name: name,
                    limit: limit || 10
                }
            };
            return JSON.stringify(requestData);
        }
        $("#abc").combobox({
            editable:false,
            onSelect:function(newValue){
                var requestString = '';
                var value = newValue.value;
                switch(value){
                    case '1':
                        implement.cpu_controll([]);
                        requestString = preparedRequestData(null,'cpu_util',null);
                        if( implement.socket &&
                            implement.socket.socket &&
                            implement.socket.socket.readyState == 1){
                            implement.socket.send(requestString);
                        }
                        break;
                    case '2':
                        implement.memo_controll([]);
                        requestString = preparedRequestData(null,'memory_util',null);
                        if( implement.socket &&
                            implement.socket.socket &&
                            implement.socket.socket.readyState == 1){
                            implement.socket.send(requestString);
                        }
                        break;
                    case '3':
                        implement.diskReadinfo([]);
                        requestString = preparedRequestData(null,'disk.read.bytes.rate',null);
                        if( implement.socket &&
                            implement.socket.socket &&
                            implement.socket.socket.readyState == 1){
                            implement.socket.send(requestString);
                        }
                        break;
                    case '4':
                        implement.diskWriteinfo([]);
                        requestString = preparedRequestData(null,'disk.write.bytes.rate',null);
                        if( implement.socket &&
                            implement.socket.socket &&
                            implement.socket.socket.readyState == 1){
                            implement.socket.send(requestString);
                        }
                        break;
                    case '5':
                        implement.networkIninfo([]);
                        requestString = preparedRequestData(null,'network.incoming.bytes.rate',null);
                        if( implement.socket &&
                            implement.socket.socket &&
                            implement.socket.socket.readyState == 1){
                            implement.socket.send(requestString);
                        }
                        break;
                    case '6':
                        implement.networkOutinfo([]);
                        requestString = preparedRequestData(null,'network.outgoing.bytes.rate',null);
                        if( implement.socket &&
                            implement.socket.socket &&
                            implement.socket.socket.readyState == 1){
                            implement.socket.send(requestString);
                        }
                        break;
                    default:
                        console.log('cal.host.detail.selected',value);
                        break;
                }
                console.log('requestString',requestString);
                /*if(newValue=="1"){
                 requestString = preparedRequestData(null,'cup_util',null);
                 implement.socket.send(requestString);
                 }else if(newValue=="2"){
                 implement.memo_controll(implement.id);
                 }else if(newValue=="3"){
                 implement.diskReadinfo(implement.id);
                 }else if(newValue=="4"){
                 implement.diskWriteinfo(implement.id);
                 }else if(newValue=="5"){
                 implement.networkIninfo(implement.id);
                 }else if(newValue=="6"){
                 implement.networkOutinfo(implement.id);
                 }*/
            }
        })/*.combobox('unselect','1');*/
    };
    implement.logRef = function(startNumber,name){
        var arg=arguments,
            logname = arg[1],
            url=api.getAPI('log.getLoglist');
        ef.getJSON({
            url:url,
            type:"get",
            data:{
                start:startNumber,
                object:name,
                limit:10,
                type:"vm",
                fuzzy:false
            },
            success:function(response,allResult){
                //$('#logList').datagrid({data:response}).datagrid('clientPaging');
                console.log(response);
                $('#logList').datagrid("loadData",response).datagrid('getPager').pagination(
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
    implement.getOperateAction=function(type,operation)
    {
        var arrs=["server.operate",type,operation];
        return ef.util.getLocale(arrs.join("."));
    };
    implement.logTable = function(){
        $("#logList").datagrid({
            pagination:true,
            pageSize:10,
            fitColumns:true,
            resizeHandle:"left",
            singleSelect:true,
            columns:[[
                {field:'time',title:ef.util.getLocale("log.table.time"),align:"left",
                    resizable:true,width:'18%',formatter: function (val) {
                    return ef.util.number2time(val,"Y-M-D h:m:s",true);}},
                {field:'user',align:"left",
                    resizable:true,title:ef.util.getLocale("log.table.user"),width:'12%'},
                {field:'role',align:"left",
                    resizable:true,title:ef.util.getLocale("log.table.role"),width:'16%',
                    formatter:function(val){
                        return role.getRoleByType(val).label;
                    }},
                {field:'type',align:"left",
                    resizable:true,title:ef.util.getLocale("log.table.type"),width:'15%',formatter:
                    function(val){
                        return ef.util.getLocale("server.operate."+val);
                    }},
                {field:'operation',align:"left",
                    resizable:true,title:ef.util.getLocale("log.table.operate"),width:'13%',formatter:
                    function(val){
                        return ef.util.getLocale("server.operate."+val);
                    }},
                {field:'des',align:"left",
                    resizable:true,title:ef.util.getLocale("log.table.event"),width:'30%',formatter:function(val,row)
                {
                    var $dom=$("<ul></ul>");
                    $dom.css({"overflow":"hidden","text-overflow":"ellipsis","white-space":"nowrap"});
                    //dashboard.updateLogupdateLog(row,$dom,true);
                    //return $dom;
                    var txt;
                    if(val!=null){
                        txt=implement.getOperateAction(row.type,row.operation)+val;
                    }else{
                        txt=implement.getOperateAction(row.type,row.operation);
                    }
                    return $dom.text(txt).attr('title',txt);
                }}
            ]]
        });
    };
    implement.renderGuage = function(data){
        if(data.cpu_util||data.cpu_util===0){
            implement.getCpuinfo(data.cpu_util);
        }else if(data.memory_util||data.cpu_util===0){
            implement.getMemoinfo(data.memory_util);
        }else{
            console.log('no vms to show');
        }
    };
    implement.utils = {
        formatTimeData:function(data){
            if(!_.isNumber(data) || _.isNaN(data) || String(data).toLowerCase() === 'nan'){
                return null;
            }
            var temp = ef.util.number2time(data,"Y-M-D h:m:s",true);
            return temp.substr(10,temp.length).trim();
        },
        formatValueData:function(data){
            if(!_.isNumber(data) || _.isNaN(data) || String(data).toLowerCase() === 'nan'){
                return '-';
            }
            if(data > 100){
                data = 100;
            }
            return Number(data).toFixed(2);
        },
        setCpuMemDatas:function(dataArray){
            if(!_.isArray(dataArray) || (dataArray.length == 0)){
                implement.diskbox.setOption([],true);
                return;
            }
            var timeData = [],
                valueData = [];
            dataArray = _.sortBy(dataArray,'timestamp');
            $(dataArray).each(function(index, item){
                timeData.push(implement.utils.formatTimeData(item.timestamp));
                valueData.push(implement.utils.formatValueData(item.value))
            });
            implement.option4.xAxis[0].data = null;
            implement.option4.series[0].data = null;
            var color=ef.util.EchartsColor.getColor("cpu","info");
            implement.option4.xAxis[0].data = timeData;
            implement.option4.series[0].data = valueData;
            implement.option4.series[0].itemStyle =color.itemStyle;
            implement.option4.series[0].lineStyle = color.lineStyle;
            implement.diskbox.setOption(implement.option4,true);
        },
        getMaxValue:function(dataArray,predication){
            if(!_.isArray(dataArray) || (dataArray.length == 0)){
                return 0;
            }
            var max = 0;
            var nullDataGroup = _.groupBy(dataArray,function(item){
                return item == predication ? 'selected' :  'unSelected';
            });
            if(nullDataGroup && nullDataGroup.unSelected && nullDataGroup.unSelected.length){
                var temp = _.max(nullDataGroup.unSelected,function(item){
                    return Number(item)
                });
                max = temp || 0;
            }
            return max;
        },
        getNetMaxValue:function(dataArray){
            if(!_.isArray(dataArray) || (dataArray.length == 0)){
                return;
            }
            var max = {
                maxValue: 0,
                yAxFlag: false
            };
            var nullDataGroup = _.groupBy(dataArray,function(item){
                return item.value == null ? 'selected' :  'unSelected';
            });
            if(nullDataGroup && nullDataGroup.selected){
                if(nullDataGroup.selected.length == dataArray.length){
                    max.yAxFlag = true;
                }
            }
            if(nullDataGroup && nullDataGroup.unSelected && nullDataGroup.unSelected.length){
                var temp = _.max(nullDataGroup.unSelected,function(item){
                    return Number(item.value)
                });
                if(temp){
                    max.maxValue = temp.value || 0;
                    if(temp.value <= 0){
                        max.yAxFlag = true;
                    }
                }else{
                    max.maxValue = 0;
                    console.log('null data group error');
                }
            }
            return max;
        },
        getUnit:function(max){
            var unit = '';
            if(max > 1024 && max < (1024*1024)){
                unit = 'KB/s';
            }else if(max > (1024 * 1024) && max < (1024 * 1024*1024)){
                unit = 'MB/s';
            }else if(max > (1024 * 1024*1024) && max < (1024 * 1024*1024*1024)){
                unit = 'GB/s';
            }else if(max > (1024 * 1024*1024*1024)){
                unit='TB/s';
            }else{
                unit='B/s';
            }
            return unit;
        },
        formatValueItem:function(unit,value){
            value = parseFloat(value);
            if(_.isNaN(value)){
                return '-';
            }
            var units = {
                'KB/s': 1024,
                'MB/s': 1024*1024,
                'GB/s': 1024*1024*1024,
                'TB/s': 1024*1024*1024*1024,
                'B/s' : 1
            };
            if(units[unit]){
                return (value/units[unit]).toFixed(2);
            }else{
                return value;
            }
        },
        setDiskNetWorkDatas:function(data,title,types){
            if(!(_.isObject(data) && (!_.isArray(data) || !_.isFunction(data)))){
                return;
            }
            var seriesData = [];
            var MaxValueArray = _.chain(data).toArray().flatten().value();
            var MaxValue = implement.utils.getNetMaxValue(MaxValueArray);
            var unit = implement.utils.getUnit(MaxValue.maxValue);
            for(var key in data){
                var xArrayData = [],
                    seriesInnerData = [],
                    seriesDataSample = {
                        name: '',
                        type: 'line',
                        time: null,
                        data: null
                    };
                var dataResp = _.clone(data[key]);
                if(!_.isArray(dataResp)){
                    dataResp = [];
                }
                dataResp = _.sortBy(dataResp,'timestamp');
                $(dataResp).each(function(index, item){
                    xArrayData.push(implement.utils.formatTimeData(item.timestamp));
                    seriesInnerData.push(implement.utils.formatValueItem(unit,item.value));
                });
                seriesDataSample.data = null;
                seriesDataSample.time = null;
                seriesDataSample.name = null;
                var color=ef.util.EchartsColor.getColor(key,"host"+types);
                seriesDataSample.data = seriesInnerData;
                seriesDataSample.time = xArrayData;
                seriesDataSample.name = key+title+'('+unit+')';
                if(color){
                    seriesDataSample.itemStyle=color.itemStyle; seriesDataSample.lineStyle=color.lineStyle;

                }
                seriesData.push(seriesDataSample);
            }
            var xTimeData = null;
            if(seriesData && seriesData.length){
                xTimeData = seriesData[0].time;
            }
            var yAxData = null;
            if(MaxValue.yAxFlag){
                yAxData = implement.yAxOther(unit);
            }else{
                yAxData = implement.yAx(unit);
            }
            //implement.option4.xAxis[0].data = xTimeData;
            implement.option4.xAxis.data = xTimeData;
            implement.option4.yAxis = yAxData;
            implement.option4.series = seriesData;
            implement.diskbox.setOption(implement.option4,true);
        },
        setDiskStreamNetWorkDatas:function(dataArray,title,types){
            if(!_.isArray(dataArray) || (dataArray.length == 0)){
                return;
            }
            dataArray = _.sortBy(dataArray,'timestamp');
            var orgValueArray = _.chain(dataArray)
                           .pluck('value')
                           .compact().value();
            var orgMaxValue = -1;
            if(orgValueArray.length){
                orgMaxValue = _.max(orgValueArray,function(item){
                    return parseFloat(item);
                });
            }else{
                orgMaxValue = 0;
            }
            var unit = implement.utils.getUnit(orgMaxValue);
            //format dataArray
            var timeData = [],
                valueData = [];
            _.each(dataArray,function(item){
                var timestamp = implement.utils.formatTimeData(item.timestamp);
                timeData.push(timestamp);
                var value = implement.utils.formatValueItem(unit,item.value);
                valueData.push(value);
            });
            implement.option4.xAxis.data = timeData;
            implement.option4.yAxis = implement.yAx(unit);
            implement.option4.series[0].name = title+'('+unit+')';
            implement.option4.series[0].data = valueData;
            var color=ef.util.EchartsColor.getColor("disk","host"+types);
            if(color){
                implement.option4.series[0].itemStyle=color.itemStyle;implement.option4.series[0].lineStyle=color.lineStyle;
            }
            implement.diskbox.setOption(implement.option4,true);

        }
    };
    implement.yAxOther = function (unit,max) {
        var y = [];
        y.push(//y轴
            {
                min:0,
                max:max || 10,
                splitNumber:5,
                interval:2,
                type: 'value',
                axisLabel: {
                    formatter: '{value}'+unit
                }
            });
        return y;
    };
    implement.yAx = function (unit) {
        /*var y = [];
        y.push(//y轴
            {
                type: 'value',
                min: 0,
                axisLabel: {
                    formatter: function(value){
                        return value+unit+'';
                    }
                }
            });
        return y;*/
        return {
            type: 'value',
            min: 0,
            axisLabel: {
                formatter: function(value){
                    return value+unit+'';
                }
            }
        };
    };
    implement.redraw = function () {
        this.init();
        $("#host-all").show();
        $("#ok").click(function(){
            var name = $("#name").textbox("getValue");
            var remark = $(".remarktextarea").text();
            ef.getJSON(
                {
                    url: api.getAPI("backupCreating")+"/volume",
                    type: "put",//get,post,put,delete
                    useLocal:true,
                    data: {
                        "name": name,
                        "description": remark
                    },
                    success: function (response) {
                        ef.loading.hide();
                        ef.Dialog.close("hostDetailbackup");
                    },
                    error: function (error) {
                        ef.loading.hide();
                    }
                });
        });
        ef.util.ready(function (dom) {
            implement.logTable();
            implement.initCpu();
            implement.initMemo();
            implement.id = ef.util.getCrossId(dom);
            var _pageData={};
            _pageData.id=ef.util.getCrossId(dom);
            implement.conClick();
            ef.getJSON({
                url: api.getAPI("cal.host.getHostlist") + "/" + implement.id,
                type: "get",//get,post,put,delete
                success: function (response) {
                    implement.listRowData = response;
                    //implement.conClick();
                    _pageData.sys_volume = {
                        type:response.sys_volume.type
                    };
                    _pageData = response;
                    implement.name = _pageData.name;
                    $("#abc").combobox('enable');
                    if (implement.listRowData && implement.listRowData.state != 'active') {
                        implement.cpu_controll([]);
                        $("#abc").combobox('disable');
                    }
                    implement.setDetail(response,sysvalue);
                    implement.setvlans(implement.id,false,$("#vlanshow"));
                    ef.localStorage.put("hostDetail_id", _pageData.id);
                    ef.localStorage.put("hostDetail_state", _pageData.state);
                    function sysvalue() {
                        $(".data_displayname").textbox({
                            height: 30,
                            width: 197,
                            readonly: true,
                            value: _oldname
                        });
                        $(".data_remark").textbox({
                            width: 215,
                            height: 45,
                            multiline: true,
                            readonly: true,
                            value: _oldremark == "" ? "-" : _oldremark
                        });
                        //$(".host-detail .textbox").css("border", "none");
                    }

                    //描述
                    var _LleftBtns;
                    switcher = $("#switch").switch(
                        {
                            checked: _boolean,
                            disabled: true,
                            onTip: "关闭",
                            offTip: "开启",
                            onLabel: "开",
                            offLabel: "关",
                            change: function () {
                                if (_LleftBtns) {
                                    _LleftBtns.setStatus("2", false);
                                }
                            }
                        });
                    if (user.isSys() || user.isTenant() || user.isSuper()) {
                        $("#host-all").addClass('padding_top50');
                        if (_boolean == 0) {
                            _iconMenu.setStatus("2", true);
                        }
                        _LleftBtns = $(".icons-userdetail").togglebutton([
                            [
                                {
                                    iconClass: "icon-menus-icon-edit",
                                    tip: ef.util.getLocale("setting.user.edit.tip"),//编辑
                                    id: '1',
                                    access: [6, 7, 8, 9, 88],
                                    click: function (menu) {
                                        _LleftBtns.setStatus("2", true);
                                        _LleftBtns.goto(1);
                                        $(".data_displayname").textbox({
                                            width: 197,
                                            height: 30,
                                            required: true,
                                            maxlength: 15,
                                            validType: 'whitelist["\(\)\.\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线,下划线，括号和点"]',
                                            readonly: false,
                                            value: _oldname
                                        });
                                        $(".data_remark").textbox({
                                            width: 215,
                                            height: 45,
                                            multiline: true,
                                            readonly: false,
                                            value: _oldremark == "-" ? "" : _oldremark,
                                            maxlength: 50
                                        });
                                        if(_pageData.sys_volume.type=="lvm"){
                                            switcher.setDisable(true);
                                        }else{
                                            switcher.setDisable(false);
                                        }
                                        $(".textbox-text").keydown(function () {
                                            _LleftBtns.setStatus("2", false);
                                        });
                                        //$(".host-detail .textbox").css("border-bottom", "1px solid black");
                                        //$(".textareass .textbox").css("border", "1px solid");
                                    }
                                }
                            ],
                            [
                                {
                                    iconClass: "icon-menus-icon-save",
                                    tip: ef.util.getLocale("setting.user.save.tip"),//保存
                                    id: "2",
                                    access: [6, 7, 8, 9, 88],
                                    click: function (menu) {
                                        ef.loading.show();
                                        var switchbool = switcher.checked;
                                        var swi = Number(switchbool);
                                        if (!$(".data_displayname").textbox('isValid')) {
                                            ef.loading.hide();
                                            return;
                                        }
                                        ef.getJSON({
                                            url: api.getAPI("cal.host.getHostlist") + "/" + implement.id + "/info",
                                            type: "post",//get,post,put,delete
                                            isForce: true,
                                            useLocal: true,
                                            data: {
                                                "extend": {
                                                    "displayname": $(".data_displayname").textbox('getValue'),
                                                    "des": $(".data_remark").textbox('getValue'),
                                                    "keepalive": swi
                                                }
                                            },
                                            success: function (response) {
                                                switcher.setDisable(true);
                                                $(".host-detail .textbox").css("border", "none");
                                                $(".data_displayname").textbox({readonly: true});
                                                _LleftBtns.goto(0);
                                                _oldname = $(".data_displayname").val();
                                                _oldremark = $(".data_remark").val();
                                                $(".data_remark").textbox({
                                                    readonly: true,
                                                    value: _oldremark == "" ? "-" : _oldremark
                                                });
                                                ef.loading.hide();
                                                if (swi == 0) {
                                                    _iconMenu.setStatus("2", false);
                                                    _iconMenu.setStatus("3", false);
                                                }
                                                if (swi == 1) {
                                                    _iconMenu.setStatus("2", true);
                                                    _iconMenu.setStatus("3", true);
                                                }
                                                _boolean = switchbool;
                                            },
                                            error: function (error) {
                                                ef.loading.hide();
                                                console.log(error);
                                            }
                                        });
                                    }
                                },
                                {
                                    iconClass: "icon-menus-icon-cancel",
                                    tip: ef.util.getLocale("setting.user.cancel.tip"),//取消
                                    access: [6, 7, 8, 9, 88],
                                    click: function () {
                                        switcher.toSwitch(_boolean);
                                        switcher.setDisable(true);
                                        _LleftBtns.goto(0);
                                        sysvalue();
                                    }
                                }
                            ]
                        ]).setStatus('2', true);
                        implement.hostDisk(_pageData.id);
                    }
                    //权限
                    if (user.isSec()) {
                        switcher.setDisable(true);
                        $("#warn").show();
                        $("#hostdetail_warn").datagrid('hideColumn', 'operate');
                        $("#hostdetail_warn").datagrid({
                            columns: [[
                                {
                                    field: "id",
                                    width: "15%",
                                    title: ef.util.getLocale('cal.host.hostDetail.hostdetaildescript.idfield')
                                },
                                {
                                    field: "data_id",
                                    width: "18%",
                                    title: ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.data_id')
                                },
                                {
                                    field: "warntime",
                                    width: "18%",
                                    title: ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.warntime')
                                },
                                {
                                    field: "info",
                                    width: "17%",
                                    title: ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.info')
                                },
                                {
                                    field: "starttime",
                                    width: "18%",
                                    title: ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.starttime')
                                },
                                {
                                    field: "updatetime",
                                    width: "17%",
                                    title: ef.util.getLocale('host.hostdetail.blocklistlabel.alarm.updatetime')
                                }

                            ]]

                        });
                        implement.hostDisk(_pageData.id);
                    }
                    if (_pageData.state == "active") {
                        if(_pageData.sys_volume.type=="lvm"){
                            _iconMenu.setStatus("9", true);
                        }else{
                            _iconMenu.setStatus("9", false);
                        }
                        _iconMenu.setStatus("8", true);
                        _iconMenu.setStatus("1", true);
                        _iconMenu.setStatus("2", false);
                        _iconMenu.setStatus("3", false);
                        _iconMenu.setStatus("4", true);
                        _iconMenu.setStatus("11", true);
                        _iconMenu.setStatus("5", false);
                        _iconMenu.setStatus("6", false);
                        _iconMenu.setStatus("7", true);
                        _iconMenu.setStatus("10", false);
                    }
                    else if (_pageData.state == "error") {
                        _iconMenu.setStatus("8", true);
                        _iconMenu.setStatus("1", false);
                        _iconMenu.setStatus("2", false);
                        _iconMenu.setStatus("3", false);
                        _iconMenu.setStatus("4", true);
                        _iconMenu.setStatus("11", true);
                        _iconMenu.setStatus("5", true);
                        _iconMenu.setStatus("6", false);
                        _iconMenu.setStatus("10", true);
                    }
                    else if (_pageData.state == "stopped") {
                        if(_pageData.sys_volume.type=="lvm"){
                            _iconMenu.setStatus("9", true);
                        }else{
                            _iconMenu.setStatus("9", false);
                        }
                        _iconMenu.setStatus("8", false);
                        _iconMenu.setStatus("1", false);
                        _iconMenu.setStatus("2", true);
                        _iconMenu.setStatus("3", true);
                        _iconMenu.setStatus("4", false);
                        _iconMenu.setStatus("11", false);
                        _iconMenu.setStatus("5", false);
                        _iconMenu.setStatus("10", true);
                        _iconMenu.setStatus("6", false);
                    }
                    else {
                        _iconMenu.setStatus("8", true);
                        _iconMenu.setStatus("1", true);
                        _iconMenu.setStatus("2", true);
                        _iconMenu.setStatus("3", true);
                        _iconMenu.setStatus("4", true);
                        _iconMenu.setStatus("11", true);
                        _iconMenu.setStatus("10", true);
                        _iconMenu.setStatus("5", true);
                        _iconMenu.setStatus("6", false);
                        _iconMenu.setStatus("7", true);
                    }

                    if (_pageData.keepalive == 1) {
                        _iconMenu.setStatus("2", true);
                        _iconMenu.setStatus("3", true);
                    }
                    /* if (_pageData.state == "stopped" || _pageData.state == "error" || _pageData.state == "creating") {
                     implement.initChart();
                     $("#abc").combobox("disable", true);
                     }*/
                    if (_pageData.state != "stopped" && _pageData.state != "active") {
                        _iconMenu.setStatus("9", true);
                    }
                    var logName;
                    $(response).each(function (i, il) {
                        logName = il.name;
                    });
                    implement.logRef(0, logName);
                }
            });
            _iconMenu = $("#js-menus-wrapper").iconmenu([
                {
                    iconClass: "icon-menus-icon-connect",
                    tip: ef.util.getLocale('host.iconmenu.connect.tip'),//"连接",
                    "id": "10",
                    "access": [6, 7, 8, 9, 88],
                    click: function () {
                        ef.getJSON(
                            {
                                url: api.getAPI("getvnc") + "/" + implement.id + "/vnc",
                                isForce: implement.isForce,
                                useLocal: true,
                                success: function (response) {
                                    // var dom = $('<a target="_blank">aaa</a>');
                                    // dom.attr("href", response.url);
                                    // $(document.body).append(dom);
                                    // dom.click();
                                    // setTimeout(function()
                                    // {
                                    //     dom.remove();
                                    // },10)
                                    var newTab=window.open(response.url);
                                    newTab.onLoad=function()
                                    {
                                        console.log("ready");
                                    }


                                }
                            });
                    }
                },
                {
                    iconClass: "icon-menus-icon-run",
                    tip: ef.util.getLocale('host.iconmenu.poweron.tip'),//"开机",
                    id: "1",
                    "access": [6, 7, 8, 88],
                    click: function () {
                        $(".host-detail-descript").find(".data_status").html('<span class="status_exec_color">' + '开机中' + '</span>');
                        _iconMenu.setStatus("1", true);
                        _iconMenu.setStatus("2", true);
                        _iconMenu.setStatus("3", true);
                        _iconMenu.setStatus("4", true);
                        _iconMenu.setStatus("5", true);
                        calHost.Action([_pageData.id], "start", function () {
                            //implement.getDetail();
                            //$(".data_state").css({"color":"#d59d37"}).text("开机中");
                        }, $.noop, true);
                    }
                },
                {
                    iconClass: "icon-menus-icon-shutdown",
                    tip: ef.util.getLocale('host.iconmenu.shutdown.tip'),// "关机",
                    id: "2",
                    "access": [6, 7, 8, 88],
                    click: function () {
                        ef.messager.confirm('reminding', ef.util.getLocale('host.iconmenu.shutdown.select.message.confirmclose') + "'" + _pageData.name + "'" + "?",null,function (ok) {
                            if (ok) {//执行中
                                $(".host-detail-descript").find(".data_status").html('<span class="status_exec_color">' + '关机中' + '</span>');
                                _iconMenu.setStatus("1", true);
                                _iconMenu.setStatus("2", true);
                                _iconMenu.setStatus("3", true);
                                _iconMenu.setStatus("4", true);
                                _iconMenu.setStatus("5", true);
                                calHost.Action([_pageData.id], "shutdown", function () {
                                    //$(".data_state").css({"color":"#d59d37"}).text("关机中");
                                    //implement.getDetail();
                                }, $.noop, true);
                                //if (switcher.checked == true) {
                                // implement.close();
                                // }
                            }
                        });
                    }
                },
                {
                    iconClass: "icon-menus-icon-restart",
                    tip: ef.util.getLocale('host.iconmenu.reboot.tip'),//"重启",
                    id: "3",
                    "access": [6, 7, 8, 88],
                    click: function () {
                        ef.messager.confirm('reminding', ef.util.getLocale('host.iconmenu.shutdown.select.message.confirmok') + "'" + _pageData.name + "'" + "?",null, function (ok) {
                            if (ok) {
                                $(".host-detail-descript").find(".data_status").html('<span class="status_exec_color">' + '重启中' + '</span>');
                                _iconMenu.setStatus("1", true);
                                _iconMenu.setStatus("2", true);
                                _iconMenu.setStatus("3", true);
                                _iconMenu.setStatus("4", true);
                                _iconMenu.setStatus("5", true);
                                calHost.Action([_pageData.id], "reboot", function () {
                                    //$(".data_state").css({"color":"#d59d37"}).text("重启中");
                                    //implement.getDetail();
                                }, $.noop, true);
                            }
                        });
                    }
                },
                {
                    iconClass: "icon-menus-icon-setting",
                    tip: ef.util.getLocale('host.iconmenu.setting.tip'),//"修改配置",
                    id: "4",
                    "access": [6, 7, 8, 88],
                    click: function () {
                        new ef.Dialog('hostDetailquota', {
                            title: ef.util.getLocale('host.iconmenu.setting.tip'),// '修改配置',
                            quotaData: _pageData,
                            width: 635,
                            height: 304,
                            closed: false,
                            cache: false,
                            nobody: false,
                            href: 'views/addhostDetail.html',
                            modal: true,
                            onResize: function () {
                                $(this).dialog("center");
                            },
                            onClose: function () {
                                require.undef('cal.hostDetail.quato');
                            },
                            onLoad: function () {
                                require(['cal.hostDetail.quato'], function (quato) {
                                    quato.redraw();
                                })
                            }
                        });
                    }
                },
                {
                    iconClass: "icon-menus-icon-ip",
                    tip: ef.util.getLocale('host.iconmenu.ip.tip'),//"修改配置",
                    id: "11",
                    "access": [6, 7, 8, 88],
                    click: function () {
                        new ef.Dialog('hostDetailIp', {
                            title: ef.util.getLocale('host.iconmenu.ip.tip'),// '修改配置',
                            quotaData: _pageData,
                            width: 780,
                            height: 490,
                            closed: false,
                            cache: false,
                            nobody: false,
                            href: 'views/addHostDetailIp.html',
                            modal: true,
                            onResize: function () {
                                $(this).dialog("center");
                            },
                            onClose: function () {
                                implement.setvlans(_pageData.id,false,$("#vlanshow"));
                                require.undef('cal.host.hostDetail.ip');
                            },
                            onLoad: function () {
                                require(['cal.host.hostDetail.ip'], function (ip) {
                                    ip.redraw();
                                })
                            }
                        });
                    }
                },
                {
                    iconClass: "icon-menus-icon-copy",
                    tip: ef.util.getLocale('host.iconmenu.backup.tip'),//"备份",
                    "access": [6, 7, 8, 9, 88],
                    "id": "5",
                    click: function () {
                        var hei = 320;
                        if($(".data_disk .host_disk_name").text().length!=0){
                            hei = 530;
                        }
                        new ef.Dialog('hostDetailbackup', {
                            title: ef.util.getLocale('host.iconmenu.backup.title'),//'备份',
                            attachData: _pageData,
                            width: 720,
                            height: hei,
                            closed: false,
                            cache: false,
                            nobody: false,
                            href: 'views/addhostDetail.backup.html',
                            modal: true,
                            onResize: function () {
                                $(this).dialog("center");
                            },
                            onClose: function () {
                                require.undef('cal.hostDetail.backup');
                            },
                            onLoad: function () {
                                require(['cal.hostDetail.backup'], function (backup) {
                                    backup.redraw();
                                })
                            }
                        });
                    }
                },
                {
                    iconClass: "icon-menus-icon-setting_mgr",
                    tip: ef.util.getLocale('host.iconmenu.backupmngr.tip'),//"备份管理",
                    "access": [6, 7, 8, 9, 88],
                    "id": "6",
                    click: function () {
                        var _row = ef.util.escapeJSON(JSON.stringify({
                            id: implement.id,
                            type: 1,
                            name: _pageData.name
                        }));
                        ef.nav.goto("backupDetail.html", "cal.backupDetail", _row, null, "cal.backup");
                    }
                },
                {
                    iconClass: "icon-menus-icon-delete",
                    tip: ef.util.getLocale('host.iconmenu.delete.tip'),// "删除",
                    "access": [6, 7, 8, 9, 88],
                    id: "7",
                    click: function () {
                        if ($(".host_disk_name").length != 0) {
                            var con = $(".practice").text();
                            var data_id = $(".data_name").text();
                            new ef.Dialog('hostDetaildelete', {
                                title: "",
                                attachData: _pageData,
                                closable: false,
                                width: 600,
                                height: 380,
                                closed: false,
                                cache: false,
                                nobody: false,
                                href: 'views/cal.hostDetail.delete.html',
                                modal: true,
                                onResize: function () {
                                    $(this).dialog("center");
                                },
                                onClose: function () {
                                    require.undef('cal.hostDetail.delete');
                                },
                                onLoad: function () {
                                    require(['cal.hostDetail.delete'], function (hostdelete) {
                                        hostdelete.redraw();
                                    })
                                }
                            });
                        }
                        else {
                            $.messager.confirm(ef.alert.warning, ef.util.getLocale('host.cal.host.hostDetail.messagerhi.confirmhost') +"'"+ _pageData.name + "'?" + '<div class="delete_hostDetail_promot">' + ef.util.getLocale('cal.disk.delete') + '</div>', function (ok) {//是否卸载云主机  所有相关备份文件同时删除
                                if (ok) {
                                    implement.deleteVm();
                                }
                            });
                        }
                    }
                },
                {
                    iconClass: "icon-menus-icon-templates",
                    tip: ef.util.getLocale('host.iconmenu.template.tip'),//"创建镜像",
                    "access": [8, 9, 88],
                    id: 8,
                    click: function () {
                        new ef.Dialog('hostDetailtemplate', {
                            title: ef.util.getLocale('host.iconmenu.template.tip'),// '创建镜像',
                            quotaData: _pageData,
                            width: 770,
                            height: 450,
                            closed: false,
                            cache: false,
                            nobody: false,
                            href: 'views/hostDetail.template.html',
                            modal: true,
                            onResize: function () {
                                $(this).dialog("center");
                            },
                            onClose: function () {
                                require.undef('cal.hostDetail.template');
                            },
                            onLoad: function () {
                                require(['cal.hostDetail.template'], function (template) {
                                    template.redraw();
                                })
                            }
                        });
                    }
                },
                {
                    iconClass: "icon-menus-icon-move",
                    tip: ef.util.getLocale('host.iconmenu.move.tip'),//迁移,
                    "access": [8, 9, 88],
                    id: 9,
                    click: function () {
                        new ef.Dialog('hostDetailmove', {
                            title: ef.util.getLocale('host.iconmenu.move.tip'),
                            quotaData: _pageData,
                            width: 870,
                            height: 550,
                            closed: false,
                            cache: false,
                            nobody: false,
                            border: false,
                            href: 'views/hostDetail.move.html',
                            modal: true,
                            onResize: function () {
                                $(this).dialog("center");
                            },
                            onClose: function () {
                                require.undef('cal.hostDetail.move');
                            },
                            onLoad: function () {
                                require(['cal.hostDetail.move'], function (move) {
                                    move.redraw();
                                })
                            }
                        });
                    }
                }
                //{
                //    iconClass: "icon-menus-icon-back",
                //    tip: ef.util.getLocale('framework.component.iconmenu.back.tip'),//"返回",
                //    "access": [6, 7, 8, 9, 10, 88],
                //    click: function () {
                //        ef.nav.goto("host.html", "cal.host");
                //    }
                //},
                //{
                //    iconClass: "icon-menus-icon-refresh",
                //    tip: ef.util.getLocale('framework.component.iconmenu.refresh.tip'),//"刷新",
                //    "access": [6, 7, 8, 9, 10, 88],
                //    click: function () {
                //        ef.nav.reload();
                //    }
                //}
            ]);
            /* implement.socket.onopen = function(){
             console.log('socket 连接成功');
             implement.conClick();
             $("#abc").combobox('select', '1');
             if (implement.listRowData && implement.listRowData.state != 'active') {
             $("#abc").combobox('disable');
             } else {
             $("#abc").combobox('enable');
             }
             };*/
            var v;
            implement.cpu_controll(implement.id);
            implement.getSocket();
            function change() {
                if (v == "1") {
                    implement.cpu_controll(implement.id);
                }
                if (v == "2") {
                    implement.memo_controll(implement.id);
                }
                if (v == "3") {
                    implement.diskReadinfo(implement.id);
                }
                if (v == "4") {
                    implement.diskWriteinfo(implement.id);
                }
            }

            function changeTwo() {
                if (v == "5") {
                    implement.networkIninfo(implement.id);
                }
                if (v == "6") {
                    implement.networkOutinfo(implement.id);
                }
            }

            /* $("#abc").combobox({
             onChange: function (newValue, oldValue) {
             v = newValue;
             change();
             changeTwo();
             }
             });*/

            /* return;
             var Timer_hostDetail = new ef.Timer(6000, function () {
             if(!_pageData||!_pageData.state){return;}
             if(_pageData.state !="stopped" && _pageData.state != "error"&& _pageData.state != "creating"){
             implement.getCpuinfo(implement.id);
             implement.getMemoinfo(implement.id);
             change();
             }
             }, module.id);

             var TimerNet = new ef.Timer(60000, function (){
             changeTwo();
             }, module.id);
             TimerNet.start();

             Timer_hostDetail.start();*/
        });
        /* };*/
    };
    implement.getSocket = function(){

        try{
            if(!implement.socket){
                implement.socket = new ef.server.Socket(api.getAPI('cal.host.detail.socket',true),"cal.host.detail.socket");
            }
            implement.socket.onopen = function(){
                console.log('socket connect success');
                $("#abc").combobox('select', '1');
                var obj = {
                    "id":implement.id,
                    "chart":{
                        "counter_name":"cpu_util",
                        "limit":10
                    }
                };
                implement.socket.send(JSON.stringify(obj));
            };
            implement.value2type = function(value){
                var cache = {
                    1:'cpu_util',
                    2:'memory_util',
                    3:'disk.read.bytes.rate',
                    4:'disk.write.bytes.rate',
                    5:'network.incoming.bytes.rate',
                    6:'network.outgoing.bytes.rate'
                };
                if(cache[value]){
                    return cache[value];
                }
                return null;
            };
            implement.socket.onmessage = function(arg){
                var data = JSON.parse(arg.data);
                console.log(data);
                var typeAll = data.type;
                var typeNum = -1;
                if($('#abc').length){
                    typeNum = parseInt($('#abc').combobox('getValue'));
                }
                switch(typeAll){
                    case 'chart':
                        if(data.response.type){
                            var currentSelect = implement.value2type(typeNum);
                            if(data.response.type != currentSelect){
                                return;
                            }
                            switch(data.response.type){
                                case 'cpu_util':
                                    //implement.cpu_controll(data.records);
                                    implement.utils.setCpuMemDatas(data.response.records);
                                    break;
                                case 'memory_util':
                                    //implement.memo_controll(data.records);
                                    implement.utils.setCpuMemDatas(data.response.records);
                                    break;
                                case 'disk.read.bytes.rate':
                                    //implement.diskReadinfo(data.records);
                                    implement.utils.setDiskStreamNetWorkDatas(data.response.records,'磁盘Input',"disk");
                                    break;
                                case 'disk.write.bytes.rate':
                                    //implement.diskWriteinfo(data.records);磁盘Output
                                    implement.utils.setDiskStreamNetWorkDatas(data.response.records,'磁盘Output',"disk");
                                    break;
                                case 'network.incoming.bytes.rate':
                                    //implement.networkIninfo(data.records);
                                    implement.utils.setDiskNetWorkDatas(data.response.records,'网络Input',"nic");
                                    break;
                                case 'network.outgoing.bytes.rate':
                                    //implement.networkOutinfo(data.records);
                                    implement.utils.setDiskNetWorkDatas(data.response.records,'网络Output',"nic");
                                    break;
                                default:
                                    console.log('cal.host.detail',data.response.type);
                                    break;
                            }
                        }
                        break;
                    case 'state':
                        if(data.response=="quit"){
                            ef.nav.goto("host.html", "cal.host");
                            return;
                        }
                        var style = calHost.getStyleByStatus(data.response);
                        if(data.response=='active'){
                            $("#abc").combobox({disabled:false});
                        }else{$("#abc").combobox({disabled:true});
                        }
                        var dom = $('<div><i class="hostDetail-status-icon"></i><span></span></div>');
                        dom.find('span').text(style.text);
                        var domContent=$(".data_state");
                        domContent.empty();
                        domContent.append(dom);
                        domContent.find('i').addClass(style.icon);
                        ef.getJSON(
                            {
                                url:api.getAPI("cal.host.getHostlist") + "/"+implement.id,
                                success:function(response)
                                {
                                    var host=response.host.name;
                                    $(".data_hypervisor").empty();
                                    $(".data_hypervisor").text(host);
                                    implement.controlState(response);
                                    implement.cpu_controll([]);
                                }
                            });
                        break;
                    case 'pie':
                        var pieValue = ef.util.map(data.response, function (el) {
                            if(el.type=="cpu_util"){
                                implement.renderGuage({cpu_util:el.records.value});
                                return {cpu_util:el.records.value};
                            }
                            if(el.type=="memory_util"){
                                implement.renderGuage({memory_util:el.records.value});
                                return {memory_util:el.records.value};
                            }
                        });
                        break;
                    case 'vm_alarm':
                        if(data.response == 'refresh'){
                            implement.alarmRef(implement.name,false);
                        }
                        break;
                    case 'vm_log':
                        if(data.response == 'refresh'){
                            implement.logRef(0,implement.name);
                        }
                        break;
                }
            };
        }catch(e){
            console.log('cal.host.detail.socket erro',e);
        }
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});



