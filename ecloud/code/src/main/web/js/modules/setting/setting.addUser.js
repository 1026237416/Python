define(["setting.user", "api", "module", "domReady","setting.param"], function (settingUser, api, module, domReady,settingParam) {
    var implement = new ef.Interface.implement();
    implement.okBtnOpacity = function () {
      if($(".hl_ok_span").css("opacity")==0.4){
          $(".hl_ok_span").css({"opacity":1});
      }
    };
    implement.init = function () {
        $("#iusername").textbox({
            required: true,
            maxlength:15,
            validType: 'regx[/^(\\w{3,15})$/,"只能输入3-15位,字母,数字,下划线"]',
            onChange: function () {implement.okBtnOpacity();}
        });
        $("#name").textbox({
            maxlength:15,
            required: true,
            validType: 'whitelist["0-9a-zA-Z_\u4E00-\u9FA5","字母,中文,下划线和数字"]',
            onChange: function () {implement.okBtnOpacity();}
        });
        $("#email").textbox({
            maxlength:60,
            required: true,
            validType:'reg[/^([a-zA-Z0-9_\\.\\-])+\\@(([a-zA-Z0-9\\-])+\\.)+([a-zA-Z0-9]{2,4})+$/]',
            onChange: function () {implement.okBtnOpacity();}
        });
        $("#phone").textbox({
            maxlength:15,
            validType: 'whitelist["0-9-()+","数字，-，()和+"]',
            onChange: function () {implement.okBtnOpacity();}
        });
        $("#pwd").textbox({
            required:true,
            validType:'length[8,15]',
            invalidMessage:"密码长度8-15位",
            onChange: function () {implement.okBtnOpacity();}
        });
        $("#password").textbox({
            required:true,
            validType:'length[8,15]',
            invalidMessage:"密码长度8-15位",
            onChange: function () {implement.okBtnOpacity();}
        });
    };
    implement.redraw = function () {
        domReady(function () {
            implement.init();
            $(".hl_ok_span").css({"opacity":0.4});
            $("#user_ok_btn").append(ef.util.getLocale("global.button.confirm.label"));//确定
            $("#lusername").before(ef.util.getLocale("setting.user.datagrid.uid"));//用户名
            $("#lname").before(ef.util.getLocale("setting.user.datagrid.name"));//姓名
            $("#lemail").before(ef.util.getLocale("setting.user.datagrid.email"));//邮箱
            $("#lphone").before(ef.util.getLocale("setting.user.addhost.phone.des"));//电话
            $("#lpwd").before(ef.util.getLocale("setting.user.addhost.pwd"));
            $("#lpassword").before(ef.util.getLocale("setting.user.addhost.password"));

            $("#user-cancel").click(function () {
                ef.Dialog.closeAll();
            });
            $("#hl_ok").click(function () {
                if(!$("#iusername").textbox('isValid')|| !$("#name").textbox("isValid")||!$("#email").textbox("isValid")||!$("#phone").textbox("isValid")||!$("#pwd").textbox("isValid")||!$("#password").textbox("isValid")){return;}
                var input = $("#addUser").find('input');
                var username,name,email,phone,pwd,password;
                for (var i = 0; i < input.length; i++) {
                    username = input[0].value;
                    name = input[3].value;
                    email = input[6].value;
                    phone = input[9].value;
                    pwd = input[12].value;
                    password = input[15].value;
                }
                ef.loading.show();
                if(pwd==password){
                    ef.getJSON(
                        {
                            url: api.getAPI("setting.user.userlist"),
                            type: "put",//get,post,put,delete
                            isForce: true,
                            data: {
                                "name": username,
                                "displayname": name,
                                "phone": phone,
                                "email": email,
                                "security": 0,
                                "password":pwd

                            },
                            success: function (response) {
                                    ef.loading.hide();
                                    ef.Dialog.closeAll();
                                    ef.nav.reload();
                                    ef.placard.tick(ef.util.getLocale("setting.user.placard.createuser"));
                                    settingParam.getList(this.isForce,function(response)
                                    {
                                        var check=ef.util.find(response,function(record)
                                        {
                                            return record.name=="identify.send_password_mail";
                                        }).value;
                                        if(check==true){
                                            ef.placard.mail(ef.util.getLocale("setting.user.adduser.mail.tip") + email);
                                        }
                                    });
                            },
                            error: function () {
                                ef.loading.hide();
                            }
                        });
                }else{
                    ef.placard.warn(ef.util.getLocale("setting.user.validate.pwd.compare"));
                    ef.loading.hide();
                }
            })
        })
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});