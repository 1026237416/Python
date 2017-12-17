/**
 * Created by hxf on 2016/8/16.
 */
define(["easyui","module","clientPaging","api","user"],function (easyui,module,client,api,user) {
    var implement=new ef.Interface.implement();
    implement.init = function () {
        $("#imageName").textbox({
            required:true,
            maxlength:15,
            width: 220,
            height: 30,
            onChange: function () {
                if($("#image_ok_btn").hasClass("ef-button-disabled")){
                    $("#image_ok_btn").removeClass("ef-button-disabled");
                }
            }
        });
        $("#imageType").combobox({
            editable:false,
            required:true,
            width: 220,
            height: 30,
            textField:'text',
            valueField:'value',
            data:[{text:"通用",value:"0"},{text:"应用",value:"1"}],
            onChange: function () {
                if($("#image_ok_btn").hasClass("ef-button-disabled")){
                    $("#image_ok_btn").removeClass("ef-button-disabled");
                }
            }
        });
        var osData = [{text:'windows'},{text:'centos'},{text:'ubuntu'},{text:'redhat'},{text:'suse'},{text:'fedora'},{text:'debian'},{text:'neokylin'}];
        $("#imageOs").combobox({
            editable:false,
            required:true,
            width: 220,
            height: 30,
            textField:'text',
            valueField:'text',
            data:osData,
            onChange: function () {
                if($("#image_ok_btn").hasClass("ef-button-disabled")){
                    $("#image_ok_btn").removeClass("ef-button-disabled");
                }
            }
        });
        $("#imageSource").combobox({
            editable:false,
            required:true,
            width: 220,
            height: 30,
            data:[{text:"镜像文件",value:'file'},{text:"镜像地址",value:'url'}],
            textField:'text',
            valueField:'value',
            value:'file',
            onChange: function (newValue) {
                if(newValue=='file'){$("#addImageFile").show();$("#addImageUrl").hide();}
                if(newValue=='url'){$("#addImageFile").hide();$("#addImageUrl").show();}
            }
        });
        $("#imageUrl").textbox({
            required:true,
            width: 215,
            height: 30,
            validType: 'regx[/^(http):\\/\\/[\\w\\-_]+(\\.[\\w\\-_]+)+([\\w\\-\\.,@?^=%&amp;:/~\\+#]*[\\w\\-\\@?^=%&amp;/~\\+#])?$/,"e.g. http://10.10.132.1"]',
            onChange: function () {
                if($("#image_ok_btn").hasClass("ef-button-disabled")){
                    $("#image_ok_btn").removeClass("ef-button-disabled");
                }
            }
        });
        var formatData = [{text:'QCOW2',value:'qcow2'},{text:'ISO',value:'iso'}];
        $("#imageFormat").combobox({
            editable:false,
            required:true,
            width: 220,
            height: 30,
            textField:'text',
            valueField:'value',
            data:formatData,
            onChange: function (newValue) {
                //if(newValue=="iso"){
                //    $("#imageDrive").parent().show();
                //}else{$("#imageDrive").parent().hide();}
                if($("#image_ok_btn").hasClass("ef-button-disabled")){
                    $("#image_ok_btn").removeClass("ef-button-disabled");
                }
            }
        });
        var driveData = [{text:"VirtIO",value:"virtio"},{text:"IDE",value:"ide"}];
        $("#imageDrive").combobox({
            editable:false,
            required:true,
            width: 215,
            height: 30,
            value:'virtio',
            data:driveData,
            textField:'text',
            valueField:'value'
        });
        $("#imageGb").numberspinner({
            min:1,
            max:1000,
            required:true,
            width: 220,
            height: 30,
            onChange: function () {
                if($("#image_ok_btn").hasClass("ef-button-disabled")){
                    $("#image_ok_btn").removeClass("ef-button-disabled");
                }
            }
        });
        $("#imageFile").keydown(function () {
            if($("#image_ok_btn").hasClass("ef-button-disabled")){
                $("#image_ok_btn").removeClass("ef-button-disabled");
            }
        });
        $("#imageBack").keydown(function () {
            if($("#image_ok_btn").hasClass("ef-button-disabled")){
                $("#image_ok_btn").removeClass("ef-button-disabled");
            }
        });
    };
    implement.addInter = function (data) {
        ef.loading.show();
        ef.getJSON({
            url:api.getAPI("imageOperate"),
            type:'put',
            data:data,
            success: function () {
                ef.loading.hide();
                ef.nav.reload();
                ef.Dialog.closeAll();
            },
            error: function () {
                ef.loading.hide();
            }
        });
    };
    implement.redraw = function () {
        implement.init();
        var sliceUpload = $("#imageFile").sliceUpload({
            url:api.getAPI("image.upload"),
            isTrigger:false
        });
        sliceUpload.change(function (data) {
            $("#imageFormat").combobox('clear');
            if(data.toLowerCase()=="img"){data="qcow2";}
            if(data.toLowerCase()=="qcow2"||data.toLowerCase()=="iso"){
                $("#imageFormat").combobox('setValue',data);
            }
        });
        $("#image_ok_btn").click(function () {
            if(!$("#imageName").textbox('isValid')||!$("#imageType").combobox('isValid')||!$("#imageOs").combobox('isValid')||!$("#imageSource").combobox('isValid')||!$("#imageFormat").combobox('isValid')||!$("#imageGb").numberspinner('isValid')){
                    return;
            }
            var disk_bus, source = $("#imageSource").combobox('getValue');
            var format = $("#imageFormat").combobox('getValue');
            disk_bus = $("#imageDrive").combobox('getValue');
            //if(format=="iso"){}
            //else{disk_bus = "";}
            if(source=="url"){
                if(!$("#imageUrl").textbox('isValid')){return;}
                var postData = {
                    name:$("#imageName").textbox('getValue'),
                    type:Number($("#imageType").combobox('getValue')),
                    os:$("#imageOs").combobox('getValue'),
                    disk_format:($("#imageFormat").combobox('getValue')).toLowerCase(),
                    min_disk:Number($("#imageGb").numberspinner('getValue')),
                    des:$("#imageBack").val(),
                    disk_bus:disk_bus,
                    url:$("#imageUrl").textbox('getValue')
                };
                implement.addInter(postData);
            }
            if(source=="file"){
                if($(".fileUpload")[0].value==null||$(".fileUpload")[0].value==""){ return; }
                var dom = $("<div class='addImageFloat'><span class='addImageFloat-text'></span></div><div class='addImageFloat-loading'></div>");
                $(document.body).append(dom);
                var load = $('.addImageFloat-loading').uploadLoading();
                dom.find('.addImageFloat-text').text("镜像上传中...(0%)");
                sliceUpload.uploadClick(function (data,num) {
                    dom.find('.addImageFloat-text').text("镜像上传中...("+num+"%)");
                    load.setValue(num);
                    console.log(num);
                    if(data.result.last){
                        dom.remove();
                        var postData = {
                            name:$("#imageName").textbox('getValue'),
                            type:Number($("#imageType").combobox('getValue')),
                            os:$("#imageOs").combobox('getValue'),
                            disk_format:($("#imageFormat").combobox('getValue')).toLowerCase(),
                            min_disk:Number($("#imageGb").numberspinner('getValue')),
                            des:$("#imageBack").val(),
                            disk_bus:disk_bus,
                            filename:data.result.filename
                        };
                        implement.addInter(postData);
                    }
                }, function () {
                    dom.remove();
                });
            }
        });
        $("#image-cancel").click(function () {
            ef.Dialog.closeAll();
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});