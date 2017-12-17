define(['easyui', 'user', 'domReady', 'clientPaging', 'api', "module", "role", "security", "cal.host","setting.param"], function (easyui, user, domReady, clientPaging, api, module, roleAll, securityAll, cal_host,settingParam) {
    var implement = new ef.Interface.implement();
    implement.isForce = true;
    var _LleftBtns;
    implement.i18n = function () {
        //i18n
        $("#host").append(ef.util.getLocale("setting.user.detail.host"));
        $("#description").append(ef.util.getLocale("setting.user.detail.description"));
        $("#idfield").append(ef.util.getLocale("setting.userdetail.description.idfield") + "：");
        $("#namefield").append(ef.util.getLocale("setting.userdetail.description.namefield") + "：");
        $("#phonefield").append(ef.util.getLocale("setting.userdetail.description.phonefield") + "：");
        $("#emailfield").append(ef.util.getLocale("setting.userdetail.description.emailfield") + "：");
        $("#rolefield").append(ef.util.getLocale("setting.userdetail.description.rolefield") + "：");
       /*$("#secretsfield").append(ef.util.getLocale("setting.userdetail.description.secretsfield") + "：");*/
        $("#projectfield").append(ef.util.getLocale("setting.userdetail.description.projectfield") + "：");
        $("#tenantfield").append(ef.util.getLocale("setting.userdetail.description.tenantfield") + "：");
        $("#user").val(ef.util.getLocale("setting.userdetail.description.role.user"));
        $("#sec").text(ef.util.getLocale("setting.userdetail.description.role.sec"));
        $("#audit").text(ef.util.getLocale("setting.userdetail.description.role.audit"));
        $("#sys").text(ef.util.getLocale("setting.userdetail.description.role.sys"));
        $("#nosecrets").val(ef.util.getLocale("setting.userdetail.description.secrets.nosecrets"));
        $("#secrets2").text(ef.util.getLocale("setting.userdetail.description.secrets.secrets2"));
        $("#secrets3").text(ef.util.getLocale("setting.userdetail.description.secrets.secrets3"));
        $("#secrets4").text(ef.util.getLocale("setting.userdetail.description.secrets.secrets4"));
        $("th[field='name']").append(ef.util.getLocale('setting.userdetail.datagrid.id'));
        $("th[field='displayname']").append(ef.util.getLocale('setting.userdetail.datagrid.name'));
        $("th[field='ip']").append(ef.util.getLocale('setting.userdetail.datagrid.ip'));
        $("th[field='cores']").append(ef.util.getLocale('setting.userdetail.datagrid.format'));
        $("th[field='tenant']").append(ef.util.getLocale('setting.userdetail.datagrid.tenant'));
        $("th[field='state']").append(ef.util.getLocale('setting.userdetail.datagrid.status'));
        $("th[field='hypervisor']").append(ef.util.getLocale('setting.userdetail.datagrid.hypervisor'));
    };
    /**
     * 根据id获取用户信息
     * */
    implement.getUserInfo = function (id, isForce, callback, errorCallback) {
        ef.getJSON({
            url: api.getAPI("setting.user.userlist") + "/" + id,
            type: "get",//get,post,put,delete
            isForce: isForce,
            success: function (response) {
                callback ? callback(response) : null;
            },
            error: function (error) {
                errorCallback ? errorCallback(error) : null;
            }
        });
    };
    implement.init = function (isLdap) {
            $("#js-menus-wrapper").iconmenu([
                //{
                //    iconClass: "icon-menus-icon-back",
                //    tip: ef.util.getLocale('framework.component.iconmenu.back.tip'),//"返回",
                //    "access": [8, 9, 10, 88],
                //    click: function () {
                //        ef.nav.goto("user.html", "setting.user");
                //    }
                //},
                {
                    iconClass: "icon-menus-icon-key",
                    tip: ef.util.getLocale('framework.component.iconmenu.key.tip'),//"修改密码",
                    "access": [88],
                    click: function () {
                        new ef.Dialog('pwdReset',{
                            title: ef.util.getLocale("setting.password.reset.password.title"),
                            width: 500,
                            height: 280,
                            closed: false,
                            cache: false,
                            nobody: false,
                            href: 'views/passReset.html',
                            modal: true,
                            onResize: function () {
                                $(this).dialog('center');
                            },
                            onLoad: function () {
                                require(['setting.password.reset'], function (pwd) {
                                    pwd.redraw();
                                })
                            },
                            onClose: function () {
                                require.undef('setting.password.reset');
                            }
                        });
                    }
                }
            ]);
    };
    implement.userHost = function () {
        $('#user-host').datagrid({
            singleSelect:false,
            pagination:true,
            pageSize:10,
            columns:[[
                {field:'name',title:ef.util.getLocale("setting.userdetail.datagrid.id"),width:'13%',
                    formatter: function (val){
                        if(!val){
                            return '<span style="padding-left: 0px;">-</span>';
                        }
                        else{
                            return '<span style="padding-left: 0px;">'+val+'</span>';
                        }
                    }
                },
                {field:'displayname',title:ef.util.getLocale("setting.userdetail.datagrid.name"),width:'16%',
                    formatter: function (val){
                        if(!val){
                            return '<span style="padding-left: 0px;">-</span>';
                        }
                        else{
                            return '<span style="padding-left: 0px;">'+val+'</span>';
                        }
                    }
                },
                {field:'ip',title:ef.util.getLocale("setting.userdetail.datagrid.ip"),width:'16%',
                    formatter: function (val){
                        if(!val){
                            return '<span style="padding-left: 0px;">-</span>';
                        }
                        else{
                            return '<span style="padding-left: 0px;">'+val+'</span>';
                        }
                    }
                },
                {field:'cores',title:ef.util.getLocale("setting.userdetail.datagrid.format"),width:'16%',formatter: function (val,row) {
                    return  val + ef.util.getLocale("cal.host.util") + Math.ceil(row.memory_mb / 1024)+ ef.util.getLocale("cal.host.GB");
                }},
                {field:'tenant',title:ef.util.getLocale("setting.userdetail.datagrid.tenant"),width:'16%',
                    formatter: function (val){
                        if(!val){
                            return '<span style="padding-left: 4px;">-</span>';
                        }
                        else{
                            return '<span style="padding-left: 4px;">'+val+'</span>';
                        }
                    }
                },
                {field:'state',title:ef.util.getLocale("setting.userdetail.datagrid.status"),width:'14%',formatter: function (val,row) {
                    var $dom = $('<span class="status_icon_box"><i></i><span></span></span>');
                    var icon = $dom.find("i");
                    var text = $dom.find("span");
                    var style = cal_host.getStyleByStatus(val);
                    icon.addClass(style.icon);
                    text.text(style.text);
                    return $dom[0].outerHTML;
                }},
                {field:'hypervisor',title:ef.util.getLocale("setting.userdetail.datagrid.hypervisor"),width:'16%',
                    formatter: function (val){
                        if(!val){
                            return '<span style="padding-left: 8px;>-</span>';
                        }
                        else{
                            return '<span style="padding-left: 8px;">'+val+'</span>';
                        }
                    }
                }
            ]]
        });
    };
  implement.getUserDetailHostList = function (userId) {
        var boo = false;
        ef.getJSON({
            url: api.getAPI('hostList'),
            type: "get",
            data: {
                user_id: userId
            },
            success: function (response) {
                $(response).each(function (i, il) {//读取内层数据，这里的左边名称和表格field一致
                    il.ip = cal_host.getRealIp(il);
                    il.tenant = il.tenant.name;
                    il.hypervisor = il.host.name;
                });
                $('#user-host').datagrid({data: response}).datagrid("clientPaging");
            }
        });
        return boo;
    };

   implement.getUserTenant=function(useId){
        ef.getJSON({
            url: api.getAPI("setting.user.userlist") + "/" + useId+"/tenants",
            type: "get",//get,post,put,delete
            isForce: true,
            success: function (response) {
                var nameArr=[],value,name,role,roleArr=[],$dom,nametip,rolArr,domHtml;
                $(response).each(function(i,il){
                    nameArr.push(il.tenant&&il.tenant.name?il.tenant.name:"-"); //获取的是一个数组的名字项目如DEV，。。。
                    roleArr.push(il.role.name);//项目的角色*
                });
                var dom=$("#project");
                dom.css({"float":"left","width":"auto"});
                var Dom = $("<div class='atPro'></div>");
                $("#project").append(Dom);
                if(response.length==0){Dom.text('-');return;}
                $(nameArr).each(function(i,il){
                   $dom=$("<span></span>");
                    $dom.text(il+",");
                    if(i==nameArr.length-1){
                        $dom.text(il);
                    }
                    Dom.append($dom);
                    if(roleArr[i]=="user"){
                        roleArr[i]="普通用户";
                    }
                    if(roleArr[i]=="sys_admin"){
                        roleArr[i]="系统管理员";
                    }
                    if(roleArr[i]=="tenant_admin"){
                        roleArr[i]="项目管理员";
                    }
                     $dom.tooltip({
                      content:"<p>项目名称："+nameArr[i]+"</p>"+"<p>项目角色："+roleArr[i]+"</p>"
                     });
                  });
                },
            error: function (error) {
                console.log(error);
            }
        });
    };
    implement.redraw = function () {
        domReady(function () {
            implement.i18n();
            implement.init();
            ef.util.ready(function (dom) {//跨页传递数据
                var _pageData = null;
                var _data = dom.data("pageData");
                _data = ef.util.unescapeJSON(_data);//在dom传递属性中包含特殊值符号的字符串
                if (_data) {
                    _data = JSON.parse(_data);
                    _pageData = _data;
                }
                settingParam.getList(this.isForce,function(response)
                {
                    var rec=ef.util.find(response,function(record)
                    {
                        return record.name=="ldap.enable";
                    });
                    if(rec.value){
                        $(".icons-userdetail.righticons").hide();
                        $(".icon-menus-icon-key").parent().hide();
                    }
                });
                implement.userHost();
                ef.localStorage.put("userDetail.id",_data.id);
               implement.getUserDetailHostList(_data.id);
                implement.getUserTenant(_data.id);
                var savename = _data.displayname, saveemail = _data.email, savephone = _data.phone?_data.phone:"-", saverloe, savesecrets;
                //这种写法
                $("#uid").text(_data.name);

                var roles=roleAll.getRoleByType(_data.role.name).label; //根据角色类型获取角色
                //var sec=securityAll.getSecurityByValue(_data.security).label;
                $("#name").textbox({disabled: true, value: savename,height:30});
                $("#email").textbox({disabled: true, value: saveemail,height:30});
                $("#phone").textbox({disabled: true, value: savephone,height:30});
                $("#tenant").textbox({disabled: true, value: _data.tenants,height:30});
                saverloe = _data.role.name;
                $('#role').combobox({
                    data: roleAll.getRoleList(),
                    valueField: 'type',
                    textField: 'label',
                    disabled:true,
                    editable:false,
                    value:saverloe,
                    height:30,
                    onChange: function () {
                        if(_LleftBtns)
                        _LleftBtns.setStatus("2", false);
                    }
                });
                $(".userdescription .textbox").css("border", "0 none");
                $(".block-list-content .textbox a").hide();
                $(".select-oth .textbox").css("border", "0 none");
                _LleftBtns = $(".icons-userdetail").togglebutton([
                    [
                        {
                            iconClass: "icon-menus-icon-edit",//编辑
                            tip: ef.util.getLocale("setting.user.edit.tip"),
                            id: '1',
                            "access": [8, 9, 88],
                            click: function (menu) {
                                _LleftBtns.goto(1);
                                if (user.isSys() || user.isSuper()) {
                                    $("#name").textbox({
                                        disabled: false,
                                        maxlength:15,
                                        required: true,
                                        validType: 'whitelist["0-9a-zA-Z_\u4E00-\u9FA5","字母,中文,下划线和数字"]'
                                    });
                                    $("#email").textbox({
                                        disabled: false,
                                        maxlength:60,
                                        required: true,
                                        validType:'reg[/^([a-zA-Z0-9_\\.\\-])+\\@(([a-zA-Z0-9\\-])+\\.)+([a-zA-Z0-9]{2,4})+$/]'
                                    });
                                    $("#phone").textbox({
                                        disabled: false,
                                        maxlength:15,
                                        validType: 'whitelist["0-9-()+","数字和-"]'
                                    });
                                    if(savephone=="-"){$("#phone").textbox('clear');}
                                    $(".userdescription span.textbox").css({"border":'1px solid',"width":'185px'});
                                    $(".userdescription span.textbox:last").css("border", "0 none");
                                    $(".select-oth .textbox").css("border", "0 none");
                                }
                            }
                        }
                    ],
                    [
                        {
                            iconClass: "icon-menus-icon-save",
                            tip: ef.util.getLocale("setting.user.save.tip"),
                            id: '2',
                            "access": [8, 9, 88],
                            click: function (menu) {
                                ef.loading.show();
                                var isForce = true;
                                ef.placard.hide();
                                if(!$('#name').textbox('isValid')||!$('#email').textbox('isValid')||!$('#phone').textbox('isValid')){ef.loading.hide();return;}
                                if (user.isSys() || user.isSuper()) {
                                    var uname = $('#name').textbox('getValue');
                                    var uemail = $('#email').textbox('getValue');
                                    var uphone = $('#phone').textbox('getValue');
                                    //修改用户姓名邮箱手机号验证
                                        ef.getJSON({
                                            url: api.getAPI("setting.user.userlist") + "/" + _data.id,
                                            type: "post",//get,post,put,delete
                                            isForce: true,
                                            data: {
                                                'id': ef.localStorage.get("setting.userDetail.id"),
                                                'displayname': uname,
                                                'phone': uphone,
                                                'email': uemail
                                            },
                                            success: function (response) {
                                                savename = uname;
                                                saveemail = uemail;
                                                savephone = uphone?uphone:"-";
                                                $("#name").textbox({
                                                    disabled: true,
                                                    value: savename
                                                });
                                                $("#email").textbox({
                                                    disabled: true,
                                                    value: saveemail
                                                });
                                                $("#phone").textbox({
                                                    disabled: true,
                                                    value: savephone
                                                });
                                                $(".userdescription .textbox").css("border", "0 none");
                                                ef.loading.hide();
                                                ef.placard.tick("修改成功！");
                                                _LleftBtns.goto(0);
                                                $(".block-list-content .textbox a").hide();
                                                $(".select-oth span.textbox").css("border", "0 none");
                                            },
                                            error: function (error) {
                                                ef.loading.hide();
                                            }
                                        });
                                    }
                            }
                        },
                        {
                            iconClass: "icon-menus-icon-cancel",
                            tip: ef.util.getLocale("setting.user.cancel.tip"),
                            "access": [8, 9, 88],
                            click: function () {
                                _LleftBtns.goto(0);
                                if (user.isSys() || user.isSuper()) {
                                    $(".textbox").addClass("input-oth");
                                    $("#name").textbox({
                                        disabled: true,
                                        value: savename
                                    });
                                    $("#email").textbox({
                                        disabled: true,
                                        value: saveemail
                                    });
                                    $("#phone").textbox({
                                        disabled: true,
                                        value: savephone?savephone:"-"
                                    });
                                    $(".userdescription .textbox").css("border", "0 none");
                                }
                            }
                        }
                    ]
                ]).setStatus("2", true);//true是置灰不可用
                $(".textbox").keydown(function () {
                    _LleftBtns.setStatus("2", false);
                });
                $("#user-host").datagrid('loading');

            });
        })
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});

