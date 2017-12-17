/**
 * Created by wangahui1 on 15/10/12.
 */
define("loginnew",["domReady","module","signature","api","user","setting.sysinfo"],function(domReady,module,signature,api,user,sysinfo)
{
    domReady(function()
    {
        if($.messager.defaults){
            $.messager.defaults.ok = '确认';
            $.messager.defaults.cancel = '取消';
        }
        $.parser.parse();
        ef.i18n.parse();
        var $username=$('#username').textbox({
            //required: true,
            width:180,
            height:28,
            value:""
        });
        var $password=$('#password').textbox({
            validType: 'minlength[8]',
            width:180,
            height:28,
            value:"",
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
                if(ef.status.logining)return;
                $(".login-submit-btn").click();
            }
        });
        $username.siblings().find("input.textbox-text").css(
            {
                "line-height":"1.5em"
            });
        $password.siblings().find("input.textbox-text").css(
            {
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
                    sysinfo.getEdition(function(editionResponse)
                    {
                        $(".login_copyright").html(editionResponse.copyright);
                        document.title=document.title+editionResponse.name;
                    });
                    $(".login-submit-btn").click(function()
                    {
                        if(ef.status.logining)return;
                        if(!$('#username').textbox('isValid')||!$('#username').textbox("getValue"))
                        {
                            ef.status.logining=true;
                            ef.messager.alert("reminding","用户名无效！",'warning',function()
                            {
                                ef.status.logining=false;
                            },function()
                            {
                                ef.status.logining=false;
                            });
                            return;
                        }
                        if(!$('#password').textbox('isValid')||!$('#password').textbox("getValue"))
                        {
                            ef.status.logining=true;
                            ef.messager.alert("reminding","密码无效！",'warning',function()
                            {
                                ef.status.logining=false;
                            },function()
                            {
                                ef.status.logining=false;
                            });
                            return;
                        }
                        ef.status.logining=true;
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
                                    ef.status.logining=false;
                                },
                                error:function(error)
                                {
                                    ef.loading.hide();
                                    var win=ef.messager.alert("reminding","用户名或密码不正确！",'warning',function(r)
                                    {
                                        console.log(r);
                                        ef.status.logining=false;
                                        $('#password').textbox("reset");
                                        console.log("clear");
                                        $password.siblings().find("input.textbox-text").val("");
                                        $password.siblings().find("input.textbox-text").focus();

                                    },function(r)
                                    {
                                        console.log(r);
                                        ef.status.logining=false;
                                        $('#password').textbox("reset");
                                        console.log("clear");
                                        $password.siblings().find("input.textbox-text").val("");
                                        $password.siblings().find("input.textbox-text").focus();

                                    });
                                }
                            });
                    });
                },
                error:function(err)
                {
                    ef.loading.hide();
                    ef.messager.alert("reminding", ef.util.getLocale("app.config.error.404"),"error",function () {
                        signature.signOut();
                    },function () {
                        signature.signOut();
                    });
                }
            });
        $(".wrapper-login").fadeIn("fast",function()
        {
            $(".login_cont_wrap").addClass("front");
        });

    });
});
