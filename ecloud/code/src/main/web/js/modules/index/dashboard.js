/**
/**
 * Created by wangahui1 on 15/11/6.
 */
define(["echart","module","domReady","api","user"],function(echarts,module,domReady,api,user)
{
    var socket = null;
    var i = 0;
    var implement=ef.Interface.implement();
    implement.getOperateAction=function(type,opearation,vmd)
    {
        var arrs;
        if(!vmd){
            arrs=["server.operate",type,opearation];
        }else{
            arrs=["server.operate",type,opearation,vmd];
        }
        return ef.util.getLocale(arrs.join("."));
    };
    implement.init=function()
    {
        this.isForce=true;
        this.cpuChart=null;
        this.memoChart=null;
        this.cpuInter=null;
        this.memoInter=null;
        this.logInter=null;
        this.numInter=null;
        implement.cpuOption = {
            title : {
                //text: '温度计式图表',
                //subtext: 'From ExcelHome',
                //sublink: 'http://e.weibo.com/1341556070/AizJXrAEa'
                text: 'CPU利用率TOP5',
                x:'center',
                textStyle:{
                    fontSize:13,
                    color:'#333333',
                    fontStyle:'normal',
                    fontWeight:'normal'
                }
            },
            tooltip : {
                padding: 5,
                trigger: 'axis',
                axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                    type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                },
                textStyle: {
                    fontSize: 10
                },
                formatter: function (params,ser,fn){
                    var _data=params[0].data;
                    _data=_data?_data:{used:0,left:0,total:0};
                    var used=!_data.value?0:_data.value;
                    return "IP:"+params[0].name + '<br/>'
                        +ef.util.getLocale("dashboard.echart.cpu.rate.name")+' : ' + used +(_data.unit?_data.unit:"%")+' <br/>'
                        +ef.util.getLocale("dashboard.echart.cpu.used.name")+" : "+_data.used+"(GHz)</br>"
                        +ef.util.getLocale("dashboard.echart.cpu.left.name")+" : "+_data.left+"(GHz)</br>"
                        +ef.util.getLocale("dashboard.echart.cpu.total.name")+" : "+_data.total+"(MHz)";
                }
            },
            grid:{
                x: 50,
                x2: 15,
                y2: 85
            },
            calculable : true,
            xAxis : [
                {
                   /* name:"IP",*/
                    type : 'category',
                    data : [],
                    axisLabel : {
                        rotate:35,
                        margin: 8,
                        interval: 0
                    },
                    splitLine:{
                        show:true
                    }
                }
            ],
            yAxis : [
                {
                    min:0,
                    max:100,
                    splitNumber:5,
                    interval:20,
                    axisTick:
                    {
                        length:5
                    },
                    name:"%",
                    type : 'value',
                    boundaryGap: [0, 0],
                    axisLabel : {
                        formatter : '{value}'
                    }
                }
            ],
            series : [
                {
                    name:ef.util.getLocale("dashboard.echart.cpu.used.name"),
                    type:'bar',
                    barCategoryGap: '65%',
                    barMaxWidth: 60,
                    itemStyle: {
                        normal: {
                            color: '#3d67df',
                            barBorderColor: '#3d67df',
                            barBorderWidth: 0,
                            barBorderRadius:0
                        }
                    },
                    label : {
                        normal:
                        {
                            show: true,
                            position: 'top',
                            formatter: function (params) {
                                return params.value+"%";
                            },
                            textStyle:
                            {
                                color:"#3d67df"
                            }
                        }
                    },
                    data:[]
                }
            ]
        };
        implement.memoOption = {
            total:0,
            used:0,
            left:0,
            title : {
                //text: '温度计式图表',
                //subtext: 'From ExcelHome',
                //sublink: 'http://e.weibo.com/1341556070/AizJXrAEa'
                text: '内存使用率TOP5',
                x:'center',
                textStyle:{
                    fontSize:13,
                    color:'#333333',
                    fontStyle:'normal',
                    fontWeight:'normal'
                }
            },
            tooltip : {
                padding: 5,
                trigger: 'axis',
                axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                    type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                },
                textStyle: {
                    fontSize: 10
                },
                formatter: function (params){
                    var _data=params[0].data;
                    _data=_data||{used:0,left:0,total:0};
                    var used=!_data.value?0:_data.value;
                    return "IP:"+params[0].name + '<br/>'
                        +ef.util.getLocale("dashboard.echart.memo.rate.name")+' : ' + used +(_data.unit?_data.unit:"%")+' <br/>'
                        +ef.util.getLocale("dashboard.echart.memo.used.name")+" : "+_data.used+"(GB)</br>"
                        +ef.util.getLocale("dashboard.echart.memo.left.name")+" : "+_data.left+"(GB)</br>"
                        +ef.util.getLocale("dashboard.echart.memo.total.name")+" : "+_data.total+"(GB)";
                }
            },
            grid:{
                x: 50,
                x2: 15,
                y2: 85
            },
            calculable : true,
            xAxis : [
                {
                   /* name:"IP",*/
                    type : 'category',
                    data : [],
                    axisLabel : {
                        rotate:35,
                        margin: 8,
                        interval: 0
                    },
                    splitLine:{
                        show:true
                    }
                }
            ],
            yAxis : [
                {
                    min:0,
                    max:100,
                    splitNumber:5,
                    interval:20,
                    name:"%",
                    type : 'value',
                    boundaryGap: [0, 0.1],
                    axisTick:
                    {
                        length:5
                    },
                    axisLabel : {
                        formatter:'{value}'
                    }
                }
            ],
            series : [
                {
                    name:ef.util.getLocale("dashboard.echart.memo.used.name"),
                    type:'bar',
                    barCategoryGap: '65%',
                    barMaxWidth: 60,
                    itemStyle: {
                        normal: {
                            color: '#3d67df',
                            barBorderColor: '#3d67df',
                            barBorderWidth: 0,
                            barBorderRadius:0
                        }
                    },
                    label : {
                        normal:
                        {
                            show: true,
                            position: 'top',
                            formatter: function (params) {
                                return params.value+"%";
                            },
                            textStyle:
                            {
                                color:"#3d67df"
                            }
                        }
                    },
                    data:[]
                }
            ]
        };
        if(!user.isSuper())
        {
            this.logInter=new ef.Timer(10000,function(count)
            {
                implement.refreshLog();
            },module.id,true);
            //this.logInter.start();
        }
        /*this.cpuInter=new ef.Timer(10000,function(count)
        {
            implement.refreshCpuChart();
        },module.id,true);
        //this.cpuInter.start();
        this.memoInter=new ef.Timer(10000,function()
        {
           implement.refreshMemoChart();
        },module.id,true);*/
        //this.memoInter.start();
        /*if(user.isSuper())
        {
            $(".right_area").empty().remove();
        }*/
        /*var statConfig = [{
            dom:".yun_left",
            oldValue:0,
            newValue:0,
            key:"vm_active",
            type:1,
            inter:$('.yun_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".yun_right",
            oldValue:0,
            newValue:0,
            key:"vm_stop",
            type:1,
            inter:$('.yun_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".disk_left",
            oldValue:0,
            newValue:0,
            key:"volume_num",
            type:3,
            inter:$('.disk_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".disk_right",
            oldValue:0,
            newValue:0,
            key:"volume_capacity_gb",
            type:2,
            inter:$('.disk_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".snap_left",
            oldValue:0,
            newValue:0,
            key:"vapp_available",
            type:1,
            inter:$('.snap_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".snap_right",
            oldValue:0,
            newValue:0,
            key:"vapp_unavailable",
            type:1,
            inter:$('.snap_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".backup_left",
            oldValue:0,
            newValue:0,
            key:"backup_num",
            type:3,
            inter:$('.backup_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".backup_right",
            oldValue:0,
            newValue:0,
            key:"backup_capacity_gb",
            type:6,
            inter:$('.backup_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".su_left",
            oldValue:0,
            newValue:0,
            key:"host_available",
            type:5,
            inter:$('.su_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".su_right",
            oldValue:0,
            newValue:0,
            key:"host_unavailable",
            type:5,
            inter:$('.su_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".ip_left",
            oldValue:0,
            newValue:0,
            key:"ip_active",
            type:3,
            inter:$('.ip_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".ip_right",
            oldValue:0,
            newValue:0,
            key:"ip_idle",
            type:3,
            inter:$('.ip_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        }];*/
        /*$(statConfig).each(function(index, item){
            item.inter = $(item.dom+' .num-b').incrementNum({oldValue:0,newValue:0,speed:1000});
        });*/
        implement.cardsInfoInit();
        $("#time").text(""+implement.getTime);
        try{
            implement.cpuChart = echarts.init($(".demo_dbox_left")[0]);
            //implement.cpuChart.setOption(implement.cpuOption,true);
            //implement.cpuChart.showLoading({text:"正在加载...",color:"#5c7dd9",maskColor: 'rgba(255, 255, 255, 0)'});
            implement.memoChart = echarts.init($(".demo_dbox_right")[0]);
            //implement.memoChart.setOption(implement.memoOption,true);
            //implement.memoChart.showLoading({text:"正在加载...",color:"#5c7dd9",maskColor: 'rgba(255, 255, 255, 0)'});
        }catch(err){
        }
        try{
            if(!socket){
                socket=new ef.server.Socket(api.getAPI('dashboard.cards.info',true),"dashboardCardInfos");
            }
            socket.onopen = function(){
                console.log('dashboard 连接成功');
            };
            socket.onmessage = function(arg){
                var data = JSON.parse(arg.data);
                var dataResp = data.response;
                console.log('socket message-----------',data.type,'------',data);
                //alarm(data);
                switch(data.type){
                    case 'top':
                        implement.topN(dataResp);
                        break;
                    case 'stat':
                        implement.cardsInfo(dataResp);
                        break;
                    case 'alarm':
                        implement.warn(dataResp);
                        break;
                    case 'log' :
                        implement.updateLog(dataResp.records,$(".dashboard_log_box"));
                        break;
                    default:
                        console.log(data.type);
                        break;
                }
                //function alarm(data){
                //    if(data.type!="alarm"){
                //        implement.warn({"fatal":100,"notice":100,"warning":100});
                //    }else{
                //        return
                //    }
                //}
                /*console.log('socket message-----------','i====',i,data);
                for(var key in data){
                    var index = _.findKey(statConfig,function(item){
                        return item.key == key;
                    });
                    if(index){//计算容量
                        var config = statConfig[index];
                        if(config.type==2|| config.type==6){
                            var unit=ef.util.getKGM(data[key]*1024*1024);
                            if(unit){
                                $(config.dom).next(".h_bottom").text(String(unit+"b").toUpperCase());
                                //if(config.type==2){
                                data[key]=(ef.util["gb2"+unit+"b"](data[key])).toFixed(2);
                               // }else{
                                //    data[key]=Math.floor(ef.util["gb2"+unit+"b"](data[key]));
                               // }
                            }
                        }
                        config.inter.play({newValue:data[key]},true);
                    }
                }*/
            };
        }catch(e){
            console.log('socket connection error',e);
        }
        /*var statConfig=
            [
                [{
                   dom:".su_left",
                   oldValue:0,
                   newValue:0,
                   speed:100,
                   key:"host_available",
                   type:5,
                   inter:10000
                },
                {
                    dom:".su_right",
                    oldValue:0,
                    newValue:0,
                    speed:100,
                    key:"host_unavailable",
                    type:5,
                    inter:10000
                }],
                [{
                    dom:".yun_left",
                    oldValue:0,
                    newValue:0,
                    speed:100,
                    key:"vm_active",
                    type:1,
                    inter:10000
                },
                {
                    dom:".yun_right",
                    oldValue:0,
                    newValue:0,
                    speed:100,
                    key:"vm_stop",
                    type:1,
                    inter:10000
                }],
                [{
                    dom:".ip_left",
                    oldValue:0,
                    newValue:0,
                    speed:5,
                    key:"ip_active",
                    type:3,
                    inter:10000
                },
                {
                    dom:".ip_right",
                    oldValue:0,
                    newValue:0,
                    speed:5,
                    key:"ip_idle",
                    type:3,
                    inter:10000
                }],
                [{
                    dom:".disk_left",
                    oldValue:0,
                    newValue:0,
                    speed:100,
                    key:"volume_num",
                    type:2,
                    inter:10000
                },
                {
                    dom:".disk_right",
                    oldValue:0,
                    newValue:0,
                    speed:100,
                    key:"volume_capacity_gb",
                    type:2,
                    inter:10000
                }],
                [{
                    dom:".snap_left",
                    oldValue:0,
                    newValue:0,
                    speed:100,
                    key:"vm_wo_num",
                    type:4,
                    inter:10000
                },
                {
                    dom:".snap_right",
                    oldValue:0,
                    newValue:0,
                    speed:100,
                    key:"vd_wo_num",
                    type:4,
                    inter:10000
                }],
                [{
                    dom:".backup_left",
                    oldValue:0,
                    newValue:0,
                    speed:100,
                    key:"backup_num",
                    type:6,
                    inter:10000
                },
                {
                    dom:".backup_right",
                    oldValue:0,
                    newValue:0,
                    speed:100,
                    key:"backup_capacity_gb",
                    type:6,
                    inter:10000
                }]
            ];*/
        /*$(statConfig).each(function(i,il)
        {
            var item0=il[0];
            var item1=il[1];
            var in0=$(".box-con").find(item0.dom+" .num-b").incrementNum({oldValue:item0.oldValue,newValue:item0.newValue,speed:item0.speed});
            var in1=$(".box-con").find(item1.dom+" .num-b").incrementNum({oldValue:item1.oldValue,newValue:item1.newValue,speed:item1.speed});
            var inter=new ef.Timer(item0.inter,function()
            {
                implement.getStatstic(item0.type,function(response)
                {
                    if(item1.type==2||item1.type==6)
                    {
                        var unit=ef.util.getKGM(response[item1.key]*1024*1024);
                        if(unit)
                        {
                            $(item1.dom).next(".h_bottom").text(String(unit+"b").toUpperCase());
                            response[item1.key]=Math.floor(ef.util["gb2"+unit+"b"](response[item1.key]));
                        }
                    }
                    in0.play({newValue:response[item0.key]},true);
                    in1.play({newValue:response[item1.key]},true);
                }, $.noop,function()
                {
                    inter.stop();
                });
            },module.id,true);
            //inter.start();

        });*/
    };
        implement.getTime=(function(){
            var date=new Date().getTime();
            return ef.util.number2time(date,"Y-M-D",true)
        })();
        implement.topN = function(data){
        /*implement.cpuChart.hideLoading();
        implement.memoChart.hideLoading();*/
        if(data['cpu_used']){
           /* data['cpu_used'][0]['host_ip'] = '192.168.132.112';
            data['cpu_used'][1]['host_ip'] = '192.168.132.116';*/
            //console.log(data['cpu_used']);
            implement.updateCpuChart(data['cpu_used']);
        }
        if(data['memory_used']){
            implement.updateMemoChart(data['memory_used']);
        }
    };
    implement.cardsInfoInit = function(){
        implement.statConfig = [{
            dom:".yun_left",
            oldValue:0,
            newValue:0,
            key:"vm_active",
            type:1,
            inter:$('.yun_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".yun_right",
            oldValue:0,
            newValue:0,
            key:"vm_stop",
            type:1,
            inter:$('.yun_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".disk_left",
            oldValue:0,
            newValue:0,
            key:"volume_num",
            type:3,
            inter:$('.disk_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".disk_right",
            oldValue:0,
            newValue:0,
            key:"volume_capacity_gb",
            type:2,
            inter:$('.disk_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".snap_left",
            oldValue:0,
            newValue:0,
            key:"vapp_available",
            type:1,
            inter:$('.snap_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".snap_right",
            oldValue:0,
            newValue:0,
            key:"vapp_unavailable",
            type:1,
            inter:$('.snap_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".backup_left",
            oldValue:0,
            newValue:0,
            key:"backup_num",
            type:3,
            inter:$('.backup_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".backup_right",
            oldValue:0,
            newValue:0,
            key:"backup_capacity_gb",
            type:6,
            inter:$('.backup_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".su_left",
            oldValue:0,
            newValue:0,
            key:"host_available",
            type:5,
            inter:$('.su_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".su_right",
            oldValue:0,
            newValue:0,
            key:"host_unavailable",
            type:5,
            inter:$('.su_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".ip_left",
            oldValue:0,
            newValue:0,
            key:"ip_active",
            type:3,
            inter:$('.ip_left .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        },{
            dom:".ip_right",
            oldValue:0,
            newValue:0,
            key:"ip_idle",
            type:3,
            inter:$('.ip_right .num-b').incrementNum({oldValue:0,newValue:0,total:10000})
        }];
    };
    implement.cardsInfo = function(data){
        var that = this;
        for(var key in data){
            var index = _.findKey(that.statConfig,function(item){
                return item.key == key;
            });
            if(index){
                var config = that.statConfig[index];
                if(config.type==2|| config.type==6){
                    var unit=ef.util.getKGM(data[key]*1024*1024);
                    if(unit == 'k'){
                        unit = 'g';
                    }
                    if(unit){
                        $(config.dom).next(".h_bottom").text(String(unit+"b").toUpperCase());
                        if(unit == 'g'){
                            data[key]=(ef.util["gb2"+unit+"b"](data[key])).toFixed(0);
                        }else{
                            data[key]=(ef.util["gb2"+unit+"b"](data[key])).toFixed(2);
                        }
                    }else{
                        console.log('error unit:',unit);
                    }
                }
                config.inter.play({newValue:data[key]},true);
            }
        }
    };
    /**刷新cpu图表*/
    implement.refreshCpuChart=function()
    {
        this.getCPUTop(5,this.isForce,function(response)
        {
            implement.cpuChart.hideLoading();
            implement.updateCpuChart(response);
        },function()
        {
            implement.cpuInter.destory();
        });
    };
    /**刷新内存图表*/
    implement.refreshMemoChart=function()
    {
        this.getMemoTop(5,this.isForce,function(response)
        {
            implement.memoChart.hideLoading();
            implement.updateMemoChart(response);
        },function()
        {
            implement.cpuInter.destory();
        });
    };
    /**告警*/
    implement.warn= function (response) {
                $("#fatal").incrementNum({oldValue:0,newValue:Number(response.fatal)});
                $("#warn").incrementNum({oldValue:0,newValue:Number(response.warning)});
                $("#notice").incrementNum({oldValue:0,newValue:Number(response.notice)});
                var obj = {level:""};
                $(".tree_list ul li:eq(0)").click(function () {
                    obj.level="fatal";
                    ef.nav.goto("warn.host.html", "warn.host", obj.level, null, "warn.host");
                });
                $(".tree_list ul li:eq(1)").click(function () {
                    obj.level="warning";
                    ef.nav.goto("warn.host.html", "warn.host",  obj.level, null, "warn.host");
                });
                $(".tree_list ul li:eq(2)").click(function () {
                    obj.level = "notice";
                    ef.nav.goto("warn.host.html", "warn.host", obj.level, null, "warn.host");
                })
    };
    /**刷新日志*/
    /*implement.refreshLog=function()
    {
        this.getLog(0,15,this.isForce,function(response)
        {
            implement.updateLog(response,$(".dashboard_log_box"));

        });
    };*/
    implement.updateLog=function(response,dom,isOnlyOperate)
    {
        dom.empty();
        /*var template=$(' <li >'
            +'<div class="date_l left"><span class="_time"></span></div>'
            +'<div class="date_r right"><em class="_user"></em><em class="green_font"></em></div>'
            +'<div class="data_b" style="width: 255px"><span class="_operation" style="display: block"></span></div>'
            + '</li>');*/
        var template=$('<li>'
            +'<div class="_user"><em style="font-style:normal" id="duser"></em></div>' +
            '<div class="_time"><em style="font-style:normal" id="dtime"></em></div>'+
            '<div class="_operation"><em style="font-style:normal" id="doperation"></em></div>'
            +'</li>');
        if(isOnlyOperate)
        {
            template.find("._time").remove();
            template.find(".date_r").remove();
        }
        $(response).each(function(i,item)
        {
            var $template=template.clone();
            var $time=$template.find("#dtime");
            var $opertation=$template.find("#doperation");
            var $user=$template.find("#duser");
            $time.text(ef.util.number2time(item.time,"h:m:s",true));
            if(item.type=="backup"){//备份日志
                if(item.object.indexOf("vm")!=-1){
                    var txt=implement.getOperateAction(item.type,item.operation,"vm")+"("+item.object+")";
                }else if(item.object.indexOf("vd")!=-1){
                    var txt=implement.getOperateAction(item.type,item.operation,"vd")+"("+item.object+")";
                }
            }else if (item.type=="vdisk"){//云硬盘日志
                if(item.operation=="attach"||item.operation=="detach"){
                    var txt=implement.getOperateAction(item.type,item.operation)+"("+item.object+")";
                }else{
                    var txt=implement.getOperateAction(item.type,item.operation)+"("+item.object+")";
                }
            }else if(item.type=="vm"){//云主机日志
                if(item.des!=null){
                    if(item.operation=="add_ip_port"||item.operation=="del_ip_port"){
                        var txt=implement.getOperateAction(item.type,item.operation)+"("+item.des+")";
                    }else{
                        var txt=implement.getOperateAction(item.type,item.operation)+"("+item.object+")";
                    }
                }else{
                    var txt=implement.getOperateAction(item.type,item.operation)+"("+item.object+")";
                }
            }else if(item.type=="security_group"){//安全组规则日志
                if(item.object=="None"){ item.object="任何";}
                var txt=implement.getOperateAction(item.type,item.operation)+"("+item.object+")";
            }else if(item.type=="user") {//用户日志
                var txt = implement.getOperateAction(item.type, item.operation)+"("+item.object+")";
                console.log(item.object);
            }else if(item.type=="tenant"){//项目日志
                if(item.object=="None"){ item.object="任何";}
               var txt=implement.getOperateAction(item.type,item.operation)+"("+item.object+")";
            }else if(item.type=="template"&&item.operation=="create"){
                var txt=ef.util.getLocale("server.operate.template_tem.create")+"("+item.object+")";
            }else if(item.type=="instance"&&item.operation=="create"){
                var txt=ef.util.getLocale("server.operate.instance_ins.create")+"("+item.object+")";
            }else if(item.type=="alarm"&&item.des.indexOf("server.message.alarm.shut_down")!=-1){
                var s=item.des.indexOf("server.message.alarm.shut_down");
                var d=item.des.slice(0,s);
                var txt=d+"关机"
            }
            else{
                if(item.object=="None"){ item.object="任何";}
                var txt=implement.getOperateAction(item.type,item.operation)+"("+item.object+")";
                console.log(item.object);
            }
            $opertation.text(txt).attr("title",txt);
            $user.text(item.user);
            $user.attr("title",item.user);
            dom.append($template);
            //$opertation.text(item.operation + "-" + item.des).attr("title", item.operation + item.des);
            //$user.text(item.user);
            //$user.attr("title", item.user);
            //dom.append($template);
        });
    };
    /**
     * 根据数据更新cpu的top5图表
     * */
    implement.updateCpuChart=function(response)
    {
        this.cpuOption.xAxis[0].data=[];
        this.cpuOption.series[0].data=[];
        $(response).each(function(i,il)
        {
            var total=eval(il.total);
            total=ef.util.mb2gb(total,2,1000);
            var used=total*il.value/100;
            used=used.toFixed(2);
            var left=(total-used).toFixed(2);
            il.totals=total;
            il.total=il.total||0;
            il.value=il.value?Number(il.value).toFixed(2):il.value;
            /*Number(il.value).toFixed(2) < 3 ?
              Number(il.value+2).toFixed(2) :
              Number(il.value).toFixed(2);*/
            il.used=used;//value
            il.left=left;
            il.name = il['host_ip'];
            implement.cpuOption.xAxis[0].data.push(il['host_ip']);
            implement.cpuOption.series[0].data.push(il);
        });
        this.cpuChart.setOption(this.cpuOption);
    };
    /**
     * 根据数据更新内存的top5图表
     * */
    implement.updateMemoChart=function(response)
    {
        this.memoOption.xAxis[0].data=[];
        this.memoOption.series[0].data=[];
        $(response).each(function(i,il)
        {
            var total=eval(il.total);
            total=ef.util.mb2gb(total,2);
            var used=total*il.value/100;
            used=used.toFixed(2);
            var left=(total-used).toFixed(2);
            il.total=total||0;
            il.value=il.value?Number(il.value).toFixed(2):il.value;
            /*Number(il.value).toFixed(2) < 3 ?
                     (Number(il.value)+2).toFixed(2) :
                     Number(il.value).toFixed(2);*/
            il.used=used;
            il.left=left;
            il.name = il['host_ip'];
            implement.memoOption.xAxis[0].data.push(il['host_ip']);
            implement.memoOption.series[0].data.push(il);
        });
        this.memoChart.setOption(this.memoOption);
    };
    /**
     * 获取日志，无查询条件
     * */
    implement.getLog=function(start,limit,isForce,success,error)
    {
        ef.getJSON(
            {
                url:api.getAPI("dashboard.log"),
                type:"get",
                isForce:isForce,
                data:
                {
                    start:start,
                    limit:limit
                },
                success:success,
                error:error
            });
    };
    /**获取CPU的top*/
    implement.getCPUTop=function(limit,isForce,success,error,overtime)
    {
        ef.getJSON(
            {
                url:api.getAPI("monitor")+"/hardware.cpu.percent/type/host",
                type:"get",
                isForce:isForce,
                data:
                {
                    limit:limit
                },
                success:success,
                error:error,
                overtime:overtime
            });
    };
    /**
     * 获取内存的top
     * */
    implement.getMemoTop=function(limit,isForce,success,error)
    {
        ef.getJSON(
            {
                url:api.getAPI("monitor")+"/hardware.memory.percent/type/host",
                type:"get",
                isForce:isForce,
                data:
                {
                    limit:limit
                },
                success:success,
                error:error
            });
    };
    implement.redraw=function()
    {
        domReady(function()
        {
            $.parser.parse('.data-center-wrapper');
            implement.init();
            function reiszeWin()
            {
                $(".num-box").each(function()
                {
                    var _width=$(this).width();
                    if($(this).hasClass("left-mar"))
                    {
                        if(_width<150)
                        {
                            $(this).css({"margin-left":0});
                        }else
                        {
                            $(this).css({"margin-left":10});
                        }
                    }
                    $(this).height($(this).width());
                    $(this).find(".h_center").height($(this).height()-$(this).find(".h_title").height()-$(this).find(".h_bottom").height()-20);
                    $(this).find(".h_center .num-b").css({"font-size":Math.floor($(this).width()/50)+"em"});
                });
                var heightOld = $(".dashboard-box .datelist").height();
                if(implement.getLeftContentHeight()){
                    $(".dashboard-box .datelist").height(implement.getLeftContentHeight());
                }else{
                    $(".dashboard-box .datelist").height(heightOld);
                }
                /*if(timer){
                    timer.reset();
                    return;
                }
                var timer=new ef.Timer(200,function(){
                    timer.destory();
                    try{
                        implement.cpuChart = echarts.init($(".demo_dbox_left")[0]);
                        implement.cpuChart.setOption(implement.cpuOption,true);
                        //implement.cpuChart.showLoading({text:"正在加载...",color:"#5c7dd9",maskColor: 'rgba(255, 255, 255, 0)'});
                        implement.memoChart = echarts.init($(".demo_dbox_right")[0]);
                        implement.memoChart.setOption(implement.memoOption,true);
                    }catch(e){

                    }
                });
                timer.start();*/
                try{
                    implement.cpuChart = echarts.init($(".demo_dbox_left")[0]);
                    implement.cpuChart.setOption(implement.cpuOption,true);
                    //implement.cpuChart.showLoading({text:"正在加载...",color:"#5c7dd9",maskColor: 'rgba(255, 255, 255, 0)'});
                    implement.memoChart = echarts.init($(".demo_dbox_right")[0]);
                    implement.memoChart.setOption(implement.memoOption,true);
                    //implement.memoChart.showLoading({text:"正在加载...",color:"#5c7dd9",maskColor: 'rgba(255, 255, 255, 0)'});
                }catch(err)
                {
                    //console.log('dashboard.resize',err);
                }
               /* var heightOld = $(".dashboard-box .datelist").height();
                if(implement.getLeftContentHeight()){
                    $(".dashboard-box .datelist").height(implement.getLeftContentHeight());
                }else{
                    $(".dashboard-box .datelist").height(heightOld);
                }*/
            }
            $(window).on('resize.dashboard',function(){
                reiszeWin();
            });
            /*$(window).resize(function()
            {
                reiszeWin();
            });*/
           /* reiszeWin();*/
            if(implement.getLeftContentHeight()){
                $(".dashboard-box .datelist").height(implement.getLeftContentHeight());
            }
            $(".demo_dbox_left").hover(function()
            {
                if(implement.cpuInter)
                implement.cpuInter.stop();
            },function()
            {
                if(implement.cpuInter){}
                //implement.cpuInter.start();
            });
            $(".demo_dbox_right").hover(function()
            {
                if(implement.memoInter)
                implement.memoInter.stop();
            },function()
            {
                if(implement.memoInter){}
                //implement.memoInter.start();
            });
           // implement.warn();
            //implement.warnTimer = new ef.Timer(60000, function () {
              //  implement.warn();
           // }, module.id);
            //implement.warnTimer.start();
            //implement.numInter=new ef.Timer(3000,function()
            //{
            //    var len=Math.floor(Math.random()*(arrs.length))+1;
            //    var _arrs=ef.util.sample(arrs,len);
            //    for(var i=0;i<_arrs.length;i++)
            //    {
            //        var ani=arrs[i];
            //        var newValue=ef.util.getInitRandom(100);
            //        var num=Number(ani.box.find(".num").text());
            //        ani.play({newValue:newValue});
            //    }
            //},module.id,true);
            //implement.numInter.start();

        });
    };
    /**获取统计数据*/
    implement.getStatstic=function(type,success,error,overtime)
    {
        ef.getJSON(
            {
                url:api.getAPI("dashbarod.statistic"),
                data:
                {
                    "stat_type":type
                },
                success:success,
                error:error,
                overtime:overtime|| $.noop
            });
    };
    implement.destroy=function()
    {
        if(socket){
            socket.close();
            socket.onclose = function(event){
                console.log('socket close evnet',event);
            };
        }
        $(window).off('resize.dashboard',function(){
            console.log('resize.dashboard success');
        });
        require.undef(module.id);
    };
    implement.getLeftContentHeight=function()
    {
       try{
           var last = $(".two_box.right").last();
           var value = $(last).offset().top-$('.dashboard-box .one_box').offset().top+$(last).height();
       }catch(e){
            return $(".dashboard-box .datelist").height();
       }
        return value;
        //return $(".dashboard-box .tree_list").height()+$(".dashboard-box .one_box").height()+$(".dashboard-box .two_box").height()*3+$(".dashboard-box .operation_log_title").height()-4;
    };
    implement.getRightContentHeight=function()
    {
        var innerHeight=0;
        return $(".dashboard-box .operation_log_title").height()+$(".dashboard_log_box li").length*70;
    };
    return implement;
});