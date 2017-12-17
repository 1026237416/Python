/**
 * Created by wangahui1 on 15/11/10.
 */
define(["easyui","clientPaging","module","api","setting.param"],function(easyui,clientPaging,module,api,settingParam)
{
    var implement=new ef.Interface.implement();
    var _iconchange = null,
        _stack = null,
        _route = null,
        currentModule = null,
        beforeIndex = -1,
        iconStep=null,
        resultList=null;
    var cpuQuota,memoQuota,saveQuota,operate;
    //初始化文本框
    implement.text = function () {
      $("#easyname").textbox({
          required:true,
          maxlength:15,
          minlength:1,
          validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'
      });
        $("#datacenter").textbox({
            required:true,
            maxlength:15,
            minlength:1,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'
        });
        $("#projectInput").textbox({
            required:true,
            maxlength:15,
            minlength:1,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'
        });
        $("#user").textbox({
            required:true,
            maxlength:15,
            minlength:1,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'
        });
        $("#image").textbox({
            required:true,
            maxlength:15,
            minlength:1,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'
        });
        $("#datadishname").textbox({
            maxlength:15,
            minlength:1,
            required:true,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_","数字,字母,中文和下划线"]'
        });
    };
    implement.init=function()
    {
        this.isForce=true;
        settingParam.getList(this.isForce,function(response)
        {
            var cpuRange=ef.util.find(response,function(record)
            {
                return record.name=="compute.cpu_range";
            }).value;
            var memRange=ef.util.find(response,function(record)
            {
                return record.name=="compute.memory_range";
            }).value;
            cpuRange=cpuRange.split("/");
            memRange=memRange.split("/");
            cpuQuota = $(".cpuRange").squire({
                allBackClass:"saveQuota",
                data:cpuRange
            });
            memoQuota = $(".memoRange").squire({
                allBackClass:"saveQuota",
                data:memRange
            });
        });
        ef.getJSON({
            url:api.getAPI("order.wait.Detail.save.ip"),
            type:"get",
            success: function (response) {
                var data = ef.util.pluck(response,'name');
                saveQuota = $(".saveRange").squire({
                    allBackClass:"saveQuota",
                    data:data
                });
            }
        });
        operate = $(".operate-list").squire({
            allBackClass:"operate",
            data:[
                {
                    iconClass:"icon1",
                    text:"windows"
                },
                {
                    iconClass:"icon2",
                    text:"centos"
                },
                {
                    iconClass:"icon3",
                    text:"ubuntu"
                },
                {
                    iconClass:"icon4",
                    text:"redhat"
                },
                {
                    iconClass:"icon5",
                    text:"suse"
                },
                {
                    iconClass:"icon6",
                    text:"fedora"
                },
                {
                    iconClass:"icon7",
                    text:"debian"
                },
                {
                    iconClass:"icon8",
                    text:"neokylin"
                }
            ]
        });
    };
    implement.redraw=function()
    {
        iconStep=$(".step_wrapper").iconstep([
            {
                text:ef.util.getLocale('host.addhost.dialog.iconstep.info.text'),
                iconClass:"svm-step-base-icon",
                iconSelectedClass:"svm-step-base-icon-select",
                selected:true
            },
            {
                text:ef.util.getLocale('host.addhost.dialog.iconstep.setting.text'),
                iconClass:"svm-step-setting-icon",
                iconSelectedClass:"svm-step-setting-icon-select",
                selected:false
            },
            {
                text:ef.util.getLocale('setting.project.detail.network.host'),
                iconClass:"svm-step-net-icon",
                iconSelectedClass:"svm-step-net-icon-select",
                selected:false
            }
        ]).click(function(step)
        {
            _route.goto(step);
            _stack.goto(step);

        });
        resultList=$("#resultBox").resultList( {
            id:"resultData",
            title:"预览",
            textField:"label",
            valueField:"value",
            groupField:"group",
            data:[
                {
                    label:"名称",
                    value:"name",
                    group:"基本信息"
                },
                {
                    label:"项目",
                    value:"project",
                    group:"基本信息"
                },
                {
                    label:"用户",
                    value:"user",
                    group:"基本信息"
                },
                {
                    label:"存储类型",
                    value:"store",
                    group:"基本信息"
                },
                {
                    label:"数量",
                    value:"account",
                    group:"基本信息"
                },
                {
                    label:"操作系统",
                    value:"os",
                    group:"基本信息"
                },
                {
                    label:"镜像",
                    value:"image",
                    group:"基本信息"
                },
                {
                    label:"高可用",
                    value:"ha",
                    group:"基本信息"
                }

                ,
                {
                    label:"CPU",
                    value:"cpu",
                    group:"选择配置"
                },
                {
                    label:"内存",
                    value:"memo",
                    group:"选择配置"
                },
                {
                    label:"系统盘容量",
                    value:"capability",
                    group:"选择配置"
                },
                {
                    label:"IP",
                    value:"nets",
                    group:"网络",
                    list: [
                        {
                            filed: 'ip'
                        }
                    ]
                },
                {
                    label:"宿主机",
                    value:"vmhost",
                    group:"网络"
                },
                {
                    label:"备注",
                    value:"des",
                    group:"网络"
                }
            ]
        });
        implement.utils.buttonStep();
        implement.utils.loadStep(0,_stack.children[0]);
        beforeIndex = 0;
        /*$(document).ready(function () {
            implement.text();
            $("#name").before(ef.util.getLocale("host.comboxtoinput.name"));
            $('#overaddhostswitch').switchbutton({
                checked: false,
                readonly:true
            });
            $("#route").css("margin-top","15px");
            //国际化
            $("#pos").before(ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.operatingsystemfield"));
            $("#quota").before(ef.util.getLocale("cal.host.choose.quata"));
            $("#quotacpu").append(ef.util.getLocale("cal.host.choose.quata.cpu"));
            $("#quatomemo").append(ef.util.getLocale("cal.host.choose.quata.memo"));
            $("#closewarn").append(ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.openclosefield"));
            $("#allocation").append(ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.allocationstrategy"));
            $("#sliderbackup").append(ef.util.getLocale("cal.host.backup"));
            $("#util").append(ef.util.getLocale("cal.host.util"));
            $("#GB").append(ef.util.getLocale("cal.host.GB"));
            $("#datadishGB").append(ef.util.getLocale("cal.host.GB"));
            $("#datadish").append(ef.util.getLocale("cal.host.datadish"));
            $("#ldatadishvolunm").append(ef.util.getLocale("cal.host.datadish.volunm"));

            $("#ldatadishname").append(ef.util.getLocale("cal.host.datadish.name"));
            $("#lname").append(ef.util.getLocale("cal.host.datadish.name"));
            $("#lquota").append(ef.util.getLocale("cal.host.quato"));
            $("#ldatadish").append(ef.util.getLocale("cal.host.datadish"));
            $("#los").append(ef.util.getLocale("cal.host.os"));
            $("#lclosewarn").append(ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.openclosefield"));
            $("#1allocation").append(ef.util.getLocale("cal.host.allocation"));
            $("#lbackup").append(ef.util.getLocale("cal.host.backup"));
            $("#addhostvolume").textbox({
                validType: 'reg[/^(([1-9]\\d)|([1-9](\\d{2}))|(1(\\d{3})|20[0-4][0-8]))$/]',
                maxlength:4,
                value:10
            });
            $("#datadishslider").slider({
                onComplete: function (value) {
                    $("#addhostvolume").textbox('clear').textbox('setValue',value);
                }
            });
            $("#addhostvolume").textbox({
                onChange:function () {
                var newValue = $("#addhostvolume").textbox('getValue');
                $("#datadishslider").slider("setValue", newValue);
            }
            });
            //滑动slider
            implement.init();
            //开关switch
            $('#swtich').tooltip({
                content: '<span class="switch" style="color:#fff">'+ef.util.getLocale("host.hostdetail.blocklistlabel.description.switch.tooltipopen")+'</span>'
            });
            $('#addhostswitch').switchbutton({
                checked: false,
                onChange: function(checked){
                    if(checked==true){
                        $('#swtich').tooltip({
                            content: '<span class="switch" style="color:#fff">'+ef.util.getLocale("host.hostdetail.blocklistlabel.description.switch.tooltipclose")+'</span>'
                        });
                    }
                    else if(checked==false){
                        $('#swtich').tooltip({
                            content: '<span class="switch" style="color:#fff">'+ef.util.getLocale("host.hostdetail.blocklistlabel.description.switch.tooltipopen")+'</span>'
                        });
                    }
                    ef.localStorage.put("cal.host.addHost.switch.checked",checked);
                    $('#overaddhostswitch').switchbutton({
                        checked: ef.localStorage.get("cal.host.addHost.switch.checked"),
                        readonly:true
                    });

                }
            });
            $("#addHostlist").datagrid({
                columns:[[
                    {field:'name',title:ef.util.getLocale("cal.disk.diskDetail.diskdetaildescript.namefield"),width:'25%'},
                    {field:'memo',title:ef.util.getLocale("cal.host.datadish.volunm.table"),width:'25%'},
                    {field:'save',title:"存储类型",width:'30%',formatter:function(val,row){
                        var dom = $('<span class="saveType" value=""></span>');
                        dom.combobox({
                            prompt:"请选择存储类型",
                            height:150,
                            width:30,
                            onChange: function (newValue) {
                                dom.attr({value:newValue});
                            }
                        });
                        return dom;
                    }},
                    {field:'delete',title:" ",width:'15%'}
                ]]
            });
            $("#add_datadish").click(function () {
                if(!$("#datadishname").textbox('isValid')){return;}
                var gridname = $("#datadishname").textbox('getValue');
                var gridmemo = $("#datadishslider").slider('getValue');
                $("#addHostlist").datagrid('insertRow', {
                    index: 0,	// 索引从0开始
                    row: {
                        name:gridname,
                        memo: gridmemo,
                        delete:'<span><i class="addhost-adddatadish" id="add_datadish" style="background-position: -58px -168px;cursor: pointer;"></i></span>'
                    }
                });
                $("#datadishname").textbox("clear");
                $("#addhostvolume").textbox('setValue',10);
                $("#datadishslider").slider('clear');
            });
            $('#addHostlist').datagrid({
                onClickCell: function(index,field,value){
                    if(field=="delete"){
                        $('#addHostlist').datagrid('deleteRow',index);
                    }
                }
            });
            _iconchange=$(".host-step-cont").iconchange(
                [
                    {
                        text:ef.util.getLocale('host.addhost.dialog.iconstep.info.text'),//"基本信息",
                        iconClass:"step-change-info",
                        iconAllClass:"step-change-all-info",
                        iconSelectedClass:"step-change-all-info-select",
                        selected:true
                    },
                    {
                        text:ef.util.getLocale('host.addhost.dialog.iconstep.setting.text'),//"配置选择",
                        iconClass:"step-change-quota",
                        iconAllClass:"step-change-all-quota",
                        iconSelectedClass:"step-change-all-quota-select",
                        selected:false
                    },
                    {
                        text:"网络",//"网络和主机",
                        iconClass:"step-change-net",
                        iconAllClass:"step-change-all-net",
                        iconSelectedClass:"step-change-all-net-select",
                        selected:false
                    },
                    {
                        text:"数据盘",//"网络和主机",
                        iconClass:"step-change-disk",
                        iconAllClass:"step-change-all-disk",
                        iconSelectedClass:"step-change-all-disk-select",
                        selected:false
                    },
                    {
                        text:ef.util.getLocale('host.addhost.dialog.iconstep.finish.text'),//"完成",
                        iconClass:"step-change-over",
                        iconAllClass:"step-change-all-over",
                        iconSelectedClass:"step-change-all-over-select",
                        selected:false
                    }
                ],1000);
            _iconchange.click(function(step){
                _route.goto(step);
                _stack.goto(step);
            });
            var _stack=$(".viewstack-box").viewstack();
            var os;
            operate.click(function(data)
            {
                os=data;
            });
            var _route = $(".button-route-box").buttonstep({length:5}).change(function(pos)
            {
                if(!$("#easyname").textbox('isValid')){
                    _route.goto(0);
                    _stack.goto(0);
                    _iconchange.goto(0);
                    return;
                }
                else if(!os){
                    _route.goto(0);
                    _stack.goto(0);
                    _iconchange.goto(0);
                    ef.placard.show(ef.util.getLocale("cal.addhost.os.null"));
                    return;
                }
                if(pos==3){
                    $("#route").css("margin-top","40px");
                }
                else{
                    $("#route").css("margin-top","15px");
                }
                var row_data_name = [];
                var row_data_volume = [];
                var rows = $("#addHostlist").datagrid('getRows');
                $("#overdatadish").empty();
                if(rows.length!=0){
                    for(var i=0;i<rows.length;i++){
                        row_data_name.push(rows[i].name);
                        row_data_volume.push(rows[i].memo);
                    }
                    for(var i=0;i<rows.length;i++){
                        $("#overdatadish").append('<span style="width: 70px;float: left">'+row_data_name[i]+'</span>'+'<span style="margin-left: 10px">'+row_data_volume[i]+ef.util.getLocale("cal.host.GB")+'</span><br/>');//GB
                    }
                }
                //$("#overquota").empty().append($("#cpuinput").val()+ef.util.getLocale("cal.host.util")+$("#memoinput").val()+"GB");//个
                //$("#overname").empty().append($("#easyname").textbox('getValue'));
                //$("#overstrategy").empty().append($("#strategy").combobox("getText"));
                //$("#overbackup").empty().append($("#addhostremark").val());
                //$("#overos").empty().append($(".operate-list .selected span").text());
                _iconchange.goto(pos);
                _stack.goto(pos);
            }).confirm(function()
            {
                var choose;
                if(ef.localStorage.get("cal.host.addHost.switch.checked")==true){
                    choose=1;
                }
                else{
                    choose=0;
                }
                var host = [];
                host.push({
                    "displayname": $("#easyname").textbox('getValue'),
                    "os": os,
                    "cores": Number($("#cpuinput").val()),
                    "memory": Number($("#memoinput").val())*1024,
                    "keepalive": choose,
                    "create_policy": Number($("#strategy").combobox("getValue"))
                });
                var _row = $("#addHostlist").datagrid('getRows');
                var vol = [];
                $(_row).each(function (i,il) {
                    var item={displayname: "", size: ""};
                    item.displayname=il.name;
                    item.size=il.memo;
                    vol.push(item);
                });
                var res = host.concat(vol);
                this.setEnabled(false);
                var _self=this;
                ef.getJSON(
                    {
                        url:api.getAPI("order"),
                        type:"put",//get,post,put,delete
                        isForce:true,
                        data:{
                            "type": 0,
                            "des": $("#addhostremark").val(),
                            "resources":res
                        },
                        success:function(response)
                        {
                            ef.placard.tick(ef.util.getLocale("cal.host.add.promote"));
                            ef.Dialog.close("addHostDialog");
                            _self.setEnabled(true);
                        },
                        error:function(error)
                        {
                            _self.setEnabled(true);
                        }
                    });
            });
            $(".os").hide();
            //$(".operate-list li").click(function()
            //{
            //    $(this).removeClass("selected");
            //    $(".os").remove();
            //    if($(this).hasClass("selected")){return;}
            //    $(this).addClass("selected");
            //    $(this).siblings().removeClass("selected");
            //    $(this).append('<i class="os"></i>');
            //});
            $("#user").hide();
            $("#ten").combobox({
                onSelect: function (record) {
                    $("#user").show();
                }
            });
        })*/
    };
    implement.destroy=function()
    {
        $('.tooltip').hide();
        ef.event.off("calNumberChangeEvent");
        ef.event.off("calCpuMemEvent");
        ef.event.off("calImageEvent");
        ef.event.off("calLvmEvent");
        _stack = null;
        _route = null;
        $('#cal_vlan').combobox('destroy');
        $('#cal_vlan').remove();
        //_iconchange.destroy();
        require.undef(module.id);
    };
    implement.utils = {

        buttonStep:function(){
            _stack = $(".viewstack-box")
                .viewstack()
                .change(function(pos,dom){
                    implement.utils.loadStep(pos,dom);
                    if(resultList)
                    {
                        resultList.goto(pos);
                    }
                });
            //缓存_stack用来保存数据
            ef.localStorage.put('cal.host.create',_stack);
            _route = $(".button-route-box")
                .buttonstep({length:3})
                .change(function(pos){
                    $(".tooltip").hide();
                    //点击下一步的时候验证数据
                    if(pos > beforeIndex){
                        if(!currentModule.utils.isValid()){
                            _route.goto(pos-1);
                            implement.utils.iconStep(pos-1);
                            return;
                        }
                    }
                    _stack.goto(pos);
                    implement.utils.iconStep(pos);
                 })
                .confirm(function(){
                    //valid last page data
                    var isLocal=false;
                    ef.loading.show();
                    if(!currentModule ||
                       !currentModule.utils ||
                       !_.isFunction(currentModule.utils.isValid)){
                        ef.loading.hide();
                        return;
                    }
                    var isValid = currentModule.utils.isValid();
                    if(!isValid){
                        ef.loading.hide();
                        return;
                    }
                    var willData = implement.sendSeverData.sendData();
                    ef.getJSON({
                        url:api.getAPI("cal.host.getHostlist"),
                        type:'put',
                        data:willData,
                        useLocal:isLocal,
                        success:function(response){
                            $('.tooltip').hide();
                            implement.destroy();
                            ef.event.off("calNumberChangeEvent");
                            ef.event.off("calCpuMemEvent");
                            ef.Dialog.close("addHostDialog");
                            ef.nav.reload();
                            ef.loading.hide();
                            ef.placard.doing(ef.util.getLocale("cal.host.addhost.placard"));
                        },
                        error:function(error){
                            ef.loading.hide();
                            console.log(error);
                        }
                    });
                });
        },
        loadStep:function(pos,elem){
            console.log(pos,elem.dom[0]);
            var config = implement.config.buttonStepConfig[pos],
                $elem = $(elem.dom[0]),
                loaded =  elem.loaded;
            //任何情况下最后一页都要重新加载
            if(pos == 3){
                loaded =  elem.loaded = false;
            }
            //点击上一步的时候不用重新加载页面
            //点击下一步的时候必须要重新加载页面
            if(!loaded && pos > beforeIndex){
                ef.loading.show();
                $elem.empty();
                $elem.load(config.temp,function(template){
                    require.undef(config.jsModule);
                    require([config.jsModule],function(module){
                        currentModule = module;
                        config.module = module;
                        module.redraw($elem);
                        elem.loaded = true;
                        beforeIndex = pos;
                        ef.loading.hide();
                    });
                });
            }else{
                currentModule = config.module;
                beforeIndex = pos;
            }
        },
        iconStep:function(pos){
            iconStep.goto(pos);
        }
    };
    implement.isValid = function(){
        var networks = ef.localStorage.get('cal.host.create').children[2].viewData;
        if(!networks){
            return false
        }
        if(!networks.network.length){
            ef.placard.error(ef.util.getLocale('cal.create.vm.no.vlan'));
            return false;
        }
        //if(!desCombox.textbox('isValid') || !ipData){
        //    return false;
        //}
        //var sameValue = impls.utils.hasSameValue();
        //if(sameValue){
        //    ef.placard.error(ef.util.getLocale('cal.create.vm.same.ip'));
        //    return false;
        //}
        return true;
    };
    implement.sendSeverData = {
      /*  getData:function(){
         var dataAll = ef.localStorage.get('cal.host.create').children;
         var data={};
         for(var i= 0;i<dataAll.length;i++){
         if(i==0){
         data.vmName=dataAll[i].viewData.vmName;
         data.vmNum=dataAll[i].viewData.vmNum;
         data.pro=dataAll[i].viewData.pro.name;
         data.tent=(function(){
         if(dataAll[i].viewData.tent==undefined){
         return dataAll[i].viewData.tent;
         }else{
         return dataAll[i].viewData.tent.displayname;
         }
         })();
         data.default_type=dataAll[i].viewData.default_type;
         data.switch_type=dataAll[i].viewData.switch_type;
         data.system=dataAll[i].viewData.system;
         data.img=dataAll[i].viewData.img.name;
         }
         else if(i==1){
         data.cpu_range=dataAll[i].viewData.cpu_range;
         data.memory_range=dataAll[i].viewData.memory_range;
         /!* data.default_type=dataAll[i].viewData.default_type;
         data.switch_type=dataAll[i].viewData.switch_type;*!/
         data.topic=dataAll[i].viewData.topic;
         data.lsys_volume=dataAll[i].viewData.lsys_volume;
         }
         else if(i==2){
         data.vlans=dataAll[i].viewData.network;
         data.svm=dataAll[i].viewData.svm;
         data.desc=dataAll[i].viewData.desc;
         }
         }
         return data;
         },*/
        sendData:function(){
            //ef.localStorage.get('cal.host.create').children[2].viewData = viewData;
            var dataAll = ef.localStorage.get('cal.host.create').children;
            var overData={
                "cores":parseInt(dataAll[1].viewData.cpu_range),//虚拟机内核数
                "memory": parseInt(dataAll[1].viewData.memory_range)*1024,//虚拟机内存（MB）
                "image": dataAll[0].viewData.img.id,//虚拟机镜像ID
                "tenant": dataAll[0].viewData.pro.id,//项目id
                "host": (function(){
                    if(!dataAll[2].viewData.svm){
                        return "";
                    }
                    if(String(dataAll[2].viewData.svm.id).indexOf('strategy') != -1){
                        return '';
                    }else{
                        return dataAll[2].viewData.svm.name;
                    }
                })(),//宿主机名称--->1:undefined,2:策略,3：宿主机
                "num": parseInt(dataAll[0].viewData.vmNum),//云主机数量
                "size":parseInt(dataAll[1].viewData.lsys_volume),
                "network":(function(){
                    var arr=[];
                    $(dataAll[2].viewData.network).each(function(i,il){
                        var ip=String(il.ip.value).indexOf('*') > -1? "":il.ip.value;
                        var subnet=il.subnet.value;
                        var vlan=il.vlan.value;
                        var mac=il.mac.value;
                        arr[i]={
                            "vlan":vlan,
                            "subnet":subnet,
                            "ip":ip,
                            "mac": mac
                        };
                    });
                    return arr;
                })(),
                "metadata":{
                    "user":(function(){
                        if(dataAll[0].viewData.tent&&dataAll[0].viewData.tent.id){
                            return dataAll[0].viewData.tent.id
                        }else{
                            return "";
                        }
                    })(),//用户ID,
                    "extend":{
                        "des":dataAll[2].viewData.desc,//虚拟机备注
                        "displayname":dataAll[0].viewData.vmName,//虚拟机别名
                        "keepalive":(function(){
                            if(dataAll[0].viewData.switch_type){
                                return 1;
                            }else{
                                return 0;
                            }
                        })()//虚拟机关机警告
                    },
                    "sys_volume":{
                        "type":(function(){
                            if(dataAll[0].viewData.default_type.id== 'lvm' ||
                               dataAll[0].viewData.default_type.id == ''){
                                return '';
                            }else{
                                return dataAll[0].viewData.default_type.name;
                            }
                        })()//系统盘类别
                    }
                }
            };
            return overData;
        }
    };
    implement.config = {
        buttonStepConfig:{
            0:{
                temp:'views/cal.host.create.basic.html',
                jsModule:'cal.host.create.basic'
            },
            1:{
                temp:'views/cal.host.create.config.html',
                jsModule:'cal.host.create.config'
            },
            2:{
                temp:'views/cal.host.create.network.html',
                jsModule:'cal.host.create.network'
            }
        },
        iconStepConfig:[
            {
                text:ef.util.getLocale('host.addhost.dialog.iconstep.info.text'),//"基本信息",
                iconClass:"svm-step-base-icon",
                iconAllClass:"step-change-all-info",
                iconSelectedClass:"step-change-all-info-select",
                selected:true
            },
            {
                text:ef.util.getLocale('host.addhost.dialog.iconstep.setting.text'),//"配置选择",
                iconClass:"svm-step-setting-icon",
                iconAllClass:"step-change-all-quota",
                iconSelectedClass:"step-change-all-quota-select",
                selected:false
            },
            {
                text:ef.util.getLocale('setting.project.detail.network'),//"网络"
                iconClass:"step-change-net",
                iconAllClass:"step-change-all-net",
                iconSelectedClass:"step-change-all-net-select",
                selected:false
            }
        ]
    };
    return implement;
});