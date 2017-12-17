/**
 * Created by wangahui1 on 15/10/12.
 */
define("login",["domReady","module","signature","api","user","setting.sysinfo"],function(domReady,module,signature,api,user,sysinfo)
{
    domReady(function()
    {
        $.parser.parse();
        ef.i18n.parse();
        var $username=$('#username').textbox({
            required: true
        });
        var $password=$('#password').textbox({
            required: true,
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
        $(document.body).keydown(function(event)
        {
            if(event.keyCode==13)
            {
                $(".login-submit-btn").click();
            }
        });
        $username.siblings().find("input.textbox-text").css(
            {
                "min-height":36,
                "line-height":"1.5em"
            });
        $password.siblings().find("input.textbox-text").css(
            {
                "min-height":36,
                "line-height":"1.5em"
            }).attr("type","text");
        $password.siblings().find("input.textbox-text").blur(function()
        {
            if($(this).val()!=$(this).attr("placeholder"))
            {
                return;
            }
            $(this).attr("type","text");
        });
        $(require.root).resize(function()
        {
            var h=$(this).height();
            if(h>620)
            {
                $(".login_bottom").addClass("login_bottom_out");
                $(".login_content").height(h-120-50);
            }else
            {
                $(".login_bottom").removeClass("login_bottom_out");
                $(".login_content").removeAttr("style");
            }
            if($(".login_content").height()<=450)
            {
                $(".login_cont").addClass("login_cont_in");
            }else
            {
                $(".login_cont").removeClass("login_cont_in");
            }

        }).resize();
        ef.getJSON(
            {
                url:"data/config.json",
                dataType: 'json',
                useLocal:true,
                success:function(response)
                {
                    ef.sessionStorage.put("module",response.module);
                    ef.config.webroot=response.webroot;
                    api.parse();
                    sysinfo.getEdition(function(editonResponse)
                    {
                        $(".login_copyright").html(editonResponse.copyright);
                        document.title=document.title+editonResponse.name;
                    });
                    $(".login-submit-btn").click(function()
                    {
                        if(ef.status.logining)return;
                        ef.status.logining=true;
                        if(!$('#username').textbox('isValid'))
                        {
                            $.messager.alert(ef.alert.warning,"用户名无效！",'warning',function()
                            {
                                ef.status.logining=false;
                            });
                            return;
                        }
                        if(!$('#password').textbox('isValid'))
                        {
                            $.messager.alert(ef.alert.warning,"密码无效！",'warning',function()
                            {
                                ef.status.logining=false;
                            });
                            return;
                        }
                        var _userVal=$('#username').textbox("getValue");
                        var _passVal=$('#password').textbox("getValue");
                        function isRight(userVal,passVal,response)
                        {
                            var _right=null;
                            $(response).each(function(i,il)
                            {
                                if(userVal==il.username&&passVal==il.password)
                                {
                                    _right=il;

                                }
                            });
                            return _right;
                        }
                        ef.loading.show();
                        var isForce=true;
                        ef.getJSON(
                            {
                                url:api.getAPI("login"),
                                type:"post",//get,post,put,delete,
                                isForce:isForce,
                                noPlacard:true,
                                noRandomUrl:true,
                                data:
                                {
                                    name:_userVal,
                                    password:_passVal
                                },
                                success:function(response)
                                {
                                    ef.loading.hide();
                                    if(ef.config.isServer||isForce)
                                    {
                                        signature.signIn(response);
                                    }else
                                    {
                                        signature.signIn(isRight(_userVal,_passVal,response));
                                    }
                                },
                                error:function(error)
                                {
                                    ef.loading.hide();
                                    $.messager.alert(ef.alert.warning,"用户名或密码不正确！",'warning',function()
                                    {
                                        ef.status.logining=false;
                                        $('#password').textbox("clear");

                                    });
                                }
                            });
                    });

                },
                error:function(err)
                {
                    ef.loading.hide();
                    $.messager.alert(ef.alert.warning, ef.util.getLocale("app.config.error.404"),"error",function () {
                        signature.signOut();
                    });
                }
            });
        $(".login-right").css({right:"-600px"});
        $(".login-right").animate({
            right: 0, opacity: 'show'
        }, 500,function()
        {
            $(".login-left").fadeIn("slow");
        });

    });
});
