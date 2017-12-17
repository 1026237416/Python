define(['easyui',"module","api","cal.disk"],function (easyui,module,api,disk) {
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
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'
        });
    };
    implement.redraw=function(){
        implement.il8();
        implement.init();
        var data = $("#gridtable").datagrid('getChecked');
        var index,dataId;
        $(data).each(function (i,el) {
            dataId=el.id;
            $("#diskeditname").empty().textbox('setValue',el.displayname);
            $("#diskeditbackup").empty().val(el.des);
           index = $("#gridtable").datagrid('getRowIndex',el);//某一行行号
        });
            $("#edit_ok").css("opacity",0.4);//确定按钮
            $("#disk_ok").click(function () {
                var newname = $("#diskeditname").textbox('getValue');
                var newbackup = $("#diskeditbackup").val();
                if($("#edit_ok").css("opacity")==1){
                    if(!$("#diskeditname").textbox('isValid')){
                        return;
                    }
                    ef.getJSON({
                        url: api.getAPI("cal.disk")+"/"+dataId,
                        type:"post",
                        isForce:"true",
                        data:{
                            'displayname':newname,//用后台字段
                            'des':newbackup
                        },
                        success:function(response){
                            disk.diskRef(false);//不是第一次刷新列表
                            $.parser.parse(".menuBound");
                            //disk有接口
                            $(".menuBound .menu_txt").hover(function()
                            {
                                var id="#"+$(this).attr("relation");
                                var gridid = $(this).attr("gridid");
                                disk.hostGrid(gridid,id);//disk
                            });
                            ef.Dialog.closeAll();
                        },
                        error:function(error){
                            console.log(error);
                        }
                    });
                }
            });
        $(".textbox").keydown(function () {
            $("#edit_ok").css("opacity",1);
        });
        $("#diskeditbackup").keydown(function () {
            $("#edit_ok").css("opacity",1);
        });
        $("#disk_cancel").click(function () {
            ef.Dialog.closeAll();
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});