/**
 * Created by wangahui1 on 15/11/6.
 */
define(['easyui','clientPaging',"domReady","module",'user',"api","role","dashboard","easyui.lang.zh"],function(easyui,clientPaging,domReady,module,user,api,role,dashboard)
{
    var implement=new ef.Interface.implement();
    var total=null;
    implement.dataCenter = function(callback){
        api.getDataCenter(null,function(response){
            if(callback){
                callback(response);
            }
        });
    };
    implement.logTab=function() {
        $("#loglist").datagrid({
            pagination:true,
            pageSize:10,
            autoHeight:true,
            singleSelect:true,
            emptyText:"暂无数据",
            onLoadSuccess:function (data) {
            },
            columns:[[
                {field:'time',title:ef.util.getLocale("log.table.time"),width:'17%',formatter: function (val) {
                    return ef.util.number2time(val,"Y-M-D h:m:s",true);}},
                /*{field:'region',title:ef.util.getLocale("log.table.region"),width:'12%',formatter: function (val,row) {/* var dom = $('<div></div>');
                    var dom=$("<div></div>");
                    if(implement.regions){
                        var regSel = _.find(implement.regions,function(item){
                            return item.region == val;
                        });
                        if(regSel){
                            dom.text(regSel.displayname);
                        }else{
                            console.log('had no reg selected');
                        }
                        return dom;
                    }else{
                        console.log('get regions failed');
                    }
                }},*/
                {field:'user',title:ef.util.getLocale("log.table.user"),width:'11%',
                    formatter: function(val) {
                        if(val){
                            return '<span style="padding-left: 2px;">' + val +'</span>'
                        }else{
                            return '<span>-</span>'
                        }
                    }
                },
                {field:'role',title:ef.util.getLocale("log.table.role"),width:'14%',
                    formatter:function(val,row){
                        //if(role.getRoleByType(val).label=="普通用户"){
                        //     return "项目管理员";
                        //};
                         return '<span style="padding-left: 3px;">' +role.getRoleByType(val).label+'</span>';
                    }},
                {field:'type',title:ef.util.getLocale("log.table.type"),width:'13%',formatter:
                    function(val){
                        return  '<span style="padding-left: 3px;">' +ef.util.getLocale("server.operate."+val)+'</span>';
                    }},
                {field:'object',title:ef.util.getLocale("log.table.opt"),width:'14%',formatter:function(val,row){
                    var dom=$("<div></div>");
                    if(row.type=="global_settings"){
                        //var obj =ef.util.getLocale("server.setting."+val);
                        dom.text(val).attr("title",val);
                        return dom;
                    }else if(row.type=="security_group"||row.type=="tenant"){
                        //var obj=ef.util.getLocale("server.operate."+val);
                        dom.text(val).attr("title",val);
                        if(val=="None"){dom.text('任何');}
                        return dom;
                    }
                    else{
                        dom.text(val).attr("title",val);
                        return dom;
                    }
                }},
                {field:'operation',title:ef.util.getLocale("log.table.operate"),width:'14%',formatter:
                    function(val,row){
                        if(row.type=="security_group"){return ef.util.getLocale("server.operate.security_group."+val);}
                        else if((row.type=="template"||row.type=="instance")&&val=="create"){
                            return ef.util.getLocale("server.operate.template."+val);
                        }
                        else{return ef.util.getLocale("server.operate."+val);}
                       }},
                {field:'des',title:ef.util.getLocale("log.table.event"),width:'24%',formatter:function(val,row)
                {
                    if(!val){return "-";}
                    var $dom = $("<ul title='"+val+"'></ul>");
                    $dom.css({"overflow":"hidden","width":"144px","text-overflow":"ellipsis","white-space":"nowrap"});
                    //server.message.alarm.shut_down
                    if(row.type=="alarm"&&val.indexOf("server.message.alarm.shut_down")!=-1){
                        var s=val.indexOf("server.message.alarm.shut_down");
                        var d=val.slice(0,s);
                        val=d+"关机"
                    }

                    $dom.text(val);
                    return $dom;
                   //   if(row.type=="snapshot"){//备份日志
                   //     if(row.object.indexOf("vm")!=-1){
                   //        // var txt=implement.getOperateAction(row.type,row.operation,"vm")+val;
                   //         $dom.text(ef.util.getLocale("server.operate." +row.type+"."+row.operation+".vm")+val).attr("title", ef.util.getLocale("server.operate." +row.type+"."+row.operation+".vm")+val);
                   //         return $dom;
                   //     }
                   //     else if(row.object.indexOf("vd")!=-1){
                   //         //var txt=implement.getOperateAction(row.type,row.operation,"vd")+val;
                   //         $dom.text(ef.util.getLocale("server.operate." +row.type+"."+row.operation+".vd")+val).attr("title", ef.util.getLocale("server.operate." +row.type+"."+row.operation+".vd")+val);
                   //         return $dom;
                   //     }
                   //   }else if(row.type=="security_group"){
                   //       $dom.text(ef.util.getLocale("server.operate." +row.type+"."+row.operation)+val).attr("title", ef.util.getLocale("server.operate." +row.type+"."+row.operation)+val);
                   //       return $dom;
                   //   }else if(row.type=="templates"&&row.operation=="create"){
                   //       $dom.text(ef.util.getLocale("server.operate." +row.type+"_tem."+row.operation)+val).attr("title", ef.util.getLocale("server.operate." +row.type+"_tem."+row.operation)+val);
                   //       return $dom;
                   //   }else if(row.type=="instance"&&row.operation=="create"){
                   //       $dom.text(ef.util.getLocale("server.operate." +row.type+"_ins."+row.operation)+val).attr("title", ef.util.getLocale("server.operate." +row.type+"_ins."+row.operation)+val);
                   //       return $dom;
                   //   }
                   //   else{
                   //       $dom.text(ef.util.getLocale("server.operate." +row.type+"."+row.operation)+val).attr("title", ef.util.getLocale("server.operate." +row.type+"."+row.operation)+val);
                   //       return $dom;
                   //     }

                    }
                }
            ]]
        });
    };
    //绘制条件输入框
    implement.initComb = function () {
        $("#begin-date").datetimebox({
            prompt: ef.util.getLocale("log.datetimebox.begin.prompt"),
            validType:'regx[/^(?:19|20)[0-9][0-9]-(?:(?:0[1-9])|(?:1[0-2]))-(?:(?:[0-2][1-9])|(?:[1-3][0-1])) (?:(?:[0-2][0-3])|(?:[0-1][0-9])):[0-5][0-9]:[0-5][0-9]$/,"请输入合法时间"]'
        });
        $("#end-date").datetimebox({
            prompt:ef.util.getLocale("log.datetimebox.end.prompt"),
            validType:'regx[/^(?:19|20)[0-9][0-9]-(?:(?:0[1-9])|(?:1[0-2]))-(?:(?:[0-2][1-9])|(?:[1-3][0-1])) (?:(?:[0-2][0-3])|(?:[0-1][0-9])):[0-5][0-9]:[0-5][0-9]$/,"请输入合法时间"]'
        });
         $("#log_obj").textbox({
             iconCls: 'icon-search',
             iconAlign:'left',
             prompt:ef.util.getLocale("log.combobox.opt.prompt")
        });
        $("#log_kind_sel").combobox({//类型
            prompt: ef.util.getLocale("log.combobox.kind.prompt"),
            valueField:"value",
            editable:false,
            formatter: function(row){
                var opts = $(this).combobox('options');
                if(row.value=="all"){
                    return row[opts.textField]="全部";
                }else{
                    return row[opts.textField]=ef.util.getLocale("server.operate."+row.value);
                }
            }
        });
        $("#log_all_user_sel").combobox({//用户
            prompt: ef.util.getLocale("log.combobox.user.prompt"),
            textField:"label",
            //editable:false,
            valueField:"label", //read label
            filter: function(p, row){
                if(p == ""){
                    return true
                }
                var opts = $(this).combobox('options');
                return row[opts.textField].indexOf(p) !== -1;
            },
            onHidePanel: function(){
                var opt = $(this).combobox('options');
                var data = opt.data;
                var val = $(this).combobox('getText');
                var index = _.findKey(data, function (item) {
                    return item.label == val
                });
                if(!index){
                    $(this).combobox('setValue', '');
                    implement.logRef(0)
                }
            }
        });
        $("#log_kind_order").combobox({//操作
            editable:false,
            prompt:ef.util.getLocale("log.combobox.action.prompt")
        });
    };
    //根据不同的类型显示操作列表传不同的本地数据 输入框
    implement.orderAction = function (action_url) {
        ef.getJSON(
            {
                url:api.getAPI("log.combobox.action"),
                type:"get",//get,post,put,delete
                useLocal:true,
                data:{
                    _proxyKey:action_url
                },
                success:function(response) {
                    console.log(response);
                    $("#log_kind_order").combobox({//操作
                        prompt:ef.util.getLocale("log.combobox.action.prompt"),//请选择操作
                        data:response,
                        method:'get',
                        valueField:'value',
                        formatter:function(row){
                            var opts = $(this).combobox('options');//返回属性的对象
                            console.log(opts);
                            if(action_url=="name13"&&row.value=="cancel"){
                                return row[opts.textField]=ef.util.getLocale("server.operate.bpcancel");//取消
                            }else  if(action_url=="name8"){
                                if(row.value=="all"){
                                    return row[opts.textField]="全部";
                                }else{
                                    return row[opts.textField]=ef.util.getLocale("server.operate.security_group."+row.value);
                                }
                            }else if(action_url=="name14"&&row.value=="create"){
                                return row[opts.textField]=ef.util.getLocale("server.operate.template."+row.value);
                            }
                            else if(action_url=="name15"&&row.value=="create"){
                                return row[opts.textField]=ef.util.getLocale("server.operate.template."+row.value);
                            }
                            else{
                                if(row.value=="all"){
                                    return row[opts.textField]="全部";
                                }else{
                                    return row[opts.textField]=ef.util.getLocale("server.operate."+row.value);
                                }
                            }

                        }
                    });
                }
            });
        };
    //条件输入框类型和操作本地数据获取
    implement.getUTOComboxData = function () {
        ef.getJSON({
                url:api.getAPI("log.combobox.action"),
                type:"get",//get,post,put,delete
                useLocal:true,
                data:{
                    _proxyKey:"name12"
                },
                success:function(response)
                {
                    $("#log_kind_sel").combobox({//类型
                        data:response,
                        onChange: function (newvalue) {
                            if(newvalue=="all"){
                                $("#log_order").hide();
                            }else{
                                $("#log_order").show();
                            }
                            switch (newvalue){
                                case "vm":{
                                    implement.orderAction("name1");
                                    break;
                                }
                                case "vdisk":{
                                    implement.orderAction("name2");
                                    break;
                                }
                                case "user":{
                                    implement.orderAction("name3");
                                    break;
                                }
                                case "tenant":{
                                    implement.orderAction("name4");
                                    break;
                                }
                                case "network":{
                                    implement.orderAction("name5");
                                    break;
                                }
                                case "host":{
                                    implement.orderAction("name7");
                                    break;
                                }
                                case "security_group":{
                                    implement.orderAction("name8");
                                    break;
                                }
                                case "global_settings":{
                                    implement.orderAction("name9");
                                    break;
                                }
                                case "image":{
                                    implement.orderAction("name11");
                                    break;
                                }
                                case "snapshot":{
                                    implement.orderAction("name13");
                                    break;
                                }
                                case "template":{
                                    implement.orderAction("name14");
                                    break;
                                }
                                case "instance":{
                                    implement.orderAction("name15");
                                    break;
                                }
                                case "alarm":{
                                    implement.orderAction("name16");
                                    break;
                                }
                                case "all":{
                                    break;
                                }
                                default :{
                                    newvalue == "unknow";
                                }
                            }
                        }
                    });
                }
            });
        //获取角色和登录角色一致的用户名数据
        ef.getJSON(
            {
                url:api.getAPI("setting.user.datagrid_users"),  //获取到用户+users
                type:"get",//get,post,put,delete
                data:{
                   "admin":true
                },
                success:function(response)
                {
                    var data=[],role;
                    //if(user.isSys()){
                    //    role="sys_admin";
                    //}
                    //if(user.isSec()){
                    //    role="sec_admin";
                    //}
                    $(response).each(function (i,il) {
                        data.push({label:il.name});
                    });
                    data.unshift({label:"全部"});
                    //$(response).each(function(i,il) {
                    //    $(il.role).each(function (e, el) {
                    //        if (el.name == role) {
                    //            data.push({label: il.name});
                    //        }
                    //    });
                    //});
                    $("#log_all_user_sel").combobox({data:data});
                }
            });
        };

    implement.limitAll=function(){
        var ph =$('#loglist').datagrid("getPanel").height();
        var num = Math.floor(parseInt((ph-70)/36));
        $('#loglist').datagrid("getPager").pagination({pageSize:num});
        return num;
    };
    //分页请求
    implement.logRef = function(startNumber,logobj){
            var arg=arguments,
            logna=arg[1],
            betime =$("#begin-date").datetimebox("getValue");
            if(ef.util.isFirefox())
            {
                betime=betime.replace(/-/g,"/");
            }
        var begtime = ef.util.time2numberSecond(betime);
        var entime= $("#end-date").datetimebox("getValue");
            if(ef.util.isFirefox())
            {
                entime=entime.replace(/-/g,"/");
            }
        var  endtime = ef.util.time2numberSecond(entime);
        var  logobj1 = $("#log_obj").textbox("getValue"),
             usep = $("#log_all_user_sel").combobox("getValue"),
             typep=$("#log_kind_sel").combobox("getValue"),
             opt = $("#log_kind_order").combobox("getValue");
            usep=usep=="全部"?"":usep;
            typep=typep=="all"?"":typep;
            opt=opt=="all"?"":opt;
        ef.getJSON({
            url:api.getAPI('log.getLoglist'),//日志列表
            type:"get",
            data: (function () {
                var obj = {};
                if(!isNaN(begtime) && begtime!= 0){
                    obj.start_time = begtime;
                }
                if(!isNaN(endtime) && endtime != 0){
                    obj.end_time = endtime;
                }
                if(usep!=""){
                    obj.user = usep;
                }
                if(typep!=""||opt==""){
                    obj.type = typep;
                }
                if(opt!="") {
                    obj.operation = opt;
                }
                //}else if(opt==""){
                //    obj.operation = ;
                //}
                if(arg.length == 1&&logobj1==" "){
                    obj.object=null;

                }else if(arg.length==2&&logobj){
                    if("任何".indexOf(logobj)!=-1){
                        obj.object="None"
                    }else{
                        obj.object=logobj
                    }
                }else if(arg.length==1&&logobj1){
                    obj.object=logobj1;
                }
                obj.fuzzy = true;
                obj.limit = implement.limit;
                obj.start = startNumber;
                return obj;
            })(),
            success:function(response,allResult){
               // $('#loglist').datagrid({data:response}).datagrid('clientPaging');
              if(response.length == 0){
                 $('#loglist').datagrid({data:[]}).datagrid("clientPaging");
             }else{
                  $('#loglist').datagrid("loadData",response).datagrid('getPager').pagination(
                        {
                            showPageList:false,//定义是否显示页面导航列表。
                            showRefresh:false,
                            onSelectPage:function(pageNumber, pageSize)
                            {
                                var pagenumber =(pageNumber-1)*implement.limit;  // 第多少个数字
                                arg.callee(pagenumber,logna);//调用logRef（）返回正在被执行的函数
                                //console.log(pagenumber);
                            }
                        }).pagination("refresh",{total:allResult.total,pageNumber:(startNumber/implement.limit)+1});
                }
             // $('#loglist').datagrid("loadData",response).datagrid('getPager').pagination("refresh",{total:allResult.total,pageNumber:(startNumber/10)+1});
               $('#loglist').datagrid('loaded');
                // $('#loglist').datagrid("autoData",["resize.log",".search-item"]);
            },
            error:function(error){
                console.log(error);
            }
        });
    };
    //输入框数据发送
    implement.SendComboxData = function() {
        $("#begin-date").datetimebox({
            onHidePanel: function(){
                var begin = $('#begin-date').datetimebox('getValue');
                if(ef.util.isFirefox())
                {
                    begin=begin.replace(/-/g,"/");
                }
                var begintohao = ef.util.time2numberMillSecond(begin);
                var nowdate =  (new Date()).getTime();//当前时间秒
                var endtime = $("#end-date").datetimebox("getValue");
                if(ef.util.isFirefox())
                {
                    endtime=endtime.replace(/-/g,"/");
                }
                var endtohao = ef.util.time2numberMillSecond(endtime);//得到开始秒数
                if(begintohao>nowdate){
                    ef.placard.show(ef.util.getLocale("log.date.validate.begintime"));
                    $('#begin-date').datetimebox('setValue', '').datetimebox('showPanel');
                }
                if(endtime !="" && begin !="" && endtohao < begintohao){
                    ef.placard.show(ef.util.getLocale("log.date.validate.endtime"));
                    $('#begin-date').datetimebox('setValue', '').datetimebox('showPanel');
                }
            },
            onSelect: function(date) {
                var begintohao = ef.util.time2numberMillSecond(date);
                var nowdate = (new Date()).getTime();//当前时间秒
                if(begintohao>nowdate ){
                    ef.placard.show(ef.util.getLocale("log.date.validate.begintime"));
                    $('#begin-date').datetimebox('setValue', '').datetimebox('showPanel');
                }
            },
            onChange: function () {
                if($("#begin-date").datetimebox("isValid")){
                    implement.logRef(0);
                }
            }
        });
        $("#end-date").datetimebox({
            onShowPanel:function(){//当前的时间
                var begtime = $("#begin-date").datetimebox("getValue");
                if(ef.util.isFirefox())
                {
                    begtime=begtime.replace(/-/g,"/");
                }
                var begintohao = (new Date(begtime)).getTime();
                var end7date = begintohao + 7*24*60*60*1000;//+7天
                var end = ef.util.number2time(end7date,"Y-M-D h:m:s",true);
                var nowdate =((new Date()).getTime());//当前时间秒
                var now = ef.util.number2time(nowdate,"Y-M-D h:m:s");
                if(begtime == "" || end7date > nowdate){
                    $("#end-date").datetimebox("setValue",now);
                }else if(begtime != "" && end7date <= nowdate){
                    $("#end-date").datetimebox("setValue",end);
                }
            },

            onSelect: function (date) {
                var begtime = $("#begin-date").datetimebox("getValue");
                if(ef.util.isFirefox())
                {
                    begtime=begtime.replace(/-/g,"/");
                }
                var begintohao = ef.util.time2numberMillSecond(begtime);
                var endtohao =ef.util.time2numberMillSecond(date);
                if(begtime!="" && date !="" && endtohao < begintohao){
                    ef.placard.show(ef.util.getLocale("log.date.validate.endtime"));
                    $('#end-date').datetimebox('setValue', '').datetimebox('showPanel');
                }
            },
            onChange: function () {
                if($("#end-date").datetimebox("isValid")){
                    implement.logRef(0);
                }
            },
            onHidePanel: function () {
                var end = $('#end-date').datetimebox('getValue');
                if(ef.util.isFirefox())
                {
                    end=end.replace(/-/g,"/");
                }
                var endtohao = ef.util.time2numberMillSecond(end);
                var nowdate =  (new Date()).getTime();//当前时间秒
                if(endtohao>nowdate ){
                    ef.placard.show(ef.util.getLocale("log.date.validate.enderror"));
                    $('#end-date').datetimebox('setValue', '').datetimebox('showPanel');
                }
        }
        });
        $("#log_obj").textbox({
            onChange:function(newValue,oldValue){
              if(newValue!=oldValue){
                   implement.logRef(0,newValue);

                }
            }
        });
        $("#log_all_user_sel").combobox({
            onSelect:function(newValue, oldValue){
                $(this).combobox('setValue', newValue.label);
                implement.logRef(0);
            }
        });
        $("#log_kind_sel").combobox({
            onSelect:function(){
                $("#log_kind_order").combobox('reset');
                    implement.logRef(0);
            }
        });
        $("#log_kind_order").combobox({
            onChange:function(newValue,oldValue){
                implement.logRef(0);
         }
        });
    };
    implement.redraw=function() {
        $(document).ready(function () {
                implement.logTab();
                implement.limit=implement.limitAll();
                implement.initComb();//列表初始化
                implement.getUTOComboxData();

                //implement.dataCenter(function(data){
                //    implement.regions = data;
                //    implement.logRef(0);
                //});
               implement.logRef(0);
               /* implement.dataCenter();*/
                implement.SendComboxData();
                $("#log_order").hide();
                $("#reset").click(function () {
                    $(".rst").combobox("clear");
                    $("#log_obj").textbox('clear');
                    implement.logRef(0);
                    $("#log_order").hide();
                });
               $('#loglist').datagrid('loading');

            $(window).resize(function () {
                try{

                    var hei = Number($(window).height())-Number($(".datagrid-wrap.panel-body").offset().top);
                }
                catch (e){
                    return ;
                }

                var heig = (hei-30)>430?hei-30:430;
                $('#loglist').datagrid('resize',{height:heig});
            })
            });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});