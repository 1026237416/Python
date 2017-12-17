define(["api","module","cal.host.hostDetail"],function (api,module,hostDetail) {
    var implement = new ef.Interface.implement();
    implement.redraw = function(){
        $("#hostDetail_delete_ok").append(ef.util.getLocale('global.button.confirm.label'));
        $("#hostDetail_delete_cancel").append(ef.util.getLocale('global.button.cancel.label'));
        $(".backupdelete-disk").append(ef.util.getLocale('cal.disk.delete'));
        $('.delete_checkAll').append(ef.util.getLocale('cal.host.delete.checkedall'));
        $(".deletealert").append(ef.util.getLocale('host.cal.host.hostDetail.messagerhi.confirmhost')+"'"+$(".data_name").text()+"'"+'?');
            $(".deletechoose").append('<input type="checkbox" id="deleteall" style="margin:0 5px 3px 0"><span>'+ef.util.getLocale('cal.host.delete')+'：</span>');
            var disk = ef.Dialog.getDialog('hostDetaildelete').param.attachData.disk;
            ef.getJSON({
                //url:api.getAPI("cal.disk")+"/server"+"/"+ef.localStorage.get("hostDetail_id"),
                //url:api.getAPI("getvnc")+"/"+ef.localStorage.get("hostDetail_id"),
                url: api.getAPI("cal.host.getHostlist") + "/" + ef.localStorage.get("hostDetail_id")+"/attach/volumes",
                type:"get",//get,post,put,delete
                isForce:true,
                success:function(response) {
                    var disk,capability;
                    ef.getJSON({
                        url: api.getAPI("cal.disk.datagrid"),
                        type: "get",//get,post,put,delete
                        isForce: true,
                        success: function (resp) {
                            $(response).each(function (i, il) {
                                    var  volumnid = il.volume_id;
                                    var disk = il.displayname;
                                    var capability = il.size + "GB";
                                    var _html = $(
                                        '<div class="host_disk" style="width: 250px;margin-bottom: 20px;">' +
                                            '<input class="backupcheck backupCheckSimple" name="test" type="checkbox" disabled style="margin:0 0 3px 0;border:1px solid lightgray"/>' +
                                            '<span class="host_disk_name"></span>' +
                                            '<span class="host_disk_capability" style="margin-left: 5px;"></span>' +
                                        '</div>'
                                    ).appendTo('.deletecho');
                                _html.find(".backupcheck").val(volumnid);
                                _html.find(".host_disk_name").data("diskData", disk);
                                _html.find(".host_disk_name").empty().text(disk);
                                _html.find(".host_disk_capability").empty().text(capability);
                                //$(resp).each(function (e, el) {
                                //    if (el.id == il.id) {
                                //        disk = el.displayname;
                                //        var id = el.id;
                                //        capability = el.size+"GB";
                                //
                                //    }
                                //});
                            });
                            $("#deleteall").click(function () {
                                var d = $('#deleteall').is(':checked');
                                if(d) {
                                    $('.backupcheck:checkbox').each(function() {
                                        $(this).removeAttr('disabled');
                                        $(this).css("border","1px solid #4DA4D6");
                                        //$(this).trigger("click");
                                    });
                                }
                                else
                                {
                                    $('.backupcheck:checkbox').each(function() {
                                        $(this).attr("disabled","disabled");
                                        $(this).css("border","1px solid lightgray");
                                        $(this).removeAttr("checked");
                                    });
                                }
                                $('.backupcheck.backupCheckSimple').click(function () {
                                    $(".checkbox_all").prop({checked:true});
                                    $('.backupcheck.backupCheckSimple').each(function (i,il) {
                                        if(!$(il).is(':checked')){
                                            $(".checkbox_all").prop({checked:false});
                                        }
                                    })
                                });
                                $('.checkbox_all').is('checked') ? $('.checkbox_all')[0].checked = false : $.noop();
                            });
                            $("#hostDetail_delete_ok").click(function () {
                                ef.loading.show();
                                ef.placard.doing(ef.util.getLocale('cal.host.delhost.placard'));
                                var deleteDisk = [];
                                deleteDisk.length=0;
                                $('input[name="test"]:checked').each(function(){
                                    deleteDisk.push($(this).val());
                                });
                                deleteDisk.splice(0,1);
                                hostDetail.deleteVm(deleteDisk);
                            });
                            $('.checkbox_all').click(function(){
                                $('.checkbox_all')[0].checked
                                    ? _.each($('.backupcheck'),function(il,i){
                                    il.checked = true
                                })
                                    : implement.clearChecked($('.backupcheck'))
                            })
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
            $("#hostDetail_delete_cancel").click(function () {
                ef.Dialog.closeAll();
            });
    };
    implement.clearChecked = function(data){
        !data[0].checked
        ?_.each(data,function(il,i){
            il.checked = false
        }): $.noop()
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});