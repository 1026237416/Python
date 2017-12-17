/**
 * Created by wangahui1 on 16/1/6.
 */
define(["module","domReady","api","setting.userDetail","user","signature"],function(module,domReady,api,userDetail,user,signature)
{
    var implement=new ef.Interface.implement();
    implement.isForce=true;
    implement.redraw=function()
    {
        ef.onComplete=function()
        {
            console.log("parse complete")
        };
        domReady(function()
        {
            console.log("dom ready");
            var $username=$('#username').validatebox({
                required: true
            });
            var $password=$('#password').validatebox({
                required: true
            });
            var timer=new ef.Timer(100,function()
            {
                $username.siblings().find("input.textbox-text").css(
                    {
                        "min-height":36,
                        "line-height":"20px"
                    });
                $password.siblings().find("input.textbox-text").css(
                    {
                        "min-height":36,
                        "line-height":"20px"
                    });
            },module.id);
            timer.start(1);
            $(".modify-submit-btn").click(function()
            {
                var _userVal=$('#username').textbox("getValue");
                var _passVal=$('#password').textbox("getValue");
                if(!$('#username').validatebox('isValid'))
                {
                    ef.placard.show(ef.util.getLocale("setting.password.input.invalid.usename"));
                    return;
                }
                if(!$('#password').validatebox('isValid'))
                {
                    ef.placard.show(ef.util.getLocale("setting.password.input.invalid.password"));
                    return;
                }
                if(_userVal!=user.getUsername())
                {
                    ef.placard.show(ef.util.getLocale("setting.password.modify.tip"));
                    return;
                }
                ef.loading.show();
                ef.getJSON(
                    {
                        url:api.getAPI("modify.password")+"/"+user.getId()+"/password",
                        type:"post",//get,post,put,delete,
                        isForce:implement.isForce,
                        data:
                        {
                            password:_passVal
                        },
                        success:function(response)
                        {
                            ef.loading.hide();
                            ef.placard.tick(ef.util.getLocale("setting.password.modify.success"));
                            $.messager.alert(ef.alert.warning,ef.util.getLocale("setting.password.modify.success.tip"),'info',function()
                            {
                                signature.signOut();
                            });
                        },
                        error:function(error)
                        {
                            ef.loading.hide();
                            ef.placard.warn(ef.util.getLocale("setting.password.modify.error")+error.msg);
                        }
                    });
            });
            $(".reset-submit-btn").click(function()
            {
                $.messager.confirm(ef.alert.warning,ef.util.getLocale("setting.password.reset.tip"),function(ok){
                    if(ok)
                    {
                        console.log("do");
                        ef.loading.show();
                        ef.getJSON(
                            {
                                url:api.getAPI("modify.password")+"/"+user.getId()+"/password/reset",
                                type:"post",
                                success:function(response)
                                {
                                    ef.loading.hide();
                                    ef.placard.tick(ef.util.getLocale("setting.password.reset.success"));
                                    $.messager.alert(ef.alert.warning,ef.util.getLocale("setting.password.reset.usename.label")+":"+response.user+"  "+ef.util.getLocale("setting.password.reset.password.label")+":"+response.pass,'info',function()
                                    {
                                        signature.signOut();
                                    });
                                },
                                error:function()
                                {
                                    ef.loading.hide();
                                }
                            });

                    }
                });
            });
        });

    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});