define(["domReady", "module", "setting.project", "api"], function (domReady, module, project, api) {
    var implement = new ef.Interface.implement();
    implement.okBtnOpacity = function () {
        if($("#name").textbox("getValue")){
            $("#hl_ok").css({"opacity":1});
        }else{
            $("#hl_ok").css({"opacity":0.4});
        }
    };
    implement.init = function () {
      $("#name").textbox({
          maxlength:15,
          required:true,
          width:197,
          height:30,
          validType: 'whitelist["0-9a-zA-Z_\u4E00-\u9FA5","中文,字母,下划线和数字"]',
          onChange:function(){implement.okBtnOpacity();}
      });
        $("#remark").textbox({
            maxlength:50,
            width:478,
            height:119,
            multiline:true
        })
    };
    implement.redraw = function () {
        domReady(function () {
            implement.init();
            $("#ok_btn").append(ef.util.getLocale("global.button.confirm.label"));//确定
            $("#lname").before(ef.util.getLocale("setting.project.datagrid.username"));//名称
            //$("#lcore").before(ef.util.getLocale("setting.project.detail.quota.corefield"));//核数
            //$("#lmemo").before(ef.util.getLocale("setting.project.detail.quota.memofield"));//内存
            //$("#ldisk").before(ef.util.getLocale("setting.project.detail.quota.diskfield"));//磁盘
            //$("#lbackup").before(ef.util.getLocale("setting.project.detail.quota.backfield"));//备份
            $("#lremark").before(ef.util.getLocale("setting.project.datagrid.remark")+"：");//备注
            //$(".project_unit").append(ef.util.getLocale("setting.project.detail.quota.ll.ge"));//个
            //$(".GB").append(ef.util.getLocale("setting.project.GB"));//GB
            //$(".addpro input[value]").append(ef.util.getLocale("setting.project.detail.quota.input.inputwu"));//无限制
            //$(".numberSpi").hide();
            //$(".check").click(function () {
            //    if ($(this).is(':checked')) {
            //        $(this).parent().next().hide();
            //        $(this).parent().next().next().show();
            //    }
            //    else {
            //        $(this).parent().next().show();
            //        $(this).parent().next().next().hide();
            //    }
            //});
            //$("#hl_ok").css("opacity",0.4);
            $('#pro-cancel').on('click',function(){
                ef.Dialog.close("settingaddPro");
            });
            $("#hl_ok").click(function () {
                if($("#hl_ok").css("opacity")==1){
                    if(!$("#name").textbox("isValid"))
                    {
                        ef.placard.warn("项目名称不合法");
                    }
                    ef.loading.show();
                    var quota = {cores:"", memory:"", disks:"", disk_capacity:"", backups:"", backup_capacity:""};
                    var arr = [];
                    for(i in quota){
                        var quotaOver={"quota_name":"","quota_limit":""};
                        quotaOver.quota_name=i;
                        if($("#"+i+"check").is(":checked")){
                            var memory = (Number($("#memory").numberspinner('getValue'))*Number(1024));
                            quotaOver.quota_limit=Number($(".addpro").find("#"+i).numberspinner('getValue'));
                            if(quotaOver.quota_name=="memory"){
                                quotaOver.quota_limit=memory;
                            }
                        }
                        else{
                            quotaOver.quota_limit=-1;
                        }
                        arr.push(quotaOver);
                    }
                    console.log(arr);
                    var name = $("#name").val();
                    var remark = $("#remark").val();
                    project.projectData(function (response) {
                        for (var i = 0; i < response.length; i++) {
                            var tenantname = response[i].name;
                            if (name == tenantname) {
                                ef.loading.hide();
                                ef.placard.warn(ef.util.getLocale("setting.project.validate.name.one"));
                                return;
                            }
                        }
                        if (!$("#name").textbox('isValid')) {
                            ef.loading.hide();
                        }
                        else {
                            ef.getJSON(
                                {
                                    url: api.getAPI("setting.project.datagrid_project"),
                                    type: "put",//get,post,put,delete
                                    data: {
                                        "name": name,
                                        "description": remark
                                    },
                                    success: function (response) {
                                        ef.loading.hide();
                                        ef.Dialog.close("settingaddPro");
                                        project.projectRef(true,function () {
                                            _iconmenu.setStatus("2", true);
                                        });
                                        ef.placard.tick(ef.util.getLocale("setting.project.placard.addpro"));
                                        $("#username").textbox('clear');
                                        //ef.getJSON(
                                        //    {
                                        //        url: api.getAPI("setting.project.datagrid_project") + "/" + response.id + "/quota",
                                        //        type: "post",//get,post,put,delete
                                        //        data: arr,
                                        //        success: function (resp) {
                                        //            ef.loading.hide();
                                        //            ef.Dialog.close("settingaddPro");
                                        //            project.projectRef(true,function () {
                                        //                _iconmenu.setStatus("2", true);
                                        //            });
                                        //            ef.placard.tick(ef.util.getLocale("setting.project.placard.addpro"));
                                        //            $("#username").textbox('clear');
                                        //        },
                                        //        error: function (error) {
                                        //            ef.loading.hide();
                                        //        }
                                        //    });
                                    },
                                    error:function()
                                    {
                                        ef.loading.hide();
                                    }
                                });
                        }
                    });
                }
            });
        });
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});