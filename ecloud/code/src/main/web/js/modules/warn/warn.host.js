/**
 * Created by wangahui1 on 15/11/6.
 */
define(["module","api","clientPaging","alarm","easyui","domReady"],function(module,api,clientPaging,alarm,easyui,domReady)
{
    var implement=new ef.Interface.implement();
    implement.timer=null;
    implement.alarmRef = function (isFirst,startNumber,mark,args) {//获取列表信息
        var arg=arguments;
        var level=arguments[2];
        ef.getJSON({
            url:api.getAPI("alarm"),
            type:"get",
            data:{
                    level:args,
                    start:startNumber,
                    limit:implement.limit
                },
            useLocal:false,
            success: function (response,allResult) {
                $("#alarmList").datagrid("loading");
                response=ef.util.sort("id",response);
                response  = response.reverse();
                if(mark==1){
                    implement.timer=setTimeout(time,0);
                }else{
                    implement.timer=setTimeout(time,300);
                }
                function time(){
                    clearTimeout(implement.timer);
                    implement.limitAll();
                    implement.timer=null;
                    if(isFirst){
                        $("#alarmList").datagrid({"data":response}).datagrid('getPager').pagination(
                            {
                                showPageList:false,//定义是否显示页面导航列表。
                                showRefresh:false,
                                onSelectPage:function(pageNumber, pageSize)
                                {
                                    var pagenumber =(pageNumber-1)*implement.limit;  // 第多少个数字
                                    arg.callee(true,pagenumber,level);
                                }
                            }).pagination("refresh",{total:allResult.total,pageNumber:(startNumber/implement.limit)+1,pageSize:implement.limit});
                        $("#alarmList").datagrid('loaded');
                    }
                    else{
                        $("#alarmList").datagrid("loadData",response);
                    }
                }
            }
        });
    };
    implement.table = function () {//初始化列表
        $("#alarmList").datagrid({
            singleSelect: true,
            pagination: true,
            pageSize:10,
            autoHeight:true,
            emptyText:"暂无数据",
            columns:[[
                {field:'id',title:'ID',width:'8%',
                    formatter: function(val) {
                        if(val){
                            return '<span style="padding-left: 1px;">' + val +'</span>'
                        }else{
                            return '<span>-</span>'
                        }
                    }
                },
                {field:'target',title:ef.util.getLocale("alarm.host.table.target"),width:'12%',
                    formatter: function(val) {
                        if(val){
                            return '<span style="padding-left: 3px;">' + val +'</span>'
                        }else{
                            return '<span>-</span>'
                        }
                    }
                },
                {field:'type',title:ef.util.getLocale("alarm.host.table.type"),width:'12%',formatter: function (val) {
                    return '<span style="padding-left: 3px;">' +alarm.getType(val).label+'</span>';
                }},
                {field:'times',title:ef.util.getLocale("alarm.host.table.times"),width:'10%',
                    formatter: function(val) {
                        if(val){
                            return '<span style="padding-left: 3px;">' + val +'</span>'
                        }else{
                            return '<span>-</span>'
                        }
                    }
                },
                {field:'message',title:ef.util.getLocale("alarm.host.table.message"),width:'13%',formatter: function (val,row) {
                    if(row.type=="vm"){
                        if(val=="null"||val==null||val==" "){
                            return "<span>-</span>";
                        }else{
                            return '<span style="padding-left: 5px;">' +ef.util.getLocale(val)+'</span>';
                        }
                    }
                    if(row.type=="host"){
                        if(val=="null"||val==null||val==" "){
                            return "<span>-</span>";
                        }else{
                            return '<a style="padding-left: 5px;" title="'+val+'">'+val+'</a>';
                        }
                    }

                }},
                {field:'level',title:ef.util.getLocale("alarm.host.table.level"),width:'10%',formatter: function (val) {
                    if(val=="fatal"){
                        return '<span><i class="warn-icon warn-icon-fault"></i>'+alarm.getLevel(val).label+'</span>';
                    }else if(val=="warning"){
                        return '<span><i class="warn-icon warn-icon-warn"></i>'+alarm.getLevel(val).label+'</span>';
                    }else{
                        return '<span><i class="warn-icon warn-icon-attention"></i>'+alarm.getLevel(val).label+'</span>';
                    }
                }},
                {field:'create_at',title:ef.util.getLocale("alarm.host.table.create_at"),width:'15%',formatter: function (val) {
                    return '<span style="padding-left: 7px;">' +ef.util.number2time(val,"Y-M-D h:m:s",true)+'</span>';
                }},
                {field:'update_at',title:ef.util.getLocale("alarm.host.table.update_at"),width:'15%',formatter: function (val) {
                    if(!val){
                        return "<span style='padding-left: 9px'>-</span>";
                    }
                    return ef.util.number2time(val,"Y-M-D h:m:s",true);
                }},
                {field:'operate',title:ef.util.getLocale("alarm.host.table.operate"),width:'14%',formatter: function (val,row) {
                    var dom = $("<a  href='#' style='text-decoration: none;color: #4DA4D6;padding-left:9px;'>"+ef.util.getLocale("alarm.host.table.operate.value")+"</a>");
                    dom.click(function () {
                        ef.messager.confirm('deleting', ef.util.getLocale("alarm.delete.warning")+"?",null,function(ok){
                            if (ok) {
                                ef.loading.show();
                                ef.getJSON({
                                    url:api.getAPI("alarmAction")+"/"+row.id,
                                    type:"delete",
                                    success: function () {
                                        ef.loading.hide();
                                        implement.alarmRef(true,0,0);
                                        ef.placard.tick(ef.util.getLocale("alarm.delete.success.placard"));
                                        //implement.clear();
                                        $(".resUser").textbox('clear');
                                        $("#typeSel").combobox('clear');
                                        $("#levelSel").combobox('reset');
                                    }
                                });
                            }else{
                                $("#alarmList").datagrid("uncheckAll");
                            }
                       });
                    });
                    return dom;
                }}
            ]]
        }).datagrid("loading");
    };
    implement.limitAll=function(){
        var ph =$("#alarmList").datagrid("getPanel").height();
        implement.limit = Math.floor(parseInt((ph-70)/36));
        $("#alarmList").datagrid("getPager").pagination({pageSize:implement.limit});
        return implement.limit ;
    };
    implement.reference = function (startnumber) {//根据搜索条件搜索内容
        var option = $("#optionSel").textbox('getValue');
        var type = $("#typeSel").combobox('getValue');
        var level = $("#levelSel").combobox('getValue');
        type=type=="all"?"":type;
        level=level=="all"?"":level;
        var arg=arguments;
        ef.getJSON({
                url:api.getAPI("alarm"),
                type:"get",
                useLocal:false,
                data:(function(){
                    var obj = {};
                    if(option){
                        obj.target = option;
                    }
                    if(type){
                        obj.type = type;
                    }
                    if(level){
                        obj.level = level;
                    }
                    obj.start=startnumber;
                    obj.limit=implement.limitAll();
                    return obj;
                })(),
                success: function (response,allResult) {
                    response=ef.util.sort("id",response);
                    response = response.reverse();
                    $("#alarmList").datagrid({"data":response}).datagrid('getPager').pagination(
                        {
                            showPageList:false,//定义是否显示页面导航列表。
                            showRefresh:false,
                            onSelectPage:function(pageNumber, pageSize)
                            {
                                var pagenumber =(pageNumber-1)*implement.limit;  // 第多少个数字
                                arg.callee(pagenumber);
                            }
                        }).pagination("refresh",{total:allResult.total,pageNumber:(startnumber/implement.limit)+1});
                    $("#alarmList").datagrid('loaded');
                    //$("#alarmList").datagrid("loadData",response);
                }
            });

    };
    /*implement.filter=function(){
         var option = $("#optionSel").textbox('getValue');
         var type = $("#typeSel").combobox('getValue');
         var level = $("#levelSel").combobox('getValue');
         $("#alarmList").datagrid({
         loadFilter:function(data){
            return ef.util.search(data,{filterFunction:function(item){
         if(option)
         {
            return item.target&&item.target.indexOf(option)!=-1;
         }else
         {
            return true;
         }
         }},{
            key:"type",
            value:type
         },{
            key:"level",
            value:level
         });
         }
         }).datagrid("clientPaging");
    };*/
    implement.redraw=function()
    {
        ef.util.ready(function (dom) {
                var _data;
                _data = dom.data("pageData");
                implement.table();
                implement.limitAll();
                $("#optionSel").textbox({
                prompt: ef.util.getLocale('alarm.promote.option'),
                iconCls: 'icon-search',
                iconAlign: 'left',
                onChange: function (newValue, oldValue) {
                        implement.reference(0);
                }
            });
                $("#typeSel").combobox({
                prompt: ef.util.getLocale('alarm.promote.type'),
                data: alarm.getAlarmTypes(),
                valueField: 'value',
                textField: 'label',
                editable: false,
                onChange: function (newValue, oldValue) {
                        implement.reference(0);
                }
            });
                var tmp = alarm.getAlarmLevels();
                $(tmp).each(function (i, il) {
                if (il.value == _data) {
                    il.selected = true;
                } else {
                    delete il.selected;
                }
            });
                $("#levelSel").combobox({
                prompt: ef.util.getLocale('alarm.promote.level'),
                data: tmp,
                valueField: 'value',
                textField: 'label',
                editable: false,
                onChange: function (newValue, oldValue) {
                        implement.reference(0);
                }
            });
                $("#reset").click(function () {
                    if($(".resUser").textbox("getValue")||$("#typeSel").combobox("getValue")||$("#levelSel").combobox("getValue")){
                        $(".resUser").textbox('clear');
                        $("#typeSel").combobox('clear');
                        $("#levelSel").combobox('reset');
                    }else{
                       // implement.alarmRef(true,0,1);
                        implement.reference(0);
                    }

            });
            if(!_data){
                implement.alarmRef(true,0,0,_data);
            }
            $(window).resize(function () {
                try {

                    var hei = Number($(window).height())-Number($(".datagrid-wrap.panel-body").offset().top);
                }catch (e){
                    return ;
                }
                var heig = (hei-30)>430?hei-30:430;
                $("#alarmList").datagrid('resize',{height:heig});
            });
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});