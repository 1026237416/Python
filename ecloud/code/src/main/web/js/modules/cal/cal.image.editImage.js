/**
 * Created by hxf on 2016/8/22.
 */
define(["easyui","module","clientPaging","api","user"], function (easyui,module,client,api,user) {
    var implement = new ef.Interface.implement();
    var tenant =$("#mirrorlist").datagrid('getSelected');
    var minDisk = 1;
    if(tenant.min_disk_size>1){minDisk = tenant.min_disk_size;}
    implement.init = function () {
        var osData = [{text:'windows'},{text:'centos'},{text:'ubuntu'},{text:'redhat'},{text:'suse'},{text:'fedora'},{text:'debian'},{text:'neokylin'}];
        $("#editImageName").textbox({
            required:true,
            width: 220,
            height: 30,
            maxlength:15,
            value:tenant.name,
            onChange: function () {
                if($("#editImageOk").hasClass("ef-button-disabled")){
                    $("#editImageOk").removeClass("ef-button-disabled");
                }
            }
        });
        $("#editImageOs").combobox({
            required:true,
            width: 220,
            height: 30,
            value:tenant.os,
            data:osData,
            textField:'text',
            valueField:'text',
            onChange: function () {
                if($("#editImageOk").hasClass("ef-button-disabled")){
                    $("#editImageOk").removeClass("ef-button-disabled");
                }
            }
        });
        var driveData = [{text:"VirtIO",value:"virtio"},{text:"IDE",value:"ide"}];
        if(tenant.disk_bus){$("#editImageDrive").parent().show();}
        $("#editImageDrive").combobox({
            editable:false,
            width: 220,
            height: 30,
            value:tenant.disk_bus,
            data:driveData,
            textField:'text',
            valueField:'value',
            onChange: function () {
                if($("#editImageOk").hasClass("ef-button-disabled")){
                    $("#editImageOk").removeClass("ef-button-disabled");
                }
            }
        });
        $("#editImageRoot").textbox({
            width: 220,
            height: 30,
            value:tenant.super_user,
            onChange: function () {
                if($("#editImageOk").hasClass("ef-button-disabled")){
                    $("#editImageOk").removeClass("ef-button-disabled");
                }
            }
        });
        $("#editImagePwd").textbox({
            width: 205,
            height: 30,
            maxlength:15,
            value:tenant.super_user_pass,
            icons: [{
                iconCls:'icon-eye-close-all',
                iconAlign:"right",
                handler: function(e){
                    $("#editImagePwd").parent().hide();
                    $("a.icon-eye-close-all").show();
                    $("#editImagePwdHide").parent().show();
                }
            }],
            onChange: function (newValue,oldValue) {
                $("#editImagePwdHide").textbox('setValue',newValue);
                if(!$("#editImagePwd").textbox("getValue")){
                    $("#editImagePwd").removeAttr("icons");
                }
            }
        });
        $("#editImagePwdHide").textbox({
            width: 220,
            height: 30,
            maxlength:15,
            value:tenant.super_user_pass,
            icons: [{
                iconCls:'icon-eye',
                iconAlign:"right",
                handler: function(e){
                    $("#editImagePwd").parent().show();
                    $("#editImagePwdHide").parent().hide();
                }
            }],
            onChange: function (newValue,oldValue) {
                $("#editImagePwd").textbox('setValue',newValue);
                if(!$("#editImagePwdHide").textbox("getValue")){
                    $("#editImagePwdHide").removeAttr("icons");
                }
                if($("#editImageOk").hasClass("ef-button-disabled")){
                    $("#editImageOk").removeClass("ef-button-disabled");
                }
            }
        });
        $("#editImageMin").numberspinner({
            min:1,
            max:1000,
            required:true,
            width: 220,
            height: 30,
            value:tenant.min_disk,
            onChange: function () {
                if($("#editImageOk").hasClass("ef-button-disabled")){
                    $("#editImageOk").removeClass("ef-button-disabled");
                }
            }
        });
        $("#editImageDes").val(tenant.des);
        $("#editImageDes").keydown(function () {
            if($("#editImageOk").hasClass("ef-button-disabled")){
                $("#editImageOk").removeClass("ef-button-disabled");
            }
        });
    };
    implement.redraw = function () {
        implement.init();
        $("#editImageOk").click(function () {
            if(!$("#editImageName").textbox('isValid')||!$("#editImageOs").combobox('isValid')||!$("#editImageMin").numberspinner('isValid')){return;}
            if($("#editImageMin").numberspinner('getValue')<minDisk){ef.placard.warn("最小磁盘容量不能小于"+minDisk+"GB");return;}
            ef.loading.show();
            ef.getJSON({
                url:api.getAPI("imageOperate")+"/"+tenant.id,
                type:'post',
                data: { "name":$("#editImageName").textbox('getValue'),
                        "min_disk":Number($("#editImageMin").numberspinner('getValue')),
                        "os": $("#editImageOs").combobox('getValue'),
                        "super_user":$("#editImageRoot").textbox('getValue'),
                        "super_user_pass":$("#editImagePwd").textbox('getValue'),
                        "des":$("#editImageDes").val(),
                        "disk_bus":$("#editImageDrive").combobox('getValue')
                },
                success: function (response) {
                    ef.loading.hide();
                    ef.nav.reload();
                    ef.Dialog.closeAll();
                },
                error: function () {
                    ef.loading.hide();
                }
            });
        });
        $("#editImageCancel").click(function () {
           ef.Dialog.closeAll();
        });
    };
    return implement;
});