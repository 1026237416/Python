/**
 * Created by wangahui1 on 15/11/6.
 * 运行的主app
 */
define("app",["module","exports","easyui.lang.zh"],function (module,exports) {
    require(["api", "locale", "domReady", "signature", "user","idle", "easyui.lang.zh","security"], function (api, locale, domReady, signature, user,idle,zh,security) {
        $(window).scroll(function()
        {
            $(".tooltip").hide();
        });
        exports.getLicense=function(success,error)
        {
            ef.getJSON(
                {
                    url:api.getAPI("sysInfo"),
                    type:"GET",
                    success:success,
                    error:error|| $.noop
                });
        };
        exports.getParam=function(success,error)
        {
            ef.getJSON(
                {
                    url:api.getAPI("global.param"),
                    type:"GET",
                    success:success,
                    error:error|| $.noop
                });
        };
        exports.getLicenseMenu=function(success)
        {
            ef.getJSON(
                {
                    url:"data/license.json",
                    type:"GET",
                    useLocal:true,
                    success:success
                });
        };
        exports.createNav=function()
        {
            $(".left-nav-cont").nav(ef.menuData, function (module, lastModule) {
                $(".tooltip").hide();
                require.undef(module);
                ef.Timer.destoryAllHasModule();
                ef.server.Socket.closeAll();
                $('#js-menus-wrapper').empty();
                ef.breadcrumbs.render(module, lastModule,ef.menuData);
                if (lastModule) {
                    require.undef(lastModule);
                }
                require([module,"easyui.lang.zh"], function (impl) {
                    if (!impl)return;
                    if(! impl instanceof ef.Interface)
                    {
                        throw new Error(ef.Interface.error);
                    }
                    if ($.parser) {
                        impl.redraw();
                        $.parser.parse(".right-entity");
                        ef.i18n.parse();
                        require("easyui.lang.zh");
                    }
                });
            },function(module,lastModule)
            {
                ef.Timer.destoryAllHasModule();
            });
        };
        exports.addListener=function()
        {
            ef.event.on("sysinfo.success",function()
            {
               exports.createNav();
            });
        };
        /**初始化*/
        exports.init=function()
        {
            $.parser.parse(".right-info");
            ef.getJSON(
                {
                    url:"assets/copyright.json",
                    dataType: 'json',
                    useLocal:true,
                    success:function(copyResponse){
                        document.title=document.title+copyResponse.name;
                    }
                });
            this.addListener();
            this.international();
            $(".right-info-role").text(user.getRole().label);
            $(".right-info-name").text(user.getDisplayname());
            /*$(".logout").tooltip({content: ef.util.getLocale("app.btn.quit.title")});
            $(".key-icon").tooltip({content:ef.util.getLocale("app.btn.key.title")});*/
            ef.util.resize(function () {
                var _eh=($(".expire-time-wrapper").is(":visible")?$(".expire-time-wrapper").height():0)||0;
                var _h = $(this).height();
                var _w = $(this).width();
                $(".right-entity").width(_w - $(".left-nav").width());
                $(".right-entity").height(_h - $(".right-header").height()-_eh-39);
                $(".left-nav-cont").height(_h - $(".logo").height()-_eh-39);
                $("#js-menus-wrapper").width(document.documentElement.clientWidth-$(".left-nav").width());
            }).resize();
            var origin_pass=$("#change_origin_pass").textbox(
                {
                    width:120,
                    height:30,
                    prompt:ef.util.getLocale("app.password.origin.tip"),
                    type:"text",
                    validType: 'minlength[8]',
                    maxlength:15,
                    tipPosition:"bottom",
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
            var new_pass=$("#change_new_pass").textbox(
                {
                    width:120,
                    height:30,
                    prompt:ef.util.getLocale("app.password.new.tip"),
                    type:"text",
                    validType: 'minlength[8]',
                    maxlength:15,
                    tipPosition:"bottom",
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
            var renew_pass=$("#change_renew_pass").textbox(
                {
                    width:120,
                    height:30,
                    prompt:ef.util.getLocale("app.password.renew.tip"),
                    type:"text",
                    validType: 'minlength[8]',
                    maxlength:15,
                    tipPosition:"bottom",
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
            origin_pass.siblings().find("input.textbox-text").blur(function()
            {
                if($(this).val()!=$(this).attr("placeholder"))
                {
                    return;
                }
                $(this).attr("type","text");
            });
            new_pass.siblings().find("input.textbox-text").blur(function()
            {
                if($(this).val()!=$(this).attr("placeholder"))
                {
                    return;
                }
                $(this).attr("type","text");
            });
            renew_pass.siblings().find("input.textbox-text").blur(function()
            {
                if($(this).val()!=$(this).attr("placeholder"))
                {
                    return;
                }
                $(this).attr("type","text");
            });

            $(".reset-pass").click(function()
            {
                $(".right-info-pass").show();
                $(".right-content-wrapper").hide();
            });
            $(".icon-white-wrong").click(function()
            {
                $('.right-content-wrapper').show();
                $("#change_origin_pass").textbox('reset');
                $("#change_new_pass").textbox('reset');
                $("#change_renew_pass").textbox('reset');
                $(".right-info-pass").hide();
                origin_pass.siblings().find("input.textbox-text").attr("type","text");
                new_pass.siblings().find("input.textbox-text").attr("type","text");
                renew_pass.siblings().find("input.textbox-text").attr("type","text");
                $(".right-info").removeAttr("style");
            });
            $(".icon-white-tick").click(function()
            {
                var orig_pwd=$("#change_origin_pass").textbox("getValue");
                var new_pwd=$("#change_new_pass").textbox("getValue");
                var renew_pwd=$("#change_renew_pass").textbox("getValue");
                if(!orig_pwd.length)
                {
                    ef.placard.warn(ef.util.getLocale("app.password.modify.error.origin.empty"));
                    return;
                }
                if(!$('#change_origin_pass').textbox('isValid'))
                {
                    ef.placard.warn(ef.util.getLocale("app.password.modify.error.origin.invalid"));
                    return;
                }
                if(!new_pwd.length)
                {
                    ef.placard.warn(ef.util.getLocale("app.password.modify.error.new.empty"));
                    return;
                }
                if(!renew_pwd.length)
                {
                    ef.placard.warn(ef.util.getLocale("app.password.modify.error.renew.empty"));
                    return;
                }
                if(!$('#change_new_pass').textbox('isValid'))
                {
                    ef.placard.warn(ef.util.getLocale("app.password.modify.error.new.invalid"));
                    return;
                }
                if(!$('#change_renew_pass').textbox('isValid'))
                {
                    ef.placard.warn(ef.util.getLocale("app.password.modify.error.renew.invalid"));
                    return;
                }
                if(new_pwd!=renew_pwd)
                {
                    ef.placard.warn(ef.util.getLocale("app.password.modify.error.diff.invalid"));
                    return;
                }
                if(new_pwd==orig_pwd)
                {
                    ef.placard.warn(ef.util.getLocale("app.password.modify.error.equal"));
                    return;
                }
                exports.modifyPassword(orig_pwd,new_pwd);
                $("#change_origin_pass").textbox("reset");
                $("#change_new_pass").textbox("reset");
                $("#change_renew_pass").textbox("reset");
                origin_pass.siblings().find("input.textbox-text").attr("type","text");
                new_pass.siblings().find("input.textbox-text").attr("type","text");
                renew_pass.siblings().find("input.textbox-text").attr("type","text");
                $(".right-info").removeAttr("style");
                //$(".right-info-pass").hide();
            });
            /**退出系统*/
            $(".user-quit").click(function () {
                exports.quit();
            });
        };
        /**获取配置文件*/
        exports.getConfig=function(region)
        {
            //获取公用配置的本地文件
            ef.getJSON(
                {
                    url: "data/config.json",
                    dataType: 'json',
                    useLocal: true,
                    success: function (response) {
                        //配置全局参数
                        ef.util.copy(response,ef.config);
                        ef.menuData=response.menu;
                        ef.setting();
                        api.parse();
                        //获取数据中心
                        api.getDataCenter(null,function(dataResponse)
                        {
                            $(dataResponse).each(function(i,item)
                            {
                                //item.displayname = item.displayname+"("+security.getSecurityByValue(item.security).label+")";
                                if(item.is_current_region==true){
                                    item.selected=true;
                                }
                            });
                            $('.data-center-wrapper').dataCenter(dataResponse,{
                                textField:'displayname',
                                valueField:'region',
                                onSelect:function(menu){
                                    //console.log('yangtao------',data);
                                    if(menu.data.is_current_region==true){
                                        return
                                    }
                                    window.location.replace(ef.util.url(menu.data.url+"/web/index.html",{region:ef.util.encrypt(menu.data.region)}));
                                }
                            });
                            /*$('.data-center-inner').param({
                                dataProvider:dataResponse,
                                labelField: 'displayname',
                                valueField: 'region'
                            });
                            $(".userinfocombo").combobox({
                                selectOnNavigation:true,
                                editable:false,
                                data:dataResponse,
                                onSelect: function (data) {
                                        window.location.replace(ef.util.url(data.url+"/web/index.html",{region:ef.util.encrypt(data.region)}));
                                }
                            });
                            if(region)
                            {
                                $(dataResponse).each(function (i,il) {
                                    if(region==il.region){
                                        $(".userinfocombo").combobox('setValue',il.displayname);
                                    }
                                });
                            }*/
                        });
                        exports.getLicense(function(data)
                        {
                            //公用导航生成
                            if(data.date_interval<30){
                                $('.expire-time-close').on('click',function(){
                                    $('.expire-time-wrapper').hide();
                                    $(window).resize();
                                });
                                $('.expire-time').empty().text(data.date_interval);
                                $('.expire-time-wrapper').show();
                               /* $(".right-info-time").empty().text(data.date_interval);
                                $(".right-info-promote").empty().text(ef.util.getLocale("app.license.expired"));*/
                            }
                            ef.getJSON({
                                url: api.getAPI("sysInfo") + "/details", //用于文件上传的服务器端请求地址
                                type: 'get',
                                success: function (response)  //服务器成功响应处理函数
                                {
                                    var nodes;
                                    $(response).each(function (i,il) {
                                        nodes = il.nodes;
                                    });
                                    ef.getJSON({
                                        url:api.getAPI("network.vlan.addVlan.host"),
                                        type:"get",//get,post,put,delete
                                        isForce:true,
                                        success:function(resp) {
                                            if(resp.length>nodes&&data.date_interval>=30){
                                                $(".right-info-promote").empty().text(ef.util.getLocale("app.host.over"));
                                            }
                                        }
                                    });
                                }
                            });
                            exports.createNav();
                        },function()
                        {
                            api.getDataCenter(null,function(dataResponse)
                            {
                                $(dataResponse).each(function(i,item)
                                {
                                    if(item.is_current_region==true){
                                        item.selected=true;
                                    }
                                });
                                $('.data-center-wrapper').dataCenter(dataResponse,{
                                    textField:'displayname',
                                    valueField:'region',
                                    onSelect:function(menu){
                                        if(menu.data.is_current_region==true){
                                            return
                                        }
                                        window.location.replace(ef.util.url(menu.data.url+"/web/index.html",{region:ef.util.encrypt(menu.data.region)}));
                                    }
                                });
                                //有可能出现解析不正确出现倒影的情况
                                $.parser.parse('.data-center-wrapper');
                            });
                            exports.getLicenseMenu(function(resp)
                            {
                                $(".left-nav-cont").nav(resp,function(module, lastModule)
                                {
                                    ef.server.Socket.closeAll();
                                    require.undef(module);
                                    if (lastModule) {
                                        require.undef(lastModule);
                                    }
                                    require([module,"easyui.lang.zh"], function (impl) {
                                        if (!impl)return;
                                        if ($.parser) {
                                            impl.redraw();
                                            $.parser.parse(".right-entity");
                                            require("easyui.lang.zh");
                                        }
                                    });
                                },null,true);
                                if(!user.isSys()&&!user.isSuper())
                                {
                                    signature.sessionOut(ef.util.getLocale("setting.sysinfo.lack"));
                                }
                            });

                        });
                        exports.getParam(function (data) {
                            var rec=ef.util.find(data,function(record)
                            {
                                return record.name=="ldap.enable";
                            });
                            if(rec.value==true&&!user.isSuper()){
                                $(".right-text-wrapper.reset-pass").hide();
                            }else{$(".right-text-wrapper.reset-pass").show();}
                        });
                    },
                    error: function (err) {
                        $.messager.alert(ef.alert.warning, ef.util.getLocale("app.config.error.404"), "error", function () {
                            user.__revokeUser();
                            window.location.replace("login.html");
                        });
                    }

                });
        };
        /**
         * 修改密码
         * */
        exports.modifyPassword=function(orig_pwd,new_pwd)
        {
            ef.loading.show();
            ef.getJSON(
                {
                    url:api.getAPI("modify.password.self"),
                    type:"post",//get,post,put,delete,
                    data:
                    {
                        "orig_pwd":orig_pwd,
                        "new_pwd":new_pwd
                    },
                    success:function(response)
                    {
                        ef.loading.hide();
                        ef.placard.tick(ef.util.getLocale("setting.password.modify.success"));
                        $(".right-content-wrapper").show();
                        $(".right-info-pass").hide();
                        $.messager.alert(ef.alert.warning,ef.util.getLocale("setting.password.modify.success.tip"),'info',function()
                        {
                            signature.signOut();
                        });
                    },
                    error:function(error)
                    {
                        ef.loading.hide();
                        ef.placard.warn(ef.util.getLocale("setting.password.modify.error")+error.msg);
                        $(".right-info-pass").show();
                    }
                });
        };
        exports.quit=function()
        {
            $.messager.confirm(ef.alert.warning, ef.util.getLocale("signature.logout.confirm.message"), function (ok) {
                if (ok) {
                    ef.getJSON(
                        {
                            url: api.getAPI("logout"),
                            type: "delete",
                            isForce: true,
                            success: function (logRes) {
                                signature.signOut();
                            },
                            error: function (err) {
                                signature.signOut();
                            }
                        });
                }
            });
        };
        exports.international=function()
        {
            if ($.fn.pagination){
                $.fn.pagination.defaults.beforePageText = '第';
                $.fn.pagination.defaults.afterPageText = '共{pages}页';
                $.fn.pagination.defaults.displayMsg = '{from}/{to},共{total}条';
            }
            if ($.fn.datagrid){
                $.fn.datagrid.defaults.loadMsg = '正在处理，请稍待。。。';
            }
            if ($.fn.treegrid && $.fn.datagrid){
                $.fn.treegrid.defaults.loadMsg = $.fn.datagrid.defaults.loadMsg;
            }
            if ($.messager){
                $.messager.defaults.ok = '确定';
                $.messager.defaults.cancel = '取消';
            }
            $.map(['validatebox','textbox','filebox','searchbox',
                'combo','combobox','combogrid','combotree',
                'datebox','datetimebox','numberbox',
                'spinner','numberspinner','timespinner','datetimespinner'], function(plugin){
                if ($.fn[plugin]){
                    $.fn[plugin].defaults.missingMessage = '该输入项为必输项';
                }
            });
            if ($.fn.validatebox){
                $.fn.validatebox.defaults.rules.email.message = '请输入有效的电子邮件地址';
                $.fn.validatebox.defaults.rules.url.message = '请输入有效的URL地址';
                $.fn.validatebox.defaults.rules.length.message = '输入内容长度必须介于{0}和{1}之间';
                $.fn.validatebox.defaults.rules.remote.message = '请修正该字段';
            }
            if ($.fn.calendar){
                $.fn.calendar.defaults.weeks = ['日','一','二','三','四','五','六'];
                $.fn.calendar.defaults.months = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
            }
            if ($.fn.datebox){
                $.fn.datebox.defaults.currentText = '今天';
                $.fn.datebox.defaults.closeText = '关闭';
                $.fn.datebox.defaults.okText = '确定';
                $.fn.datebox.defaults.formatter = function(date){
                    var y = date.getFullYear();
                    var m = date.getMonth()+1;
                    var d = date.getDate();
                    return y+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d);
                };
                $.fn.datebox.defaults.parser = function(s){
                    if (!s) return new Date();
                    var ss = s.split('-');
                    var y = parseInt(ss[0],10);
                    var m = parseInt(ss[1],10);
                    var d = parseInt(ss[2],10);
                    if (!isNaN(y) && !isNaN(m) && !isNaN(d)){
                        return new Date(y,m-1,d);
                    } else {
                        return new Date();
                    }
                };
            }
            if ($.fn.datetimebox && $.fn.datebox){
                $.extend($.fn.datetimebox.defaults,{
                    currentText: $.fn.datebox.defaults.currentText,
                    closeText: $.fn.datebox.defaults.closeText,
                    okText: $.fn.datebox.defaults.okText
                });
            }
            if ($.fn.datetimespinner){
                $.fn.datetimespinner.defaults.selections = [[0,4],[5,7],[8,10],[11,13],[14,16],[17,19]]
            }

        };
        domReady(function () {
            $(window).resize(function()
            {
                $(".tooltip").hide();
            });

            if(!signature.check()){return}
            exports.init();
            var region=null;
            var reg = ef.util.getQueryString("region");
            if(reg){
                region = ef.util.decrypt(reg);
                //$(dataResponse).each(function (i,il) {
                //    if(region==il.region){
                //        $(".userinfocombo").combobox('setValue',il.displayname);
                //    }
                //});
            }
            exports.getConfig(region);
        });
    });
});