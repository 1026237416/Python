define(['easyui','user','domReady','clientPaging','api',"module","security","role","setting.project","setting.param","resize"],function(easyui,user,domReady,clientPaging,api,module,security,role,project,settingParam)
{
    var implement=new ef.Interface.implement();
    implement.table = function () {
        $("#userlist").datagrid({
            singleSelect: true,
            pagination: true,
            autoHeight:true,
            emptyText:" ",
            pageSize: 10,
            columns:[[
                {field:'name',title:'用户名',formatter: function(val,row,index){
                    if(!row.id){return val;}
                    _row=ef.util.escapeJSON(JSON.stringify(row));
                    var a = row.status;
                    switch(a)
                    {
                        case "0":
                        {
                            return '<a class="table-link" style="color: #808080">'+val+'</a>';
                            break;
                        }
                        default :
                        {
                            return  ' <a onclick="ef.nav.goto(\'userdetail.html\',\'setting.userDetail\',\''+_row+'\',null,\'setting.user\')" class="table-link">'+val+'</a>';
                        }
                    }
                },
                 width:'18%'},
                {field:'displayname',title:'姓名',width:'18%',
                      formatter:function(val){
                          if(!val){
                              return '<span style="padding-left: 2px;">-</span>';
                          }
                          else{
                              return '<span style="padding-left: 2px;">'+val+'</span>';
                          }
                      }
                },
                {field:'email',title:'邮箱',width:'23%',formatter: function (val,row) {
                        if(!val){return '<span style="padding-left: 2px;">-</span>';}
                        return '<span style="padding-left: 2px;">'+val+'</span>';
                }},
                {field:'phone',title:'电话',width:'20%',formatter: function (val,row) {
                        if(!val){
                            return '<span style="padding-left: 2px;">-</span>';
                        }
                        else{
                            return '<span style="padding-left: 2px;"style="padding-left: 2px;">'+val+'</span>';
                        }
                    }
                },
                {field:'role',title:'角色',width:'23%',formatter: function (val,row,index) {
                    return role.getRoleByType(val.name).label;
                }}
            ]]
        });
    };
    /**
     * 根据id获取用户详情
     * */
    implement.getUserInfo=function(id,success,error)
    {
        ef.getJSON(
            {
                url:api.getAPI("getUser")+"/"+id,
                success:success|| $.noop,
                error:error|| $.noop
            });
    };
    /*设置角色*/
    implement.setRole=function(useId,setr){
        ef.getJSON(
            {
                url: api.getAPI("setting.user.userlist")+"/role/set",
                type: "post",//get,post,put,delete
                isForce:true,
                data:{
                    "role":setr,
                    "name":useId
                },
                success: function(response){
                    ef.loading.hide();
                    implement.refresh(false);
                },
                error: function () {
                    ef.loading.hide();
                }
            });
    };
    implement.userFilter = function (resp) {
     var name = $("#username").textbox('getValue');
     $('#userlist').datagrid({
        loadFilter: function(data){
            if(resp){data = resp;}
            var tmp = {total:0,rows:[]};
            $(data).each(function (i,il) {
                if(!name){name = il.name.toLowerCase()}
                if(il.name.toLowerCase().indexOf(name)!=-1||il.displayname.toLowerCase().indexOf(name)!=-1){//过滤项和输入框匹配
                    tmp.total = tmp.total+1;
                    tmp.rows.push(il);
                }
                name = $("#username").textbox('getValue').toLowerCase();
            });
            return tmp;
        }
    }).datagrid('clientPaging').datagrid("goto",1);
};
    implement.refresh=function(isFirst,callback){
        ef.getJSON(
            {
                url:api.getAPI("setting.user.datagrid_users"),
                type:"get",//get,post,put,delete
                success:function(response)
                {
                    response=ef.util.sort("name",response);
                    if(isFirst)
                    {
                        $('#userlist').datagrid({data:response}).datagrid("clientPaging",{
                            onPage:function(){
                                if(callback){
                                    callback();
                                }
                            }});
                    }else
                    {
                        $('#userlist').datagrid('loadData',response).datagrid("goto",1);
                        implement.userFilter(response);
                    }
                    $('#userlist').datagrid('loaded');
                    $(".datagrid-mask").hide();
                    $(".datagrid-mask-msg").hide();
                }
            });
    };
    implement.combo = function () {
        $("#username").textbox({
            prompt: ef.util.getLocale("setting.user.search-item.username"),
            iconCls:'icon-search',
            iconAlign:'left',
            valueField: 'value',
            onChange: function (newValue,oldValue) {
                implement.userFilter();
            }
        });
    };
    implement.redraw=function(){
        domReady(function(){
            implement.table();
            implement.refresh(true);
            if(user.isAudit()||user.isSec())
            {
                $(".search-item").removeClass("padding_top60");
                $(".right-cont").addClass("padding_top25");
            }
            settingParam.getList(this.isForce,function(response)
            {
                var access = 0;
                var rec=ef.util.find(response,function(record)
                {
                    return record.name=="ldap.enable";
                });
                if(rec.value==true){
                    var _iconMenu = $("#js-menus-wrapper").iconmenu([
                        {
                            isToggle:true,
                            id:"4",
                            'access':[88],
                            data:
                                [
                                    [
                                        {
                                            iconClass: "icon-menus-icon-sys",//显示第图标css样式
                                            tip: ef.util.getLocale("setting.userdetail.description.role.sys"),//提示文字
                                            id: "4",//标识的唯一id
                                            click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                                var uselist = $("#userlist").datagrid('getChecked');
                                                var userRole,useId,setRole;
                                                $(uselist).each(function(i,il){
                                                    useId=il.name;
                                                    userRole = il.role;
                                                });
                                                var role=ef.util.property('name')(userRole);
                                                if(role=='user'){
                                                    setRole ='sys_admin';
                                                    implement.setRole(useId,setRole);
                                                    ef.placard.tick(ef.util.getLocale("setting.user.placard.toSys"));
                                                }else if(role=='sys_admin'){
                                                    setRole='user';
                                                    implement.setRole(useId,setRole);
                                                    ef.placard.tick(ef.util.getLocale("setting.user.placard.touser"));
                                                }
                                            }
                                        }
                                    ],
                                    [
                                        {
                                            iconClass: "icon-menus-icon-user",//显示第图标css样式
                                            tip: ef.util.getLocale("setting.userdetail.description.role.cancelsys"),//提示文字
                                            id: "4",//标识的唯一id
                                            click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                                //console.log(menu);//输出{data:{当前数据,disable:false,dom:当前生成的dom节点,owner:IconMenus对象}}
                                                var uselist = $("#userlist").datagrid('getChecked');
                                                var userRole,useId,setRole;
                                                $(uselist).each(function (i,il) {
                                                    useId=il.name;
                                                    userRole = il.role;
                                                });
                                                var role=ef.util.property('name')(userRole);
                                                if(role=='user'){
                                                    setRole ='sys_admin';
                                                    implement.setRole(useId,setRole);
                                                    ef.placard.tick(ef.util.getLocale("setting.user.placard.toSys"));
                                                }else if(role=='sys_admin'){
                                                    setRole='user';
                                                    implement.setRole(useId,setRole);
                                                    ef.placard.tick(ef.util.getLocale("setting.user.placard.touser"));
                                                }
                                            }
                                        }
                                    ]
                                ]
                        }
                    ]);
                }else{access = 1;_iconMenu = $("#js-menus-wrapper").iconmenu([
                    {
                        iconClass: "icon-menus-icon-add",
                        tip: ef.util.getLocale("setting.user.iconmenu.new.tip"),
                        id: "1",
                        "access": [8,88],
                        click: function () {
                            new ef.Dialog('addUser',{
                                title: ef.util.getLocale("setting.user.iconmenu.new.tip.user"),
                                width: 800,
                                height: 480,
                                closed: false,
                                cache: false,
                                nobody: false,
                                href: 'views/addUser.html',
                                modal: true,
                                onResize: function () {
                                    $(this).dialog('center');
                                },
                                onLoad: function () {
                                    require(['setting.addUser'], function (addUser) {
                                        addUser.redraw();
                                    })
                                },
                                onClose: function () {
                                    require.undef('setting.addUser');
                                }
                            });
                        }
                    },
                    {
                        iconClass: "icon-menus-icon-delete",
                        tip: ef.util.getLocale("setting.user.delete.tip"),
                        id: 5,
                        "access": [8,88],
                        click: function () {
                            var userlist = $("#userlist").datagrid('getChecked');
                            var userId,userName;
                            $(userlist).each(function (i,il) {
                                userId = il.id;
                                userName = il.name;
                            });
                            ef.messager.confirm('deleting', ef.util.getLocale("setting.user.userlist.delete.ok") + userName + '？', null, function (ok) {
                                if (ok) {
                                    ef.loading.show();
                                    ef.getJSON(
                                        {
                                            url: api.getAPI("setting.user.userlist")+"/"+userId,
                                            type: "delete",//get,post,put,delete
                                            isForce:true,
                                            success: function (response) {
                                                ef.loading.hide();
                                                implement.refresh(false,function(){});
                                                ef.placard.tick(ef.util.getLocale("setting.user.placard.deleteuser"));
                                                $("#username").textbox('clear');
                                            },
                                            error: function () {
                                                ef.loading.hide();
                                            }
                                        });
                                } else {
                                    $("#userlist").datagrid("uncheckAll");
                                }
                            });
                        }
                    },
                    {
                        isToggle:true,
                        id:"4",
                        'access':[88],
                        data:
                            [
                                [
                                    {
                                        iconClass: "icon-menus-icon-sys",//显示第图标css样式
                                        tip: ef.util.getLocale("setting.userdetail.description.role.sys"),//提示文字
                                        id: "4",//标识的唯一id
                                        click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                            var uselist = $("#userlist").datagrid('getChecked');
                                            var userRole,useId,setRole;
                                            $(uselist).each(function(i,il){
                                                useId=il.name;
                                                userRole = il.role;
                                            });
                                            var role=ef.util.property('name')(userRole);
                                            if(role=='user'){
                                                setRole ='sys_admin';
                                                implement.setRole(useId,setRole);
                                                ef.placard.tick(ef.util.getLocale("setting.user.placard.toSys"));
                                            }else if(role=='sys_admin'){
                                                setRole='user';
                                                implement.setRole(useId,setRole);
                                                ef.placard.tick(ef.util.getLocale("setting.user.placard.touser"));
                                            }
                                        }
                                    }
                                ],
                                [
                                    {
                                        iconClass: "icon-menus-icon-user",//显示第图标css样式
                                        tip: ef.util.getLocale("setting.userdetail.description.role.cancelsys"),//提示文字
                                        id: "4",//标识的唯一id
                                        click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                            //console.log(menu);//输出{data:{当前数据,disable:false,dom:当前生成的dom节点,owner:IconMenus对象}}
                                            var uselist = $("#userlist").datagrid('getChecked');
                                            var userRole,useId,setRole;
                                            $(uselist).each(function (i,il) {
                                                useId=il.name;
                                                userRole = il.role;
                                            });
                                            var role=ef.util.property('name')(userRole);
                                            if(role=='user'){
                                                setRole ='sys_admin';
                                                implement.setRole(useId,setRole);
                                                ef.placard.tick(ef.util.getLocale("setting.user.placard.toSys"));
                                            }else if(role=='sys_admin'){
                                                setRole='user';
                                                implement.setRole(useId,setRole);
                                                ef.placard.tick(ef.util.getLocale("setting.user.placard.touser"));
                                            }
                                        }
                                    }
                                ]
                            ]
                    }
                ]);}
                $(".icon-menus-icon.icon-menus-icon-sys").parent().parent().css({"position":"relative","right":0});
                ef.util.ready(function(dom){
                    implement.combo();
                    var _pageId = dom.data("pageId");
                    var _roleType = ef.sessionStorage.get("role");
                    var _module = ef.sessionStorage.get("module");
                    if (_pageId && _module && _roleType) {
                        _roleType = _roleType.role;
                    }
                    function getCheckStatus(datagd, status) {
                        var _bool = true;
                        $(datagd).each(function (i, el) {
                            if (el.status == status) {
                                _bool = false;
                            }
                        });
                        return _bool;
                    }
                    $("#reset").click(function () {
                        $("#username").textbox('clear');
                        implement.refresh();
                    });
                    _iconMenu.setStatus("5",true);
                    _iconMenu.setStatus("4",true);
                    $('#userlist').datagrid({
                        onSelect: function(rowIndex, rowData){
                            _iconMenu.setStatus("4", false);

                            var role,setRole,user_id;
                            $(rowData.role).each(function (i,il) {
                                role=il.name;
                            });
                            /* if(rowData.security==0&&role=="user"){
                             _iconMenu.setStatus("5", false);
                             }*/
                            if(user.isSuper()&&access==1){
                                if(role=="user"){
                                    _iconMenu.menus[2].goto(0);
                                }
                                else if(role=="sys_admin"){
                                    _iconMenu.menus[2].goto(1);
                                }
                                else if(role=="user"||role=="sys_admin"){
                                    _iconMenu.setStatus("4", false);
                                }
                            }
                            if(user.isSuper()&&access==0){
                                if(role=="user"){
                                    _iconMenu.menus[0].goto(0);
                                }
                                else if(role=="sys_admin"){
                                    _iconMenu.menus[0].goto(1);
                                }
                                else if(role=="user"||role=="sys_admin"){
                                    _iconMenu.setStatus("4", false);
                                }
                            }
                            if(role=="user"){
                                _iconMenu.setStatus("5", false);
                            }
                            else{

                                _iconMenu.setStatus("5", true);
                            }
                        }
                    });
                    if (_iconMenu.isNoRightAll) {
                        //$(".icon-menus-box").hide();
                        $(".right-cont").css({"margin-top": 0});
                    }
                });
                $('#userlist').datagrid("autoData");
                $('#userlist').datagrid('loading');
            });
        })
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
