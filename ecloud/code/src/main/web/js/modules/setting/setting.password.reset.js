/**
 * Created by hanxf on 2016/3/1.
 */
/**
 * Created by wangahui1 on 15/11/6.
 */
define(["module","api","setting.param"],function(module,api,settingParam)
{
    var implement=new ef.Interface.implement();
    implement.cover=null;
    implement.setRandomPassword=function(isTrigger)
    {
        if(isTrigger)
        {
            $("#random").prop({checked:true});
        }
        $("#enterArea").textbox({disabled:true}).textbox('clear');
        $("#passSure").textbox({disabled:true}).textbox('clear');
        $("#enterArea").siblings().find("input.textbox-text").attr("type","text");
        $("#passSure").siblings().find("input.textbox-text").attr("type","text");

    };
    implement.setInputPassword=function(isTrigger)
    {
        if(isTrigger)
        {
            $("#enter").prop({checked:true});
        }
        $("#enterArea").textbox({disabled:false});
        $("#passSure").textbox({disabled:false});
    };
    implement.setRandomDisable=function()
    {
        $("#random").attr("disabled",true).prop({checked:false});
        $("#randomPwd").css({color:"lightgray"});
    };
    implement.redraw=function() {
        $(document).ready(function () {

            $("#cancel").text(ef.util.getLocale("global.button.cancel.label"));
            $("#ok").text(ef.util.getLocale("global.button.confirm.label"));
            $("#randomPwd").text(ef.util.getLocale("setting.random.pwd"));
            var pass=$("#enterArea").textbox({
                required:true,
                //validType: 'minlength[8]',
                maxlength:15,
                validType: 'regx[/^[a-z0-9_]{8,15}$/,"只能输入数字,字母和下划线"]',
                tipPosition:"bottom",
                trackMouse:true,
                prompt: ef.util.getLocale("setting.password.reset.password.title"),
                onChange:function()
                {
                    var txt=arguments[1];
                    $(this).siblings().find("input.textbox-text").attr("type","password");
                    if(!txt.length)
                    {
                        $(this).siblings().find("input.textbox-text")[0].setSelectionRange(1,1);
                    }
                }
            });
            var pass_sure=$("#passSure").textbox({
                required:true,
                //validType: 'minlength[8]',
                maxlength:15,
                validType: 'regx[/^[a-z0-9_]{8,15}$/,"只能输入数字,字母和下划线"]',
                tipPosition:"bottom",
                trackMouse:true,
                prompt: ef.util.getLocale("setting.password.reset.password.sure.title"),
                onChange:function()
                {
                    var txt=arguments[1];
                    $(this).siblings().find("input.textbox-text").attr("type","password");
                    if(!txt.length)
                    {
                        $(this).siblings().find("input.textbox-text")[0].setSelectionRange(1,1);
                    }
                }
            });
            pass.siblings().find("input.textbox-text").blur(function()
            {
                if($(this).val()!=$(this).attr("placeholder"))
                {
                    return;
                }
                $(this).attr("type","text");
            });
            pass_sure.siblings().find("input.textbox-text").blur(function()
            {
                if($(this).val()!=$(this).attr("placeholder"))
                {
                    return;
                }
                $(this).attr("type","text");
            });
            $("#random").click(function () {
               if($(this).is(":checked")){
                   implement.setRandomPassword();
               }
            });
            $("#enter").click(function () {
                if($(this).is(":checked")){
                    implement.setInputPassword();
                }
            });
            $("#ok").click(function () {
                var pwd = $("#enterArea").textbox('getValue');
                var pwdSure = $("#passSure").textbox('getValue');
                if($("#enter").is(":checked")&&!$("#enterArea").textbox('isValid')||$("#random").is(":checked")&&!$("#enterArea").textbox('isValid')){
                    return;
                }
                if(pwd!=pwdSure){
                    ef.placard.warn(ef.util.getLocale("setting.password.two.sure"));
                }
                else{
                    ef.getJSON({
                        url:api.getAPI("modify.password")+"/"+ef.localStorage.get("userDetail.id")+"/password/reset",
                        type:"post",
                        data:{"password":pwd},
                        success: function () {
                            ef.Dialog.closeAll();
                            ef.placard.tick(ef.util.getLocale("setting.user.placard.setpwd"));
                        }
                    })
                }
            });
            $("#cancel").click(function () {
                ef.Dialog.closeAll();
            });
            settingParam.getList(this.isForce,function(response)
            {
                var check=ef.util.find(response,function(record)
                {
                    return record.name=="identify.send_password_mail";
                }).value;
                if(check==true){
                    implement.setRandomPassword(true);
                }
                else{
                    implement.setRandomDisable();
                    implement.setInputPassword(true);

                }
                implement.cover.hide();
            });
            implement.cover=$(".pass_reset_box").coverlayer({loadingHeight:200});
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
