define(["module", 'easyui', 'domReady', 'clientPaging', 'user', "echart", "api","cal.host","alarm"], function (module, easyui, domReady, clientPaging, users, echarts, api,cal_host,alarm) {
    var implement = new ef.Interface.implement();
    implement.gridHadLoaded = false;
    ef.util.EchartsColor.clearColor(true);
    implement.setTestOutput=function()
    {
        return;
        var that=this;
        setInterval(function()
        {
            var arrs=[];
            var xaxis=[];
            //this.memo_controll([]);
            var ser={
                name:"测试一",
                data:arrs,
                type:"line"
            };
            for(var i=0;i<10;i++)
            {
                var obj=Math.random()*10;
                if(obj<5)
                {
                    obj=undefined;
                }
                arrs.push(obj);
                xaxis.push((new Date()).getTime());


            }
            console.log(arrs);
            that.controlchart("网络Input",ser,implement.yAxOther("b/s"),xaxis);
        },2000);
    };
    implement.initText = function () {
      $("#pwd").textbox({
          editable:false,
          maxlength:15,
         /* required:true,*/
          icons: [{
              iconCls:'icon-eye',
              iconAlign:"right",
              handler: function(e){
                  $("#pwdEye").parent().show();
                  $("#pwd").parent().hide();
              }
          }],
          onChange: function (newValue,oldValue) {
              $("#pwdEye").textbox('setValue',newValue);
              if(!$("#pwd").textbox("getValue")){
                  $("#pwd").removeAttr("icons")
              }
          }
      });
        $("#pwdEye").textbox({
            editable:false,
            maxlength:15,
           /* required:true,*/
            icons: [{
                iconCls:'icon-eye-close-all',
                iconAlign:"right",
                handler: function(e){
                    $("#pwdEye").parent().hide();
                    $("#pwd").parent().show();
                }
            }],
            onChange: function (newValue,oldValue) {
                $("#pwd").textbox('setValue',newValue);
                if(!$("#pwdEye").textbox("getValue")){
                    $("#pwdEye").removeAttr("icons")
                }
            }
        });
        $("#put_ipmi").textbox({
            editable:false,
            //required:true,
            maxlength:15,
            validType:'reg[/^(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])$/]'
        });
        $(".data_ipmi_user").textbox({
            editable:false,
            /*required:true,*/
            maxlength:15,
            validType:'whitelist["a-zA-Z0-9_-","字母,数字,下划线和中划线"]'
        });
        $("#pwdEye").parent().hide();
    };
    implement.host_datagrid = function (name, id) {
        var CpuVal, MemoVal;
        $("#mastslavevm_grid").datagrid({
            singleSelect:true,
            pagination:true,
            pageSize:10,
            onLoadSuccess: function () {
                implement.gridHadLoaded = true;
                if(ef.util.isFirefox()){
                    $(".p").progressbar({
                        text:"",
                        width:85
                    });
                }else{
                    $(".p").progressbar({
                        text:""
                    });
                }

            },
            loadMsg:'',
            columns: [
                [
                    {field: 'name', title: 'ID', width: '7%',formatter: function (val,row) {
                        if(!row.id)
                        {
                            return val;
                        }
                        /*var str=ef.util.escapeJSON(
                            JSON.stringify(row));*/
                        return '<a onclick="ef.nav.goto(\'hostDetail.html\',\'cal.host.hostDetail\',\''+row.id+'\',null,\'cal.host\')" class="table-link">'+val+'</a>';
                    }},
                    {field: 'displayname', title: '名称', width: '10%'},
                    {field: 'ip', title: 'IP', width: '10%'},
                    {field: 'user', title: '用户', width: '10%',formatter:function(val,row)
                    {
                        return row.user?(row.user.display_name||"-"):"-";
                        //ef.util.getLocale("host.user.unuser")
                    }},
                    {field: 'tenant', title: '项目', width: '10%'},
                    {field: 'state', title: '状态', width: '10%', formatter: function (val, row) {
                        var $dom = $('<span class="status_icon_box"><i></i><span></span></span>');
                        var icon = $dom.find("i");
                        var text = $dom.find("span");
                        var style=cal_host.getStyleByStatus(val);
                        icon.addClass(style.icon);
                        text.text(style.text);
                        return $dom[0].outerHTML;
                    }},
                    {field: 'cores', title: 'CPU(核)', width: '10%'},
                    {field: 'used_cpus', title: 'CPU利用率(%)', width: '150px',editor:'textbox', formatter: function (val, row) {
                        /**
                         * @thomas cpu利用率
                         */
                        val = (val == null ? 0.00 : val);
                        if(val>100){
                            val=100;
                        }
                        return'<a>'+Number(val).toFixed(2)+'</a><div id="'+row.name+'cpus" class="p" data-options="value:'+val+'" style="width:100px;height: 3px;position: absolute"></div>';
                    }},
                    {field: 'memory_mb', title: '内存(GB)', width: '10%', formatter: function (val, row) {
                        return val / 1024;
                    }},
                    {field: 'used_memory_mb', title: '内存使用率(%)', width: '12%',editor:'textbox', formatter: function (val,row) {
                        /**
                         * @thomas mem利用率
                         */
                        val = (val == null ? 0.00 : val);
                        if(val>100){
                            val=100;
                        }
                        return '<a>'+(Number(val).toFixed(2)+'')+'</a><div id="'+row.name+'memo" class="p" data-options="value:'+val+'" style="width:100px;height: 3px;position: absolute"></div>';

                    }}
                ]
            ]
        });
    };
    implement.host_table = function (name,id) {
        $('.datagrid-empty-tip').remove();
        $("#mastslavevm_grid").datagrid('loading');
        ef.getJSON({
            url: api.getAPI("hostList"),
            type: "get",//get,post,put,delete
            isForce: true,
            data: {
                host: name
            },
            success: function (response) {
                var arrCpu=[],arrMemo=[];
                $(response).each(function(i,il)
                {
                    il.ip = cal_host.getRealIp(il);
                    //il.user = il.user.name||ef.util.getLocale("host.user.unuser");
                    il.tenant = il.tenant?il.tenant.name:"-";
                   /* var option=
                    {
                        url: api.getAPI("Monitoring") + "/cpu_util",
                        type: "get",
                        data: {
                            vm: il.id,
                            limit: 5
                        },
                        success: function (respC) {
                            if (respC.length != 0) {
                                var r = respC[0];
                                if(r.length!=0){
                                    il.used_cpus = r[0].value;
                                }
                            }
                        }
                    };
                    var options =
                    {
                        url: api.getAPI("Monitoring") + "/memory_util",
                        type: "get",
                        data: {
                            vm: il.id,
                            limit: 5
                        },
                        success: function (respM) {
                            if (respM.length != 0) {
                                var r = respM[0];
                                if(r.length!=0){
                                    il.used_memory_mb = r[0].value;
                                }
                            }
                        }
                    };
                    arrCpu.push(option);
                    arrMemo.push(options);*/
                    il.used_cpus = 0.00;
                    il.used_memory_mb = 0.00;
                });
                //var SequenceCpu = new ef.SequenceLoader(arrCpu).complete(function (result) {
                //    if(result.loaded==true){
                //        $('#mastslavevm_grid').datagrid({data: response});
                //    }
                //});
                //var SequenceMemo = new ef.SequenceLoader(arrMemo).complete(function (result) {
                //    if(result.loaded==true){
                //        $('#mastslavevm_grid').datagrid({data: response});
                //    }
                //});
               /* if(response.length!=0){
                    $('#mastslavevm_grid').datagrid({data: response});
                }*/
                if(response.length){
                    $('#mastslavevm_grid').datagrid({data:response}).datagrid("clientPaging");
                }else{
                    $('#mastslavevm_grid').datagrid({data:response}).datagrid("clientPaging");
                }

            }
        });
    };
    var des;
    implement.description = function (id) {
        ef.getJSON({
            url: api.getAPI("hostalaveDetail") + "/" + id,
            type: "get",//get,post,put,delete
            isForce: true,
            success: function (response) {
                var vlans;
                var user,pass,ip;
                $(response).each(function (i, il) {
                    for (var j in il) {
                        var _val = il[j];
                        $(".hostSlaveDetail").find(".data_" + j).empty();
                        $(".hostSlaveDetail").find(".data_" + j).text(_val);
                    }
                    vlans=il.vlans;
                    user = il.ipmi_user;
                    pass = il.ipmi_pass;
                    ip = il.ipmi_ip;
                    des = il.des;
                    implement.ipmiDatas = {
                        ip:il.ipmi_ip,
                        user:il.ipmi_user,
                        pass:il.ipmi_pass,
                        des:il.des
                    };
                    var quota = Math.ceil(il.memory_mb/1024);
                    $(".hostSlaveDetail").find(".data_" + "cpus").text(il.cpus + "核" );
                    $(".hostSlaveDetail").find(".data_" + "memory_mb").text(quota + "GB" );
                    //$(".hostSlaveDetail").find(".data_" + "status").append('<span class="spanavil" style="padding-top:5px;"></span>');
                    if(il.status=="available"){
                        //$(".hostSlaveDetail").find(".data_" + "status").text(ef.util.getLocale("cal.hostalave.status.able")).css("color","green");
                        $(".hostSlaveDetail").find(".data_" + "status").html('<i class="icon-status-done-success icon-hostslave"></i>'+ef.util.getLocale("cal.hostalave.status.able"));
                    }
                    else{
                        $(".hostSlaveDetail").find(".data_" + "status").html('<i class="icon-status-done-fail icon-hostslave"></i>'+ef.util.getLocale("cal.hostalave.status.disable"));
                    }
                });
                $(".data_des").empty().val(des||"-");
                //user show
                $(".data_ipmi_user").textbox('setValue',user||"-");
                //password show
                $(".data_ipmi_pass").textbox('setValue',pass || '-');
                if(pass == null || pass == ''){
                    $('#pwd').textbox({
                        type:'text',
                        value:'-',
                        icons:[]
                    });
                }else{
                    $('#pwd').textbox({
                        type:'password'
                    });
                    implement.initText();
                    $(".data_ipmi_pass").textbox('setValue',pass || '-');
                }
                $('#pwdEye').parent().hide();
                $('#pwd').parent().show();
                //ip show
                if(ip != null && ip != ''){
                    $("#a_ipmi").empty().text(ip);
                    var url = window.location.protocol+"//"+$("#a_ipmi").text();
                    $("#a_ipmi").attr("href",url).show();
                    $('#put_ipmi').textbox('setValue','-').parent().hide();
                }else{
                    $("#a_ipmi").empty().removeAttr('href').hide();
                    $('#put_ipmi').textbox('setValue','-').parent().show();
                }
                $(".hostSlaveDetail").find(".data_" + "vlans").empty();
                $(vlans).each(function (i,il) {
                    if(i+1<vlans.length){
                        $(".hostSlaveDetail").find(".data_" + "vlans").append('<span>'+il+","+'</span>');
                    }
                    if(i+1==vlans.length){
                        $(".hostSlaveDetail").find(".data_" + "vlans").append('<span>'+il+'</span>');
                    }
                });
                implement.ipmiCss();
                $(".data_des").attr("readonly", true);
            }
        });
    };
    implement.cpucontrolchart = function (titText,data,yAxis,xdata) {
        /**
         * @thomas cpu chart
         */
        if(implement.diskbox && !implement.diskbox.isDisposed()){
            implement.diskbox.dispose();
            implement.diskbox = null;
            implement.option4 = null;
            $(".disk-box").empty();
        }
        implement.diskbox = echarts.init($(".disk-box")[0]);
        implement.option4 = {
            title:{
                text:titText,
                left:'40%'
            },
            addDataAnimation:false,
            tooltip: {
                trigger:'axis'/*,
                formatter: function (data){
                    return  data[0].name+'<br/>'+data[0].seriesName+'(%): '+data[0].data+'<br/>';
                }*/
            },
            calculable: true,
            xAxis: [//x轴
                {
                    splitLine:{
                        show:true
                    },
                    type: 'category',
                    boundaryGap: false,
                    data: xdata
                }
            ],
            yAxis: yAxis,
            series:data
        };
        implement.diskbox.resize();
        implement.diskbox.setOption(implement.option4,true);
        //$(".disk-box").append('<div style="position: absolute; height: 20px;width: 20px;top: -2px;left: 0px;background-color: #fff;z-index:20;"></div>');
    };
    implement.controlchart = function (titText,data,yAxis,xdata) {
        /**
         *  @thomas 下拉网络 input and output
         */
        if(implement.diskbox && !implement.diskbox.isDisposed()){
            implement.diskbox.dispose();
            implement.diskbox = null;
            implement.option4 = null;
            $(".disk-box").empty();
        }
        implement.diskbox = echarts.init($(".disk-box")[0]);
        implement.option4 = {
            title:{
                text:titText,
                left:'40%'
            },
            addDataAnimation:false,
            tooltip: {
                trigger:'axis',
                textStyle: {
                    align: 'left'
                }/*,
                 formatter:function(data){
                     var str="";
                     for(var i=0;i<data.length;i++)
                     {
                         str+="&nbsp"+data[i].name+"&nbsp"+data[i].seriesName+": "+data[i].data+"</br>";
                     }
                     return str;

                 }*/
            },
            calculable: true,
            xAxis: [//x轴
                {
                    splitLine:{
                        show:true
                    },
                    type: 'category',
                    boundaryGap: false,
                    data: xdata
                }
            ],
            grid:{
                show:true,
                width: 'auto',
                height:'auto'
            },
            yAxis: yAxis,
            series:data
        };
        implement.diskbox.setOption(implement.option4,true);
    };
    implement.yAmax = function () {
        var yMax = [];
        yMax.push(//y轴
            {
                type: 'value',
                min:0,
                max:100,
                splitNumber:5,
                interval:20,
                    axisLabel: {
                    formatter: '{value}%'
                }
            });
        return yMax;
    };
    implement.yAx = function (unit) {
        var y = [];
        y.push(//y轴
            {
                type: 'value',
                min: 0,
                axisLabel: {
                    formatter: function(value){
                        return value+unit+'';
                    }
                }
            });
        return y;
    };
    implement.yAxOther = function (unit,max) {
        var y = [];
        y.push(//y轴
            {
                min:0,
                max:max || 10,
                splitNumber:5,
                interval:2,
                type: 'value',
                axisLabel: {
                    formatter: '{value}'+unit
                }
            });
        return y;
    };
    implement.cpu_controll = function (dataArray) {
        if(!_.isArray(dataArray)){
            dataArray = [];
        }
        var time = [],valPercent=[];
        if(dataArray.length!=0){
            $(dataArray).each(function (i, il) {
                var timedata = ef.util.number2time(il.timestamp,"Y-M-D h:m:s",true);
                time.push(timedata.substr(10,timedata.length));
                 if(il.value!=null){
                    if(il.value > 100){
                        il.value=100;
                    }
                    valPercent.push(Number(il.value).toFixed(2));
                }
                else{
                    valPercent.push('-');
                }
            });
        }
        var cpu_per = [];
        time.reverse();
        cpu_per.push({
            name: 'CPU利用率',
            type: 'line',
            time: time,
            data: valPercent,
            lineStyle: {
                normal: {color:'blue'}
            }
        });
        implement.cpucontrolchart("CPU利用率",cpu_per,implement.yAmax(),time);
    };
    implement.memo_controll = function (dataArray) {
        if(!_.isArray(dataArray)){
            dataArray = [];
        }
        var memo = [], timeMemo = [];
        if(dataArray.length!=0){
            $(dataArray).each(function (i, il) {
                var timeData = ef.util.number2time(il.timestamp,"Y-M-D h:m:s",true);
                timeMemo.push(timeData.substr(10,timeData.length));
                if(il.value!=null){
                    if(il.value>100){
                        il.value=100;
                    }
                    memo.push(Number(il.value).toFixed(2));
                }else{
                    memo.push('-');
                }
            });
        }else{
            memo = (function(num){
                var temp = [];
                for(var i = 0; i < num; i++){
                    temp.push('-');
                }
                return temp;
            })(10);
            timeMemo = implement.getProgressionTime(null, 10);
        }
        var memo_per = [];
        timeMemo.reverse();
        memo_per.push({
            name: '内存使用率',
            type: 'line',
            time: timeMemo,
            data: memo,
            lineStyle: {
                normal: {color:'blue'}
            }
        });
        implement.cpucontrolchart("内存使用率",memo_per,implement.yAmax(),timeMemo);
       /* ef.getJSON({
            url: api.getAPI("Monitoring") + "/hardware.memory.percent",
            type: "get",
            isForce: true,
            data: {
                host: id,
                limit: 10
            },
            success: function (response) {
                response = response.reverse();
                var memo = [], timeMemo = [];
                if(response.length!=0){
                    $(response).each(function (i, il) {
                        var timeData = ef.util.number2time(il.timestamp,"Y-M-D h:m:s",true);
                        timeMemo.push(timeData.substr(10,timeData.length));
                        if(il.value>100){
                            il.value=100;
                        }
                        else if(il.value!=null){
                            memo.push(Number(il.value).toFixed(2));
                        }
                       else{
                            memo.push(0.00);
                        }
                    });
                }
                else{
                    memo.push(0.00);
                    timeMemo.push(0.00);
                }
                var memo_per;
                memo_per = {
                    name: '内存使用率',
                    type: 'line',
                    time: timeMemo,
                    data: memo,
                    lineStyle: {
                        normal: {color:'blue'}
                    }
                };
                implement.cpucontrolchart("内存使用率",memo_per,implement.yAmax(),timeMemo);
            },
            error: function (error) {
                console.log(error);
            }
        });*/
    };
    implement.getProgressionTime = function(distance,number){
        var temp= [],
            tempStr = '',
            currentTime = new Date().getTime(),
            number = _.isNumber(number) ? Math.ceil(number) : 5;
        distance = _.isNumber(distance) ? Math.ceil(distance) : 5000;
        for(var i = 0; i < number; i++){
            tempStr = ef.util.number2time((currentTime-distance*i),'Y-M-D h:m:s',true);
            tempStr = tempStr.substr(10).trim();
            temp.push(tempStr);
        }
        return temp.reverse();
    };
    implement.netin_controll = function (dataArray) {
        var seriesData = [],
            unit = '',
            timeInflow = [];
        function formatTimeStamp(timestamp,startIndex){
            var time = ef.util.number2time(Number(timestamp),"Y-M-D h:m:s",true);
            return String(time).substr(startIndex);
        }
        function getUnit(max){
           var unit = '';
            if(max > 1024 && max < (1024*1024)){
                unit = 'KB/s';
            }else if(max > (1024 * 1024) && max < (1024 * 1024*1024)){
                unit = 'MB/s';
            }else if(max > (1024 * 1024*1024) && max < (1024 * 1024*1024*1024)){
                unit = 'GB/s';
            }else if(max > (1024 * 1024*1024*1024)){
                unit='TB/s';
            }else{
                unit='B/s';
            }
            return unit;
        }
        function formatValueItem(unit,value){
            if(!_.isNumber(value)){
                return '-';
            }
            var units = {
                'KB/s': 1024,
                'MB/s': 1024*1024,
                'GB/s': 1024*1024*1024,
                'TB/s': 1024*1024*1024*1024,
                'B/s' : 1
            };
            if(units[unit]){
                return (Number(value)/units[unit]).toFixed(2);
            }else{
                return value;
            }
        }
        var dataArray = $.extend({},dataArray);
        var MaxValue = _.chain(dataArray).toArray().flatten()
            .max(function(item){
                return Number(item.value);
            }).value();
        var unit = '';
        if(MaxValue && MaxValue.value){
            unit = getUnit(MaxValue.value);
        }else{
            MaxValue = 0;
            unit = 'B/s';
        }
        for(var key in dataArray){
            var xArrayData = [],
                seriesInnerData = [],
                seriesDataSample = {
                    name: "网络流入(b/s)",
                    type: 'line',
                    time: [],
                    data: (function(num){
                        var temp = [];
                        for(var i = 0; i < num; i++){
                            temp.push('-');
                        }
                        return temp;
                    })(10)
                };
            var dataResp = [];
            if(_.isArray(dataArray[key])){
                dataResp = dataArray[key].slice();
            }
            if(dataResp.length == 0){
                xArrayData = seriesDataSample.time = implement.getProgressionTime(null,10);
                seriesData.push(seriesDataSample);
                implement.controlchart("网络Input",seriesData,implement.yAxOther("b/s"),xArrayData);
                return;
            }
            var timeStamp = -1,
                valueItem = -1;
            dataResp = _.sortBy(dataResp,'timestamp');
            $(dataResp).each(function(index,item){
                timeStamp = formatTimeStamp(item.timestamp,10).trim();
                xArrayData.push(timeStamp);
                valueItem =  formatValueItem(unit,item.value);
                seriesInnerData.push(valueItem);
            });
            seriesDataSample.data = seriesInnerData;
            timeInflow = seriesDataSample.time = xArrayData;
            seriesDataSample.name = key+'网络Input'+'('+unit+')';
            seriesData.push(seriesDataSample);
        }
        console.log('seriesData ',seriesData);
        var nullDataArray =  _.chain(seriesData).pluck('data').flatten().value();
        var yAxFlag = implement.getNetWorkYAX(nullDataArray);
        implement.controlchart("网络Input",seriesData,(yAxFlag ? implement.yAxOther("b/s"):implement.yAx(unit)),timeInflow);
    };
    implement.getNetWorkYAX = function(dataArray){
        if(!_.isArray(dataArray)){
            dataArray = [];
        }
        var yAxFlag = false;
        var nullDataGroup = _.groupBy(dataArray,function(item){
            return item == '-' ? 'selected' :  'unSelected';
        });
        if(nullDataGroup && nullDataGroup.selected){
            if(nullDataGroup.selected.length == dataArray.length){
                yAxFlag = true;
            }
        }
        if(nullDataGroup && nullDataGroup.unSelected && nullDataGroup.unSelected.length){
            var tempMax = _.max(nullDataGroup.unSelected);
            if(tempMax <= 0){
                yAxFlag = true;
            }
        }
        return yAxFlag;
    };
    implement.netout_controll = function (dataArray) {
        var seriesData = [],
            unit = '',
            timeInflow = [];
        function formatTimeStamp(timestamp,startIndex){
            var time = ef.util.number2time(Number(timestamp),"Y-M-D h:m:s",true);
            return String(time).substr(startIndex);
        }
        function getUnit(max){
            var unit = '';
            if(max > 1024 && max < (1024*1024)){
                unit = 'KB/s';
            }else if(max > (1024 * 1024) && max < (1024 * 1024*1024)){
                unit = 'MB/s';
            }else if(max > (1024 * 1024*1024) && max < (1024 * 1024*1024*1024)){
                unit = 'GB/s';
            }else if(max > (1024 * 1024*1024*1024)){
                unit='TB/s';
            }else{
                unit='B/s';
            }
            return unit;
        }
        function formatValueItem(unit,value){
            if(!_.isNumber(value)){
                return '-';
            }
            var units = {
                'KB/s': 1024,
                'MB/s': 1024*1024,
                'GB/s': 1024*1024*1024,
                'TB/s': 1024*1024*1024*1024,
                'B/s' : 1
            };
            if(units[unit]){
                return (Number(value)/units[unit]).toFixed(2);
            }else{
                return value;
            }
        }
        var dataArray = $.extend({},dataArray);
        var MaxValue = _.chain(dataArray).toArray().flatten()
            .max(function(item){
                return Number(item.value);
            }).value();
        var unit = '',
            max = -1;
        if(MaxValue && MaxValue.value){
            unit = getUnit(MaxValue.value);
            max = MaxValue.value;
        }else{
            max = MaxValue = 0;
            unit = 'B/s';
        }
        for(var key in dataArray){
            var xArrayData = [],
                seriesInnerData = [],
                seriesDataSample = {
                    name: "网络流出(b/s)",
                    type: 'line',
                    time: [],
                    data: (function(num){
                        var temp = [];
                        for(var i = 0; i < num; i++){
                            temp.push('-');
                        }
                        return temp;
                    })(10)
                };
            var dataResp = [];
            if(_.isArray(dataArray[key])){
                dataResp = dataArray[key].slice();
            }
            if(dataResp.length == 0){
                xArrayData = seriesDataSample.time = implement.getProgressionTime(null,10);
                seriesData.push(seriesDataSample);
                implement.controlchart("网络Output",seriesData,implement.yAxOther("b/s"),xArrayData);
                return;
            }
            var timeStamp = -1,
                valueItem = -1;
            dataResp = _.sortBy(dataResp,'timestamp');
            $(dataResp).each(function(index,item){
                timeStamp = formatTimeStamp(item.timestamp,10).trim();
                xArrayData.push(timeStamp);
                valueItem =  formatValueItem(unit,item.value);
                seriesInnerData.push(valueItem);
            });
            seriesDataSample.data = seriesInnerData;
            timeInflow = seriesDataSample.time = xArrayData;
            seriesDataSample.name = key+'网络Output'+'('+unit+')';
            seriesData.push(seriesDataSample);
        }
        console.log('seriesData ',seriesData);
        var nullDataArray =  _.chain(seriesData).pluck('data').flatten().value();
        /*var nullData =  _.countBy(nullDataArray,function(item){
                    return item == '-' ? 'selected' :  'unSelected'
            });
        var yAxFlag = false;
        if(nullData && nullData.selected){
            if(nullData.selected == nullDataArray.length){
                yAxFlag = true;
            }
        }*/
        var yAxFlag = implement.getNetWorkYAX(nullDataArray);
        implement.controlchart("网络Output",seriesData,(yAxFlag ? implement.yAxOther("b/s"):implement.yAx(unit)),timeInflow);
        //implement.controlchart("网络Output",seriesData,implement.yAxOther(unit,max),timeInflow);
        /*var net_inflow = [],unit;
        var inflow = [], timeInflow = [];
        if(dataArray.length==0){
            var items = {
                name: "网络流出(b/s)",
                type: 'line',
                time: timeInflow,
                data: 0.00
            };
            inflow.push(items);
            implement.controlchart("网络Output",inflow,implement.yAxOther("b/s"),timeInflow);
            return;
        }
        $(dataArray).each(function (i,il) {
            $(il.samples).each(function (e, el){
                net_inflow.push(el.value);
            });
        });
        var maxValue = ef.util.max(net_inflow);
        $(dataArray).each(function (i, il) {
            var items = [], item_data = [],abc = [];
            $(il.samples).each(function (e, el) {
                var timeData = ef.util.number2time(el.timestamp,"Y-M-D h:m:s",true);
                timeInflow.push(timeData.substr(10,timeData.length));
            });
            var item_name=[];
            $(ef.util.pluck(il.samples, "value")).each(function (e, el) {
                cal_host.unit(maxValue,il.link_name + '网络Output',el, function (resp) {
                    abc.push(resp);
                });
            });
            items = {
                name: item_name,
                type: 'line',
                time: timeInflow,
                data: abc
            };
            inflow.push(items);
        });
        timeInflow.reverse();
        implement.controlchart("网络Output",inflow,implement.yAx(unit),timeInflow);*/
       /* ef.getJSON({
            url: api.getAPI("Monitoring") + "/hardware.network.outgoing.bytes.rate",
            type: "get",
            isForce: true,
            data: {
                host: id,
                limit: 10
            },
            success: function (response) {
                var net_inflow = [],unit;
                var inflow = [], timeInflow = [];
                if(response.length==0){
                    var items = {
                        name: "网络流出(b/s)",
                        type: 'line',
                        time: timeInflow,
                        data: 0.00
                    };
                    inflow.push(items);
                    implement.controlchart("网络Output",inflow,implement.yAxOther("b/s"),timeInflow);
                    return;
                }
                $(response).each(function (i,il) {
                    console.log(response["il.link_name"]);
                    $(il.samples).each(function (e, el){
                        net_inflow.push(el.value);
                    });
                });
                var maxValue = ef.util.max(net_inflow);
                $(response).each(function (i, il) {
                    var items = [], item_data = [],abc = [];
                    $(il.samples).each(function (e, el) {
                        var timeData = ef.util.number2time(el.timestamp,"Y-M-D h:m:s",true);
                        timeInflow.push(timeData.substr(10,timeData.length));
                    });
                    var item_name=[];
                            $(ef.util.pluck(il.samples, "value")).each(function (e, el) {
                                cal_host.unit(maxValue,il.link_name + '网络Output',el, function (resp) {
                                    abc.push(resp);
                                });
                            });
                    items = {
                        name: item_name,
                        type: 'line',
                        time: timeInflow,
                        data: abc
                    };
                    inflow.push(items);
                });
                timeInflow.reverse();
                implement.controlchart("网络Output",inflow,implement.yAx(unit),timeInflow);
            },
            error: function (error) {
                console.log(error);
            }
        });*/
    };
    implement.conClick = function () {
        if(!(implement.socket && implement.socket.slave)){
            return;
        }
        function preparedRequestData(id,name,limit){
            var requestData = {
                id: id || implement.socket.slave.id,
                chart:{
                    counter_name: name,
                    limit: limit || 10
                }
            };
            return JSON.stringify(requestData);
        }
        $("#cc").combobox({
            editable:false,
            onSelect: function (newValue) {
                var requestString = '';
                if(newValue.value == null || newValue.value == ''){
                    return;
                }
                newValue = newValue.value;
                switch (newValue){
                    case 'cpu':
                        implement.cpu_controll([]);
                        requestString = preparedRequestData(null, 'hardware.cpu.percent', null);
                        if( implement.socket &&
                            implement.socket.socket &&
                            implement.socket.socket.readyState == 1){
                            implement.socket.send(requestString);
                        }
                        break;
                    case 'memo':
                        implement.memo_controll([]);
                        requestString = preparedRequestData(null, 'hardware.memory.percent', null);
                        if( implement.socket &&
                            implement.socket.socket &&
                            implement.socket.socket.readyState == 1){
                            implement.socket.send(requestString);
                        }
                        break;
                    case 'inflow':
                        implement.netin_controll({
                            tempOne:[],
                            tempTwo:[]
                        });
                        requestString = preparedRequestData(null, 'hardware.network.incoming.bytes.rate', null);
                        if( implement.socket &&
                            implement.socket.socket &&
                            implement.socket.socket.readyState == 1){
                            implement.socket.send(requestString);
                        }
                        break;
                    case 'outflow':
                        implement.netout_controll({
                            tempOne:[],
                            tempTwo:[]
                        });
                        requestString = preparedRequestData(null, 'hardware.network.outgoing.bytes.rate', null);
                        if( implement.socket &&
                            implement.socket.socket &&
                            implement.socket.socket.readyState == 1){
                            implement.socket.send(requestString);
                        }
                        break;
                    default:
                        console.log(newValue);
                        break;
                }
        }}).combobox('unselect','cpu');//清除默认的选择项
    };
    implement.warnTable = function (target) {
        $("#mastslavewarn_grid").datagrid({
            singleSelect: true,
            pagination: true,
            pageSize: 10,
            columns:[[
                {field:'id',title:'ID',width:'8%'},
                {field:'target',title:ef.util.getLocale("alarm.host.table.target"),width:'14%'},
                //{field:'type',title:ef.util.getLocale("alarm.host.table.type"),width:'10%',formatter: function (val) {
                //    return alarm.getType(val).label;
                //}},
                {field:'times',title:ef.util.getLocale("alarm.host.table.times"),width:'12%'},
                {field:'message',title:ef.util.getLocale("alarm.host.table.message"),width:'17%',formatter: function (val,row) {
                    if(row.message!=null){
                        return '<a title="'+val+'" >'+val+'</a>';
                    }else{
                        return "-"
                    }
                }},
                {field:'level',title:ef.util.getLocale("alarm.host.table.level"),width:'12%',formatter: function (val) {
                    return alarm.getLevel(val).label;
                }},
                {field:'create_at',title:ef.util.getLocale("alarm.host.table.create_at"),width:'15%',formatter: function (val) {
                    return ef.util.number2time(val,"Y-M-D h:m:s",true);
                }},
                {field:'update_at',title:ef.util.getLocale("alarm.host.table.update_at"),width:'15%',formatter: function (val) {
                    return ef.util.number2time(val,"Y-M-D h:m:s",true);
                }},
                {field:'operate',title:ef.util.getLocale("alarm.host.table.operate"),width:'10%',formatter: function (val,row) {
                    var dom = $("<a href='#' style='text-decoration: none;color: #4DA4D6'>" + ef.util.getLocale("alarm.host.table.operate.value") + "</a>");
                    dom.click(function () {
                        $.messager.confirm(ef.alert.warning, ef.util.getLocale("alarm.delete.warning") + '？', function (ok) {
                            if (ok) {
                                ef.loading.show();
                                ef.getJSON({
                                    url: api.getAPI("alarmAction") + "/" + row.id,
                                    type: "delete",
                                    success: function () {
                                        ef.loading.hide();
                                        implement.warnRef(target,true,0);
                                        ef.placard.tick(ef.util.getLocale("alarm.delete.success.placard"));
                                    }
                                })
                            } else {
                                $("#mastslavewarn_grid").datagrid("uncheckAll");
                            }
                        });
                    });
                    return dom;
                }}
            ]]
        });
    };
    implement.warnTableElse = function () {
        $("#mastslavewarn_grid").datagrid({
            singleSelect: true,
            pagination: true,
            pageSize: 10,
            columns:[[
                {field:'id',title:'ID',width:'10%'},
                {field:'target',title:ef.util.getLocale("alarm.host.table.target"),width:'10%'},
                {field:'type',title:ef.util.getLocale("alarm.host.table.type"),width:'13%',formatter: function (val) {
                    return alarm.getType(val).label;
                }},
                {field:'times',title:ef.util.getLocale("alarm.host.table.times"),width:'13%'},
                {field:'message',title:ef.util.getLocale("alarm.host.table.message"),width:'18%',formatter: function (val,row) {
                    return '<a title="'+val+'">'+val+'</a>';
                }},
                {field:'level',title:ef.util.getLocale("alarm.host.table.level"),width:'13%',formatter: function (val) {
                    return alarm.getLevel(val).label;
                }},
                {field:'create_at',title:ef.util.getLocale("alarm.host.table.create_at"),width:'18%',formatter: function (val) {
                    return ef.util.number2time(val,"Y-M-D h:m:s",true);
                }},
                {field:'update_at',title:ef.util.getLocale("alarm.host.table.update_at"),width:'18%',formatter: function (val) {
                    return ef.util.number2time(val,"Y-M-D h:m:s",true);
                }}
            ]]
        });
    };
    implement.warnRef = function (target,isFirst,startnumber) {
        var arg=arguments,alarmname=arg[0];
        ef.getJSON({
            url:api.getAPI("alarmAction")+"/resource_detail",
            type:"get",
            useLocal:false,
            data:{
                target:target,
                start:startnumber,
                limit:10
            },
            success: function (response,allResult) {
                response=ef.util.sort("id",response);
                if(isFirst){
                    $('#mastslavewarn_grid').datagrid({data:response}).datagrid("getPager").pagination(
                        {
                            showPageList:false,
                            showRefresh:false,
                            onSelectPage:function(pageNumber, pageSize)
                            {
                                var pagenumber = (pageNumber-1)*10;
                                arg.callee(alarmname,true,pagenumber);//调用alarmRef（）
                            }
                        }).pagination("refresh",{total:allResult.total,pageNumber:(startnumber/10)+1});
                }
                else{
                    $("#mastslavewarn_grid").datagrid("loadData",response);
                }
            }
        });


    };
    implement.init = function () {
        $("#description").append(ef.util.getLocale('cal.hostslave.blocklistlabel.description'));
        $("#monitor").append(ef.util.getLocale('cal.hostslave.blocklistlabel.monitor'));
        $("#machine").append(ef.util.getLocale('cal.hostslave.blocklistlabel.machine'));
        $("#wanning").append(ef.util.getLocale('host.hostdetail.blocklistlabel.alarm'));
        $("#local-store").append(ef.util.getLocale('cal.hostslave.blocklistlabel.localstore'));
        $(".mastslavedetail-icon-box").iconmenu([
            {
                iconClass: "icon-menus-icon-back",
                tip: ef.util.getLocale('framework.component.iconmenu.back.tip'),//"返回",
                "access": [8, 9, 10, 88],
                click: function () {
                    ef.nav.goto("mastslave.html", "cal.hostslave");
                }
            }
        ]);
    };
    implement.ipmiCss = function () {
        $(".slave_input span.textbox").attr("readonly",true).addClass("noborder");
        $("#pwd").textbox({editable:false}).parent().show();
        $("#pwdEye").textbox({editable:false}).parent().hide();
        $("#put_ipmi").textbox({editable:false});
        $(".data_ipmi_user").textbox({editable:false});
    };
    var Timer_hostslaveDetail;
    implement.utils = {
        formatTimeData:function(data){
            if(!_.isNumber(data) || _.isNaN(data) || String(data).toLowerCase() === 'nan'){
                return null;
            }
            var temp = ef.util.number2time(data,"Y-M-D h:m:s",true);
            return temp.substr(10,temp.length).trim();
        },
        formatValueData:function(data){
            if(!_.isNumber(data) || _.isNaN(data) || String(data).toLowerCase() === 'nan'){
                return '-';
            }
            if(data > 100){
                data = 100;
            }
            return Number(data).toFixed(2);
        },
        setCpuMemDatas:function(dataArray){
            if(!_.isArray(dataArray) || (dataArray.length == 0)){
                return;
            }
            var timeData = [],
                valueData = [];
            dataArray = _.sortBy(dataArray,'timestamp');
            $(dataArray).each(function(index, item){
                timeData.push(implement.utils.formatTimeData(item.timestamp));
                valueData.push(implement.utils.formatValueData(item.value))
            });
            implement.option4.xAxis[0].data = null;
            implement.option4.series[0].time = null;
            implement.option4.series[0].data = null;

            var color=ef.util.EchartsColor.getColor("cpu","info");
            implement.option4.xAxis[0].data = timeData;
            implement.option4.series[0].time = timeData;
            implement.option4.series[0].data = valueData;
            implement.option4.series[0].itemStyle =color.itemStyle;
            implement.option4.series[0].lineStyle = color.lineStyle;
            implement.diskbox.setOption(implement.option4,true);
        },
        getUnit:function(max){
            var unit = '';
            if(max > 1024 && max < (1024*1024)){
                unit = 'KB/s';
            }else if(max > (1024 * 1024) && max < (1024 * 1024*1024)){
                unit = 'MB/s';
            }else if(max > (1024 * 1024*1024) && max < (1024 * 1024*1024*1024)){
                unit = 'GB/s';
            }else if(max > (1024 * 1024*1024*1024)){
                unit='TB/s';
            }else{
                unit='B/s';
            }
            return unit;
        },
        getMaxValue:function(dataArray){
            if(!_.isArray(dataArray) || (dataArray.length == 0)){
                return;
            }
            var max = {
                maxValue: 0,
                yAxFlag: false
            };
            var nullDataGroup = _.groupBy(dataArray,function(item){
                return item.value == null ? 'selected' :  'unSelected';
            });
            if(nullDataGroup && nullDataGroup.selected){
                if(nullDataGroup.selected.length == dataArray.length){
                    max.yAxFlag = true;
                }
            }
            if(nullDataGroup && nullDataGroup.unSelected && nullDataGroup.unSelected.length){
               var temp = _.max(nullDataGroup.unSelected,function(item){
                    return Number(item.value)
                });
                if(temp){
                    max.maxValue = temp.value || 0;
                    if(temp.value <= 0){
                        max.yAxFlag = true;
                    }
                }else{
                    max.maxValue = 0;
                   console.log('null data group error');
                }
            }
            return max;
        },
        formatValueItem:function(unit,value){
            if(!_.isNumber(value)){
                return '-';
            }
            var units = {
                'KB/s': 1024,
                'MB/s': 1024*1024,
                'GB/s': 1024*1024*1024,
                'TB/s': 1024*1024*1024*1024,
                'B/s' : 1
            };
            if(units[unit]){
                return (Number(value)/units[unit]).toFixed(2);
            }else{
                return value;
            }
        },
        setNetWorkDatas:function(data,title,types){
            if(!(_.isObject(data) && (!_.isArray(data) || !_.isFunction(data)))){
                return;
            }
            var seriesData = [];
            var MaxValueArray = _.chain(data).toArray().flatten().value();
            var MaxValue = implement.utils.getMaxValue(MaxValueArray);
            var unit = implement.utils.getUnit(MaxValue.maxValue);
            for(var key in data){
                var xArrayData = [],
                    seriesInnerData = [],
                    seriesDataSample = {
                        name: '',
                        type: 'line',
                        time: null,
                        data: null
                    };
                var dataResp = _.clone(data[key]);
                if(!_.isArray(dataResp)){
                    dataResp = [];
                }
                dataResp = _.sortBy(dataResp,'timestamp');
                $(dataResp).each(function(index, item){
                    xArrayData.push(implement.utils.formatTimeData(item.timestamp));
                    seriesInnerData.push(implement.utils.formatValueItem(unit,item.value));
                });
                seriesDataSample.data = null;
                seriesDataSample.time = null;
                seriesDataSample.name = null;
                var color=ef.util.EchartsColor.getColor(key,"host"+types);
                seriesDataSample.data = seriesInnerData;
                seriesDataSample.time = xArrayData;
                seriesDataSample.name = key+title+'('+unit+')';
                if(color){
                    seriesDataSample.itemStyle=color.itemStyle; seriesDataSample.lineStyle=color.lineStyle;

                }
                seriesData.push(seriesDataSample);
            }
            var xTimeData = null;
           /* if(seriesData && (seriesData.length == 2)){
                if(seriesData[0].time.length > seriesData[1].time.length){
                    xTimeData = seriesData[0].time;
                }else{
                    xTimeData = seriesData[1].time;
                }
            }else if(seriesData && (seriesData.length == 1)){
                xTimeData = seriesData[0].time;
            }else{
                return;
            }*/
            if(seriesData && seriesData.length){
                xTimeData = seriesData[0].time;
            }
            var yAxData = null;
            if(MaxValue.yAxFlag){
                yAxData = implement.yAxOther(unit);
            }else{
                yAxData = implement.yAx(unit);
            }
            implement.option4.xAxis[0].data = xTimeData;
            implement.option4.yAxis = yAxData;
            implement.option4.series = seriesData;
            implement.diskbox.setOption(implement.option4,true);
        }
    };
    /*implement.islocalstore=function(hostslave,id){//是否显示本地存储
        ef.getJSON({
            url:api.getAPI("hostslave.storage")+"?"+"volume_type=lvm",
            useLocal:false,
            success:function(response){
                console.log(response);
                if(!response.length){
                    $("#storage").css({"display":"none"});
                    return;
                }

                $(response).each(function(i,il){
                    if(il.id==id){
                        implement.storage(hostslave);
                        $("#storage").css({"display":"block"});
                    }
                });
            },
            error:function(err){
                $("#storage").css({"display":"block"});
                $("#nostore").css({"display":"block"});
                $("#totalstore").css({"display":"none"});
            }
        });
    };*/
    implement.storage=function(hostslave){//获取本地存储详细内容
        ef.getJSON({
            url:api.getAPI("hostalaveDetail")+"/"+hostslave+"/storages",
            useLocal:false,
            success:function(response){
                var totalused= 0,total= 0,html="",used=0;
                if(!response.length){
                    $("#nostore").css({"display":"block"});
                    $("#totalstore").css({"display":"none"});
                    return;
                }
                $("#nostore").css({"display":"none"});
                $("#totalstore").css({"display":"block"});
                $(response).each(function(i,il){
                    switch (il.free_size_unit){
                        case "TiB":
                            il.free_size=(il.free_size*1000).toFixed(2);
                            break;
                        case "PiB":
                            il.free_size=(il.free_size*1000*1000).toFixed(2);
                            break;
                        case "MiB":
                            il.free_size=(il.free_size/1000).toFixed(2);
                            break;
                        default :
                            il.free_size=Number(il.free_size).toFixed(2);
                            break;
                    }
                    switch (il.total_size_unit){
                        case "TiB":
                            il.total_size=(il.total_size*1000).toFixed(2);
                            break;
                        case "PiB":
                            il.total_size=(il.total_size*1000*1000).toFixed(2);
                            break;
                        case "MiB":
                            il.total_size=(il.total_size/1000).toFixed(2);
                            break;
                        default :
                            il.total_size=Number(il.total_size).toFixed(2);
                            break;
                    }
                    used=parseFloat(parseFloat(il.total_size)-parseFloat(il.free_size)).toFixed(2);

                    if(i%2!=0){
                        html='<div class="right rightstore" style="width:452px"><span class="upspan">'
                            +il.name+'</span><div class="easyui-progressbar progressbar" data-options="value:'+(used/il.total_size)*100+'" style="width:450px;height:13px;">'+
                            '<div class="progressbar-text" style="width: 448px; height: 13px; line-height: 13px;">'+'</div><div class="progressbar-value" style="width:'+(used/il.total_size)*100+
                            '%; height: 13px; line-height: 13px;"><div class="progressbar-text" style="width: 448px; height: 13px; line-height: 13px;background-color:transparent;">'+'</div></div>'+
                            '</div> <span class="left downspan"><i class="istyle usedstore" style="color:#333333">'+parseFloat(il.total_size-il.free_size).toFixed(2)+'GB</i>已用</span><span class="right downspan" >共：<i class="totalstore istyle">'+il.total_size+'</i>GB</span></div>';
                        $("#nodes-store").append(html);
                    }else{
                        html='<div class="left leftstore" style="width:452px"><span class="upspan">'
                            +il.name+'</span><div class="easyui-progressbar progressbar" data-options="value:'+(used/il.total_size)*100+'" style="width:450px;height:13px;">'+
                            '<div class="progressbar-text" style="width: 448px; height: 13px; line-height: 13px;">'+'</div><div class="progressbar-value" style="width:'+(used/il.total_size)*100+
                            '%; height: 13px; line-height: 13px;"><div class="progressbar-text" style="width: 448px; height: 13px; line-height: 13px;background-color:transparent;">'+'</div></div>'+
                            '</div> <span class="left downspan"><i class="istyle usedstore" style="color:#333333">'+parseFloat(il.total_size-il.free_size).toFixed(2)+'GB</i>已用</span><span class="right downspan" >共：<i class="totalstore istyle">'+il.total_size+'</i>GB</span></div>';
                        $("#nodes-store").append(html);
                    }
                    if(used>(il.total_size/3)*2&&used<(il.total_size*0.9)){
                        $("#nodes-store div.progressbar-value:eq("+i+")").addClass("highvalue");
                        //$("#nodes-store i.usedstore:eq("+i+")").addClass("highvaltext");
                    }else if(used>il.total_size*0.9){
                        $("#nodes-store div.progressbar-value:eq("+i+")").addClass("superhighvalue");
                       // $("#nodes-store i.usedstore:eq("+i+")").addClass("superhightext");
                    }
                    else{
                        $("#nodes-store div.progressbar-value:eq("+i+")").addClass("lowvalue");
                        //$("#nodes-store i.usedstore:eq("+i+")").addClass("lowvaltext");
                    }
                    totalused+=Number(used);
                    total+=parseFloat(il.total_size);
                    html="";
                    used=0;
                });
                $(".totalused").text(totalused+"GB已使用");
                $(".total").text(Number(total).toFixed(2));
            },
            error:function(err){
                $("#nostore").css({"display":"block"});
                $("#totalstore").css({"display":"none"});
            }
        });
    };
    implement.redraw= function () {
        domReady(function(){
        implement.init();
        implement.initText();
            ef.util.ready(function (dom) {
                $("#mastslavevm_grid").preload();
                $("#put_ipmi").parent().hide();
                var _data = dom.data("pageData");
                _data = ef.util.unescapeJSON(_data);
                if (_data) {
                    _data = JSON.parse(_data);
                }
                try{
                    if(!implement.socket){
                        implement.socket=new ef.server.Socket(api.getAPI('cal.slave.detail.socket',true),"cal.slave.detail.socket");
                    }
                    implement.socket.onopen = function () {
                        var a ={
                            "id": _data.id,	//宿主机ID
                            "chart": {
                                "counter_name": "hardware.cpu.percent",//监控指标项目名称
                                "limit": 10 //监控项限额
                            }
                        };
                        implement.socket.send(JSON.stringify(a));
                    };
                    implement.socket.onmessage = function(arg){
                        var data = JSON.parse(arg.data);
                        var dataResp = data.response;
                        switch (data.type){
                            case 'chart':
                                switch (dataResp.type){
                                    case 'hardware.cpu.percent':
                                        //implement.cpu_controll(data.records);
                                        implement.utils.setCpuMemDatas(dataResp.records);
                                        break;
                                    case 'hardware.memory.percent':
                                        //implement.memo_controll(data.records);
                                        implement.utils.setCpuMemDatas(dataResp.records);
                                        break;
                                    case 'hardware.network.incoming.bytes.rate':
                                        //implement.netin_controll(data.records);
                                        implement.utils.setNetWorkDatas(dataResp.records,'网络Input',"nic");
                                        break;
                                    case 'hardware.network.outgoing.bytes.rate':
                                        //implement.netout_controll(data.records);
                                        implement.utils.setNetWorkDatas(dataResp.records,'网络Output',"nic");
                                        break;
                                    default:
                                        console.log('cal.slave.detail.socket.type',dataResp.type);
                                        break;
                                }
                                break;
                            case 'vms':
                                implement.renderVmsState(dataResp,_data.name);
                                break;
                            case 'state':
                                if(dataResp=="quit")
                                {
                                    ef.nav.goto("mastslave.html","cal.hostslave");
                                    return;
                                }
                                if(dataResp=="available"){
                                    $(".hostSlaveDetail").find(".data_status").html('<i class="icon-status-done-success icon-hostslave"></i>'+ef.util.getLocale("cal.hostalave.status.able"));
                                }
                                else{
                                    $(".hostSlaveDetail").find(".data_status").html('<i class="icon-status-done-fail icon-hostslave"></i>'+ef.util.getLocale("cal.hostalave.status.disable"))
                                }
                                break;
                            case 'host_alarm':
                                if(dataResp == 'refresh'){
                                    implement.warnRef(_data.name,false,0);
                                }
                                break;
                        }

                    };
                }catch(e){
                    console.log('slave detail socket error',e);
                }
                if (implement.socket) {
                    implement.socket.slave = _data;
                }
                implement.description(_data.id);
                //implement.islocalstore(_data.name,_data.id);
                implement.storage(_data.name);
                if (users.isSys() || users.isSuper()) {
                    implement.warnTable(_data.name);
                }
                if (users.isSec() || users.isAudit()) {
                    //implement.warnTableElse(_data.name);
                }
                implement.warnRef(_data.name,true,0);
                $(".data_des").css({"border": "none"});
                var user, pass, ipmi, description, userCan, uesr1, pass1;
                $(".slave_input span.textbox").addClass("noborder");
                var _IntroBtns = $(".icons-mastslaveDetail").togglebutton([
                    [
                        {
                            iconClass: "icon-menus-icon-edit",//编辑
                            tip: ef.util.getLocale("setting.user.edit.tip"),
                            id: '1',
                            "access": [8, 88],
                            click: function (menu) {
                                _IntroBtns.goto(1);
                                $(".slave_input span.textbox").removeClass("noborder");
                                //ipmi
                                $("#put_ipmi").textbox('setValue', $("#a_ipmi").text());
                                $("#put_ipmi").parent().show();
                                $("#a_ipmi").hide();
                                //password
                                $("#pwd").textbox({editable: true});
                                $("#pwdEye").textbox({editable: true});
                                $("#put_ipmi").textbox({editable: true});
                                var passwordValue =  $("#pwd").textbox('getValue');
                                if(passwordValue == '-'){
                                    $("#pwd").textbox('clear');
                                }
                                //user
                                $(".data_ipmi_user").textbox({editable: true});
                                var userValue = $(".data_ipmi_user").textbox('getValue');
                                if(userValue == '-'){
                                    $(".data_ipmi_user").textbox('clear');
                                }
                                //desc
                                $(".data_des").attr("readonly", false).css({"border": "1px solid #bcbcbc"});
                                if ($(".data_des").val() == "-") {
                                    $(".data_des").val("");
                                }
                            }
                        }
                    ],
                    [
                        {
                            iconClass: "icon-menus-icon-save",
                            tip: ef.util.getLocale("setting.user.save.tip"),
                            id: '2',
                            "access": [8, 88],
                            click: function () {
                                if (!$(".data_ipmi_user").textbox('isValid') || !$("#put_ipmi").textbox('isValid') || !$("#pwd").textbox("isValid")) {
                                    return;
                                }
                                ef.loading.show();
                                user = $(".data_ipmi_user").textbox('getValue');
                                pass = $("#pwd").textbox('getValue');
                                ipmi = $("#put_ipmi").textbox('getValue');
                                description = ($(".data_des").val() == "-") ? "" : $(".data_des").val();
                                ef.getJSON({
                                    url: api.getAPI("hostalaveDetail") + "/" + _data.id,
                                    type: "post",
                                    isForce: true,
                                    data: {
                                        ipmi_user: user,
                                        ipmi_pass: pass,
                                        ipmi_ip: ipmi,
                                        des: description
                                    },
                                    success: function () {
                                        /*des = description;
                                        userCan = user;
                                        _IntroBtns.goto(0);
                                        $("#put_ipmi").parent().hide();
                                        $("#a_ipmi").show().text(ipmi);
                                        var url = window.location.protocol + "//" + $("#a_ipmi").text();
                                        $("#a_ipmi").attr("href", url);
                                        implement.ipmiCss();
                                        $(".data_des").attr("readonly", true).css({"border": "none"});*/
                                        _IntroBtns.goto(0);
                                        implement.description(_data.id);
                                        ef.loading.hide();
                                    },
                                    error: function (error) {
                                        ef.loading.hide();
                                    }
                                });
                            }
                        },
                        {
                            iconClass: "icon-menus-icon-cancel",
                            tip: ef.util.getLocale("setting.user.cancel.tip"),
                            "access": [8, 88],
                            click: function () {
                                /*if (!userCan) {
                                    $(".data_ipmi_user").textbox('setValue', user1);
                                    $("#pwd").textbox('setValue', pass1);
                                }
                                $("#a_ipmi").text(ipmi).show();
                                $("#put_ipmi").parent().hide();
                                $(".data_des").attr("readonly", true).css({"border": "none"}).empty().val(des);
                                implement.ipmiCss();
                                if ($(".data_des").val() == "") {
                                    $(".data_des").val("-");
                                }*/
                                if(!implement.ipmiDatas){
                                    return;
                                }
                                _IntroBtns.goto(0);
                                //ip
                                var ip = implement.ipmiDatas.ip;
                                if(ip == null || ip == ''){
                                    $("#a_ipmi").empty().removeAttr('href').hide();
                                    $('#put_ipmi').textbox('setValue','-').parent().show();
                                }else{
                                    $("#a_ipmi").empty().text(ip);
                                    var url = window.location.protocol+"//"+$("#a_ipmi").text();
                                    $("#a_ipmi").attr("href",url);
                                }
                                //user
                                var user = implement.ipmiDatas.user;
                                $(".data_ipmi_user").textbox('setValue',user||"-");
                                //password
                                var pass = implement.ipmiDatas.pass;
                                if(pass == null || pass == ''){
                                    $('#pwdEye').parent().hide();
                                    $('#pwd').textbox({
                                        type:'text',
                                        value:'-',
                                        icons:[]
                                    });
                                    $('#pwd').parent().show();
                                }else{

                                }
                                var des = implement.ipmiDatas.des;
                                if(des == null || des == ''){
                                    $(".data_des").val("-");
                                }else{
                                    $(".data_des").val(des);
                                }
                                $(".data_des").attr("readonly", true);
                                implement.ipmiCss();
                            }
                        }
                    ]
                ]).setStatus("2", true);//true是置灰不可用
                $(".slave_input span .textbox").keydown(function () {
                    _IntroBtns.setStatus("2", false);
                });
                $(".data_des").keydown(function () {
                    _IntroBtns.setStatus("2", false);
                });
                /*implement.socket.onopen = function () {
                    console.log('socket 连接成功');
                    implement.conClick();
                    $("#cc").combobox('select', 'cpu');
                };*/
                /*if(_data.status && _data.status == 'unavailable'){
                    $("#cc").combobox('disable');
                }*/
                //Timer_hostslaveDetail = new ef.Timer(10000,function(){
                //    var v = $("#cc").combobox('getValue');
                //    if (v=="cpu"){
                //        implement.cpu_controll(_data.id);
                //    }
                //    if (v=="memo"){
                //        implement.memo_controll(_data.id);
                //    }
                //    if (v=="inflow"){
                //        implement.netin_controll(_data.id);
                //    }
                //    if (v=="outflow"){
                //        implement.netout_controll(_data.id);
                //    }
                //},module.id);
                //Timer_hostslaveDetail.start();
                //implement.cpu_controll(_data.id,Timer_hostslaveDetail);
                //implement.conClick(_data.id,Timer_hostslaveDetail);
                implement.host_datagrid(_data.name, _data.id);
                implement.host_table(_data.name, _data.id);
                //加载好table才能触发socket
                implement.socket.onopen = function() {
                    implement.conClick();
                    $("#cc").combobox('select', 'cpu');
                };
                //$('#mastslavevm_grid').datagrid('loading');
            });
            implement.setTestOutput();

    });
    };
    implement.renderVmsState = function(data,name){
        if(!implement.gridHadLoaded){
            return;
        }
        var targetData = null,
            targetDom = null;
            //currentRowsData = $("#mastslavevm_grid").datagrid('getRows');
        var currentRowsData = $("#mastslavevm_grid").datagrid('getData').rows;
        if(data=="refresh"){
            implement.host_table(name);
        }
        for (var i in data){
            $(currentRowsData).each(function (e,el) {
                if(i==el.name){
                    if(data[i].cpu_util){
                        el.used_cpus = data[i].cpu_util.value;
                    }
                    if(data[i].memory_util){
                        el.used_memory_mb = data[i].memory_util.value;
                    }
                    if(data[i].state){
                        el.state = data[i].state;
                    }
                }
            });
        }
        var num=$("#mastslavevm_grid").datagrid("options").pageNumber;
        $("#mastslavevm_grid").datagrid('loadData',currentRowsData);
        $("#mastslavevm_grid").datagrid("clientPaging").datagrid('goto',num);
        //function formatState(newData){
        //    var extendData = {
        //        name:newData['name']
        //    };
        //    if(extendData.cpu_util){
        //        extendData.value = _.isNumber(newData.cpu_util.value)? newData.cpu_util.value.toFixed(2) : '0.00';
        //        extendData.prefix = 'cpus';
        //    }
        //    if(extendData.memory_util){
        //        extendData.value = _.isNumber(newData.memory_util.value)? newData.memory_util.value.toFixed(2) : '0.00';
        //        extendData.prefix = 'memo';
        //    }
        //    if(extendData.value > 100){
        //        extendData.value = '100.00';
        //    }
        //    return extendData;
        //}
        //if(currentRowsData.length){
        //    targetData = formatState(data);
        //    if(!targetData.prefix){
        //        return;
        //    }
        //    try{
        //        targetDom = $('#'+targetData.name+targetData.prefix);
        //        targetDom.progressbar('setValue',targetData.value);
        //        targetDom.parent().find('a').html(targetData.value);
        //    }catch(e){
        //        console.log('set progress bar error');
        //    }
        //}
    };
    implement.destroy = function () {
        if(implement.socket){
            implement.socket.close();
        }
        require.undef(module.id);
    };
    return implement;
});
