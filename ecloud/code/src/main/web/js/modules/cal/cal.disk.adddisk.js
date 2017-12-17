/**
 * Created by 韩雪飞 on 2015/11/30.
 */
define(["module","api","cal.disk","setting.param"],function (module,api,disk,settingParam) {
    var implement=new ef.Interface.implement();
    implement.init = function () {
        $("#Disk_Name").textbox({
            required:true,
            maxlength:15,
            width:220,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'
        });
        $("#adddiskvolume").textbox({
            validType: 'regx[/^(([1-9]\\d)|([1-9](\\d{2}))|([1-9])(\\d{3})|(10000))$/,"请输入10-10000之间的数字"]',
            maxlength:5,
            required:true
        });
        $("#Disk_num").numberspinner({
            min: 1,
            max: 100,
            editable: true,
            value:1,
            required:true
        });
        $("#Disk_user").combobox({
            textField:"displayname",
            valueField:"id",
            width:220,
            disabled:true,
            maxlength:50,
            editable:false,
            onSelect: function () {
                $("#adddiskokall").css('opacity',1);
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
                    return item.displayname == val
                });
                if(!index){
                    $(this).combobox('setValue', '');
                }
            }
        });
        $("#Disk_pro").combobox({
            required:true,
            textField:"name",
            valueField:"id",
            maxlength:50,
            width:220,
            onSelect: function (newValue) {
                newValue = newValue.id;
                $("#adddiskokall").css('opacity',1);
                $("#Disk_user").combobox({disabled:false});
                ef.getJSON({
                    url:api.getAPI("setting.project.datagrid_project")+"/"+newValue+"/users",
                    type:"get",
                    success:function(response){
                        response.unshift({displayname:"未分配",id:""});
                        $("#Disk_user").combobox({data:response});
                    }
                });
                ef.getJSON({
                    url:api.getAPI("cal.host.migrate"),
                    type:'get',
                    data:{
                        tenant_id:newValue,
                        volume_type:'lvm'
                    },
                    success: function (response) {
                        $("#Disk_host").combobox({data:response});
                    }
                });
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
                }
            }
        });
        $("#Disk_type").combobox({
            required:true,
            textField:"name",
            valueField:"id",
            width:220,
            maxlength:50,
            editable:false,
            onChange: function (newValue) {
                $("#adddiskokall").css('opacity',1);
                if(newValue=="lvm"||newValue=="LVM"){
                    $(".host-disk").show();
                    $("#Disk_num").numberspinner({disabled:true});
                    ef.getJSON({
                        url:api.getAPI("cal.host.migrate"),
                        type:'get',
                        data:{
                            tenant_id:$("#Disk_pro").combobox('getValue'),
                            volume_type:'lvm'
                        },
                        success: function (response) {
                            $("#Disk_host").combobox({data:response});
                        }
                    });
                }
                else{
                    $(".host-disk").hide();
                    $("#Disk_num").numberspinner({disabled:false});
                }
            }
        });
        $("#Disk_host").combobox({
            required:true,
            textField:"name",
            valueField:"name",
            width:220,
            maxlength:50,
            editable:false,
            onChange: function () {
                $("#adddiskokall").css('opacity',1);
            }
        });
    };
    implement.inter = function () {
        implement.init();
        ef.getJSON({
            url:api.getAPI("setting.project.datagrid_tenants"),
            type:"get",
            success:function(response){
                var result = [];
                $(response).each(function (i, il) {
                    if (il.name == "admin" || il.name == "services") {
                        return;
                    }
                    result.push(il);
                });
                $("#Disk_pro").combobox({data:result});
            }
        });
        ef.getJSON({
            url:api.getAPI("cal.host.migrate"),
            type:'get',
            data:{
                tenant_id:$("#Disk_pro").combobox('getValue'),
                volume_type:'new'
            },
            success: function (response) {
                $("#Disk_host").combobox({data:response});
            }
        });
    };
    implement.redraw=function()
    {
        implement.inter();
        $("#adddiskvolume").textbox("setValue",10);
        settingParam.getList(this.isForce,function(response)
        {
            var item = {name:"默认",id:""};
            var rec=ef.util.find(response,function(record)
            {
                return record.name=="storage.default_type";
            });
            var type=rec?rec.value:undefined;
            if(type=="lvm"){
                item.id = "LVM";
                $(".host-disk").show();
                $("#Disk_num").numberspinner({disabled:true});
            }else{$(".host-disk").hide();item.id = "";}
            ef.getJSON({
                url:api.getAPI("order.wait.Detail.save.ip"),
                type:"get",
                success:function(resp){
                    var result = [];
                    $(resp).each(function (i,il) {
                        var r = {name:il.name,id:il.name};
                        result.push(r);
                    });
                    result.unshift(item);
                    $("#Disk_type").combobox({data:result});
                    $("#Disk_type").combobox('setText',"默认");
                }
            });
        });
        $("#cal-adddisk-name").before(ef.util.getLocale('host.comboxtoinput.name'));
        $("#cal-adddisk-cap").before(ef.util.getLocale('host.hostdetail.blocklistlabel.description.datadisk.capability'));
        $(".cal-adddisk-backup").append(ef.util.getLocale('cal.host.backup'));
        $("#adddiskcancel").append(ef.util.getLocale('global.button.cancel.label'));
        $("#adddiskok").append(ef.util.getLocale('global.button.confirm.label'));
        $("#datadishGB").append(ef.util.getLocale('cal.host.GB'));
        $("#adddiskvolume").textbox({
            onChange:function()
            {
                var newValue = $("#adddiskvolume").textbox('getValue');
                $("#adddiskslider").slider('setValue',newValue);
            }
        });
        $("#adddiskslider").slider({
            onChange: function (newValue,oldValue) {
                if(newValue>10||newValue==10){
                    $("#adddiskvolume").textbox('setValue',newValue);
                }
            }
        });
        $("#adddiskcancel").click(function () {
            ef.Dialog.closeAll();
        });
        //$("#adddiskokall").css('opacity',0.4);
        $("#adddiskokall").click(function () {
            if($("#adddiskokall").css("opacity")==1){
                var type = $("#Disk_type").combobox('getValue');
                var hostValue;
                if(!type||type=="默认"){type="";}
                var diskSize = $("#adddiskvolume").textbox('getValue');
                if(diskSize<10){ef.placard.warn('容量不能小于10！');return;}
                if(!$("#Disk_Name").textbox('isValid')||!$("#Disk_pro").textbox('isValid')||!$("#Disk_num").numberspinner('isValid')||!$("#adddiskvolume").textbox('isValid')){return;}
                if($(".host-disk").css('display')!="none"){
                    hostValue = $("#Disk_host").combobox('getValue');
                    if(!$("#Disk_host").combobox('isValid')){return;}
                }else{hostValue = "";}
                ef.loading.show();
                ef.getJSON({
                    url:api.getAPI("cal.disk"),
                    type:"put",//get,post,put,delete
                    isForce:true,
                    data:{
                        "des": $("#adddiskbackup").val(),
                        "displayname": $("#Disk_Name").textbox('getValue'),
                        "size": diskSize,
                        "volume_type": type.toLowerCase(),
                        "user_id": $("#Disk_user").combobox('getValue'),
                        "tenant_id": $("#Disk_pro").combobox('getValue'),
                        "num": Number($("#Disk_num").numberspinner('getValue')),
                        "host":hostValue
                    },
                    success:function(response) {
                        //disk.diskRef(false);
                        ef.nav.reload();
                        ef.loading.hide();
                        ef.Dialog.close('addDiskDialog');
                        ef.placard.doing(ef.util.getLocale("cal.disk.create.success.doing"));
                    },error: function (error) {
                        ef.loading.hide();
                    }
                });

            }
        });
            $(".textbox").keydown(function () {
                $("#adddiskokall").css('opacity',1);
            });
            $("#adddiskvolume").keydown(function () {
                $("#adddiskokall").css('opacity',1);

            });
            $(".slider").mousedown(function () {
                $("#adddiskokall").css('opacity',1);
            });
            $(".slider").mouseup(function () {
                $("#adddiskokall").css('opacity',1);
            });
            $("#adddiskbackup").keydown(function () {
                $("#adddiskokall").css('opacity',1);
            });
        };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
