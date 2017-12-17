/**
 * Created by admin on 2015/12/3.
 */
define(["module","api","cal.disk"],function (module,api,caldisk) {
    var implement=new ef.Interface.implement();
    implement.init = function () {
        $("#name").textbox({
            required:true,
            maxlength:15,
            minlength:1,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'
        });
    };

    implement.redraw= function () {
        implement.init();
        $("#diskbackup-name").before(ef.util.getLocale('host.comboxtoinput.name'));
        $("#diskeditbackup-des").append(ef.util.getLocale('setting.project.datagrid.remark')+'：');
       // $("#backupall").append(ef.util.getLocale('cal.disk.backup.all'));
        $("#backupadd").append(ef.util.getLocale('cal.disk.backup.add'));
        $("#disk_backup_ok").append(ef.util.getLocale('global.button.confirm.label'));
        $("#disk_backup_cancel").append(ef.util.getLocale('global.button.cancel.label'));
        $("#backup_ok").css("opacity",0.4);
        $("#disk_backup_cancel").click(function () {
            ef.Dialog.closeAll();
        });
        var _row = $("#gridtable").datagrid('getChecked');
        var diskId;
        $(_row).each(function (i,il) {
           diskId = il.id;
        });

        //$("#backup_ok").css("opacity",0.4);
       // function change() {
        // $("#backup_ok").css("opacity",1);
            $("#disk_backup_ok").click(function () {
                var name = $("#name").textbox("getValue");
                var remark = $(".disk_backup_area").val();
                // var backup=[];
                /* $('input:radio[name="backup_choose"]:checked').each(function(){
                 backup.push($(this).val());
                 });*/
                if(!$("#name").textbox('isValid')){
                    return;
                }
                else{
                    //ef.placard.info(ef.util.getLocale("cal.disk.backupCreating"));
                    ef.loading.show();
                    ef.getJSON(
                        {
                            url: api.getAPI("backupCreating"),
                            type: "put",//get,post,put,delete
                            useLocal:false,
                            data:{
                                "type":1,
                                "id": diskId,
                                "name": name,
                                "des": remark,
                                "volume_ids":[]
                            },
                            success: function (response) {
                                ef.loading.hide();
                                //caldisk.diskRef();
                                ef.nav.reload();
                                ef.Dialog.close("hostDetailbackup");
                                ef.Dialog.closeAll();
                                //ef.placard.tick(ef.util.getLocale("cal.disk.backupCreating.success"))
                                ef.placard.doing(ef.util.getLocale("cal.disk.backupCreating.success.doing"))
                            },
                            error: function (error) {
                                ef.loading.hide();
                                console.log(error);
                            }

                        })
                }
                //ef.Dialog.closeAll();
            });
     //   }

        $(".textbox").keydown(function () {
          //change();
            $("#backup_ok").css("opacity",1);
        /*    $("#disk_backup_ok").click(function () {
               *//* if(!$("#name").textbox('isValid')){
                    return;
                }*//*
                ef.Dialog.closeAll();
            });*/
        });
        $(".disk_backup_area").keydown(function () {
            //change();
            $("#backup_ok").css("opacity",1);
           /* $("#disk_backup_ok").click(function () {
             *//*   if(!$("#name").textbox('isValid')){
                    return;
                }*//*
                ef.Dialog.closeAll();
            });*/
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
