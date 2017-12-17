/**
 * Created by Administrator on 2016/3/10.
 */
define(['easyui',"module","api","cal.backup"],function (easyui,module,api,backup) {
    var implement=new ef.Interface.implement();
    implement.il8 = function(){
        $("#editdiskname").before(ef.util.getLocale('setting.userdetail.datagrid.name'));
        $("#editdiskbackup").append(ef.util.getLocale('setting.project.detail.description.remarkfield')+'：');
        $("#editdisk_cancel").append(ef.util.getLocale('global.button.cancel.label'));
        $("#editdisk_ok").append(ef.util.getLocale('global.button.confirm.label'));
    };
    implement.init = function () {
        $("#diskeditname").textbox({
            required:true,
            maxlength:15,
            minlength:1,
            validType:'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'
        });
    };
    implement.redraw=function() {
        implement.il8();
        implement.init();
        $("#edit_ok").css("opacity", 0.4);
        //backup.refreshBackup(data);
        //  ef.util.ready(function (dom) {
        //  var _data = ef.util.getCrossData(dom);
        // backupdatil.refreshBackup();
       // console.log(_data.id);
        //var data =$("#hostbackup").datagrid('getChecked');
        /// var dataId;
        //云主机
        //$(data).each(function (i,el) {
        // dataId=el.id;
        /* $("#diskeditname").empty().textbox('setValue', _data.title);
         $("#diskeditbackup").empty().val(_data.des);*/
        //});
        //确定按钮
        /*   $("#disk_ok").click(function () {
         var newname = $("#diskeditname").textbox('getValue');
         var newbackup = $("#diskeditbackup").val();
         if ($("#edit_ok").css("opacity") == 1) {
         if (!$("#diskeditname").textbox('isValid')) {
         return;
         }
         ef.getJSON({
         url: api.getAPI("backupCreating") + "/update/" + _data.id,
         type: "post",
         isForce: "true",
         data: {
         'name': newname,
         'description': newbackup
         },
         success: function (response) {
         // backup1.backupData(false);
         backup.getBackupData(type, id);
         // $.parser.parse(".menuBound");
         ef.Dialog.closeAll();
         },
         error: function (error) {
         console.log(error);
         }
         });
         }
         });*/
        $(".textbox").keydown(function () {
            $("#edit_ok").css("opacity", 1);
        });
        $("#diskeditbackup").keydown(function () {
            $("#edit_ok").css("opacity", 1);
        });
        $("#disk_cancel").click(function () {
            ef.Dialog.closeAll();
        });

        //  });
        // }
    }
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});