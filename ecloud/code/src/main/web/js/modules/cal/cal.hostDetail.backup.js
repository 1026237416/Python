/**
 * Created by 韩雪飞 on 2015/12/1.
 */
define(["api","user","module"],function (api,user,module) {
    var implement = new ef.Interface.implement();
    implement.text=function(){
        $("#name").textbox({
            required:true,
            maxlength:15,
            minlength:1,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","字母,中文,数字,下划线和中划线"]'
        });

    };
    implement.redraw = function(){
        implement.text();
        $("#hostDetail-backup-name").before(ef.util.getLocale('host.comboxtoinput.name'));
        $("#hostDetail-backup-des").append(ef.util.getLocale('setting.project.datagrid.remark')+'：');
        $("#hostDetail-backup-disk").after(ef.util.getLocale('cal.disk.backup.disk'));
        $("#addhostbackup_cancel").append(ef.util.getLocale('global.button.cancel.label'));
        $("#addhostbackup_ok").append(ef.util.getLocale('global.button.confirm.label'));

        var _html;
        $("#ok").css("opacity",0.4);
        $(".backupdisk").css("display","none");
        var disk=ef.Dialog.getDialog("hostDetailbackup").param.attachData.disk;
        if($(".data_disk .host_disk_name").text().length!=0){
            $(".water-mark").css("display","none");
            $(".backupdisk").css("display","block");
            var id=ef.localStorage.get("hostDetail_id");
            ef.getJSON({
                        url: api.getAPI("cal.host.getHostlist") + "/" +id+"/attach/volumes",
                        type: "get",//get,post,put,delete
                        isForce: true,
                        success: function (response) {
                            var disk, capability;
                                $(response).each(function (e, el) {
                                        disk = el.displayname;
                                        var id = el.volume_id;
                                        capability = el.size + "GB";
                                        var _html = $('<div class="host_disk">' +
                                            '<input class="backupcheck backupCheckSimple" name="test" type="checkbox" disabled style="margin:0 0 3px 0;border:1px solid lightgray"/>' +
                                            '<span class="host_disk_name"></span>' +
                                            '<span class="host_disk_capability" style="margin-left: 5px;height:17px;"></span>' +
                                            '</div>').appendTo('#backupdisk');
                                        _html.find(".backupcheck").val(id);
                                        _html.find(".host_disk_name").data("diskData", disk);
                                        _html.find(".host_disk_name").empty().text(disk);
                                        _html.find(".host_disk_capability").empty().text(capability);
                               });
                        },
                        error: function (error) {
                            console.log(error);
                        }
                    });
                }
            $("#addhostbackup_ok").click(function () {
                var backup=[];
                $('input[name="test"]:checked').each(function(){
                    if($(this).val()!="all"){
                        backup.push($(this).val());
                    }
                });
                var name = $("#name").textbox("getValue");
                var remark = $(".remarktextarea").val();
                if (!$("#name").textbox('isValid')){
                    return;
                }
                else{
                    ef.loading.show();
                    ef.getJSON(
                        {
                            url: api.getAPI("backupCreating"),
                            type: "put",//get,post,put,delete
                            useLocal:false,
                            data: {
                                "type":0,
                                "id":ef.localStorage.get("hostDetail_id"),
                                "name": name,
                                "des": remark,
                                 "volume_ids":backup
                            },
                            success: function (response) {
                                ef.loading.hide();
                                ef.Dialog.close("hostDetailbackup");
                                ef.Dialog.closeAll();
                                ef.placard.doing(ef.util.getLocale("cal.vm.backupCreating.success.doing"))
                            },
                            error: function (error) {
                                ef.loading.hide();
                                console.log(error);
                            }
                        })
                }
               _html=null;
            });
        $(".backupdiskall").click(function () {
            $("#ok").css("opacity",1);
            var d = $('.backupdiskall').is(':checked');
            if(d) {
                $('.backupcheck:checkbox').each(function() {
                    $(this).removeAttr('disabled');
                    $(this).css("border","1px solid #4DA4D6");
                });

            }else{
                $('.backupcheck:checkbox').each(function() {
                    $(this).removeAttr("checked","checked");
                    $(this).attr("disabled","disabled");
                    $(this).css("border","1px solid lightgray");
                });
            }
            $('.backupcheck.backupCheckSimple').click(function () {
                $("#backupDiskCheckAll").prop({checked:true});
                $('.backupCheckSimple:checkbox').each(function (i,il) {
                    if(!$(il).is(':checked')){
                        $("#backupDiskCheckAll").prop({checked:false});
                    }
                })
            });
        });
        $("#backupDiskCheckAll").click(function () {
            var d = $('#backupDiskCheckAll').is(':checked');
            if(d) {
                $('.backupcheck:checkbox').each(function() {
                    $(this).prop({checked:true});
                });
            }else{
                $('.backupcheck:checkbox').each(function() {
                    $(this).prop({checked:false});
                });
            }
        });
        $(".textbox").keydown(function () {
            $("#ok").css("opacity",1);
        });
        $(".backupcheck").click(function () {
            $("#ok").css("opacity",1);
        });
        $(".remarktextarea").keydown(function () {
            $("#ok").css("opacity",1);
        });
        $("#addhostbackup_cancel").click(function () {
            ef.Dialog.closeAll();
            _html=null;
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
