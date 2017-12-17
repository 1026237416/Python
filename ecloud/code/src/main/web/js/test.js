/**
 * Created by wangahui1 on 15/11/17.
 */
define("test",["upload","show-hint","anyword-hint","codemirror","shell","python","shell-hint","python-hint","api",'echart',"clientPaging"],function (upload,showHint,anywordHint,CodeMirror,shell,python,shellHint,pythonHint,api,echart,clientPaging) {
    var cn2uni=$('.changeCode').cn2uni();
    var globla = {};
    ef.getJSON(
        {
            url:"data/config.json",
            useLocal:true,
            success:function(response)
        {
            $('#conf').click(function(){
                alert('eeeefdf');
            });
           /* var echartOneConfig ={
            title : {
                text: '温度计式图表'
            },
            legend: {
                data:['蒸发量']
            },
            tooltip : {
                padding: 5,
                trigger: 'axis',
                axisPointer : {
                    type : 'shadow'
                },
                textStyle: {
                    fontSize: 10
                },
                formatter: function (params){
                    var _data=params[0].data;
                    return JSON.stringify(_data)
                }
            },
            grid:{
                x: 50,
                x2: 15,
                y2: 70
            },
            calculable : true,
            xAxis : [
                {
                    type : 'category',
                    data : [],
                    axisLabel : {
                        rotate:35,
                        margin: 8,
                        interval: 0,
                        textStyle:{
                            color: 'red',
                            align: 'right',
                            fontSize: 10,
                            baseline: 'middle',
                            fontStyle: 'normal',
                            fontWeight: 'normal'
                        }
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
        };*/
            var echartOneConfig = {
                title : {
                    text: 'CPU利用率TOP5',
                    x:'center',
                    textStyle:{
                        fontSize:16,
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
                toolbox: {
                    show : false,
                    feature : {
                        mark : {show: true},
                        dataView : {show: true, readOnly: false},
                        restore : {show: true},
                        saveAsImage : {show: true}
                    }
                },
                grid:{
                    x: 50,
                    y2: 70
                },
                calculable : true,
                xAxis : [
                    {
                        type : 'category',
                        data : [],
                        axisLabel : {
                            rotate:35,
                            interval:0
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
                                barBorderWidth: 6,
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
            echartOneConfig.xAxis[0].data = (function(num){
                var temp = [];
                for(var i = 0; i < num; i++){
                    temp.push('192.168.100.00'+i);
                }
                return temp;
            })(5);
            echartOneConfig.series[0].data = (function(num){
                var temp = [];
                for(var i = 0; i < num; i++){
                    temp.push({
                        "value": 1,
                        "total": "4 * 3247",
                        "host_ip": '192.168.100.00'+i,
                        "unit": "%",
                        "sample_id": "578613ee71ff7104cbce75ed",
                        "totals": "12.99",
                        "used": "2.60",
                        "left": "10.39",
                        "name": "10.10.3.41"
                    })
                }
                return temp;
            })(5);
            var echartOneLeft = echart.init($('.echart-1-left')[0]);
            echartOneLeft.setOption(echartOneConfig);
            var echartOneRight = echart.init($('.echart-1-right')[0]);
            echartOneRight.setOption(echartOneConfig);

            var option = {
                tooltip : {
                    trigger: 'axis'
                },
                xAxis : [
                    {
                        splitLine:{
                            show:true
                        },
                        type : 'category',
                        boundaryGap : true,
                        data : (function (){
                            var res = [];
                            var len = 10;
                            while (len--) {
                                res.push(len + 1);
                            }
                            return res;
                        })()
                    }
                ],
                yAxis : [
                    {
                        type : 'value',
                        scale: true,
                        name : '预购量',
                        boundaryGap: [0.2, 0.2]
                    }
                ],
                grid:[{
                    show:false,
                    width:'auto',
                    height:'auto',
                    borderColor: '#ff0000',
                    borderWidth:1,
                    backgroundColor:"white"
                }],
                series : [
                    {
                        name:'最新成交价',
                        type:'line',
                        data:(function (){
                            var res = [];
                            var len = 10;
                            while (len--) {
                                res.push((Math.random()*10 + 5).toFixed(1) - 0);
                            }
                            return res;
                        })()
                    }
                ]
            };
            var echartTwo = echart.init($('.echart-2')[0]);
            echartTwo.setOption(option,true);

            var lastData = 11;
            var axisData;
            clearInterval(globla.timeTicket);
            globla.timeTicket = setInterval(function (){
                lastData += Math.random() * ((Math.round(Math.random() * 10) % 2) == 0 ? 1 : -1);
                lastData = lastData.toFixed(1) - 0;
                axisData = (new Date()).toLocaleTimeString().replace(/^\D*/,'');
                option.xAxis[0].data.shift();
                option.xAxis[0].data.push(axisData);
                option.series[0].data.shift();
                option.series[0].data.push(lastData);
                echartTwo.setOption(option,true);
            }, 2100);

            ef.config.webroot=response.webroot;
            $(document).ready(function()
            {
                var data = [{
                    "displayname": "RegionOne",
                    "url": "https://10.10.132.51:8443",
                    "region": "Region_51_0617160224-1",
                    "security": 0,
                    "is_current_region": true,
                    "id": 2,
                    "selected": true
                },{
                    "displayname": "RegionTwo",
                    "url": "https://10.10.132.51:8443",
                    "region": "Region_51_0617160224-2",
                    "security": 0,
                    "is_current_region": true,
                    "id": 2,
                    "selected": false
                },{
                    "displayname": "RegionThr",
                    "url": "https://10.10.132.51:8443",
                    "region": "Region_51_0617160224-3",
                    "security": 0,
                    "is_current_region": true,
                    "id": 2,
                    "selected": false
                }];
                $('.data-center-wrapper').dataCenter(data,{
                    textField:'displayname',
                    valueField:'region',
                    onSelect:function(data){
                        console.log('yangtao------',data);
                    }
                });
                $(".test").timeline({
                    data:[
                        {label:"2015-08-01",value:"我的备份",description:"你好你好你好你好你好你好你好"},
                        {label:"2015-09-02",value:"我的备份",description:"你是谁你是谁你是谁你是谁"},
                        {label:"2015-10-03",value:"我的备份",description:"你好你好你好你好"},
                        {label:"2015-10-04",value:"我的备份",description:"你好你好你好你好"}
                    ],
                    config:null}).click(function(obj)
                {
                    console.log(obj);
                });
                window.bound=function()
                {
                    $(".dialog-box").dialog({
                        title: '预览',
                        width:800,
                        height:600,
                        closed: false,
                        cache: false,
                        nobody:false,
                        href: 'subview.html',
                        modal: true
                    });
                };
                $(".icons-box li").each(function(i,li)
                {
                    li=$(li);
                    li.find("span").text(li.find("i").attr("class"));
                });
                $(".topo-box").topo(
                    {
                        "columns":[
                            {"label":"Vlan 130","id":"002","detail":"名称：VLAN130，CIDR：192.168.130.64/25，网关：192.168.130.95，IP占用：5/29","location":"vlan001"},
                            {"label":"Vlan 140","id":"003","detail":"名称：VLAN131，CIDR：192.168.131.128/26，网关：192.168.131.190，IP占用：30/61","location":"vlan002"},
                            {"label":"Vlan 132","id":"004","detail":"名称：VLAN132，CIDR：192.168.132.128/25，网关：192.168.132.254，IP占用：20/125","location":"vlan003"}
                        ],
                        "items":
                            [
                                {"from":"001","to":"004","status":"1","twoway":"0"},
                                {"from":"002","to":"004","status":"0","twoway":"1"},
                                {"from":"002","to":"003","status":"1","twoway":"0"},
                                {"from":"003","to":"004","status":"1","twoway":"1"},
                                {"from":"001","to":"003","status":"1","twoway":"0"}
                            ]
                    }

                ).click(function()
                {
                    console.log(arguments);
                });
                var ipers=$(".ip_box").ip(
                    {
                        cidr:"192.168.130.64/16",
                        range:[1,64],
                        select:[65,68,69]
                    },{isEdit:true,isOptimize:true}).change(function(square)
                    {
                        console.log(square);
                    });
                $(".select_ip_all").click(function () {
                    ipers.selectAll();
                });
                $(".unselect_ip_all").click(function () {
                    ipers.unSelectAll();
                });
                $(".ip_click").click(function () {
                    var ipoccupyall = ipers.getIpRange();
                    var result = [];
                    var tmp;
                    while(tmp = ipoccupyall.shift()){
                        if(result.length == 0){
                            result.push([tmp]);
                            continue;
                        }

                        var e = result[result.length - 1];
                        if(tmp == e[e.length - 1] + 1){
                            e.push(tmp);
                        }else{
                            result.push([tmp]);
                        }
                    }
                   console.log(result);
                });
                ipers.setNetgate(64,true);
                var ib=$(".increment-box").incrementNum({oldValue:90,newValue:1057,total: 50000});
                var ib2=$(".increment-box2").incrementNum({oldValue:200,newValue:20031,total: 50000});
                $("#playBtn").click(function()
                {
                    /*var random=ef.util.getInitRandom(1000);
                    ib.play({newValue:random});*/
                    var random=ef.util.getInitRandom(1000);
                    ib.play({newValue:random},true);
                    var random2=ef.util.getInitRandom(10000);
                    ib2.play({newValue:random2},true);
                });
                var icons=$(".menu-box").iconmenu([
                    {
                        iconClass:"icon-menus-icon-edit",
                        tip:"test",
                        id:"99",
                        "disable":true,
                        position:
                        {
                            x:0,
                            y:0
                        },
                        click:function()
                        {

                        }

                    },
                    {
                        iconClass:"icon-menus-icon-add",
                        tip:"test",
                        click:function()
                        {

                        }

                    },
                    {
                        isToggle:true,
                        'access':[88],
                        click:function()
                        {

                        },
                        data:
                            [
                                [
                                    {
                                        iconClass: "icon-menus-icon-edit",//显示第图标css样式
                                        tip: ef.util.getLocale("setting.user.edit.tip"),//提示文字
                                        id: '11111',//标识的唯一id
                                        click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                            menu.owner.owner.goto(1)
                                        }
                                    }
                                ],
                                [
                                    {
                                        iconClass: "icon-menus-icon-add",//显示第图标css样式
                                        tip: ef.util.getLocale("setting.user.cancel.tip"),//提示文字
                                        id: '2',//标识的唯一id
                                        isAnimal:true,
                                        click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                            //console.log(menu);//输出{data:{当前数据,disable:false,dom:当前生成的dom节点,owner:IconMenus对象}}
                                            menu.owner.owner.goto(0);
                                        }
                                    }
                                    ,
                                    {
                                        iconClass: "icon-menus-icon-cancel",//显示第图标css样式
                                        tip: ef.util.getLocale("setting.user.edit.tip"),//提示文字
                                        id: '3',//标识的唯一id
                                        isAnimal:true,
                                        click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                            menu.owner.owner.goto(1)
                                        }
                                    }
                                ]
                            ]

                    }
                    ,
                    {
                        iconClass:"icon-menus-icon-edit",
                        tip:"test",
                        click:function()
                        {

                        }

                    }
                ]);
                //icons.setStatus("99",false);
                //icons.menus[2].goto(0);
                var tog=$(".toggle-box").togglebutton([
                    [
                        {
                            iconClass:"icon-menus-icon-add",
                            tip:"dsdd",
                            "disable":true,
                            position:
                            {
                               x:10,
                                y:5
                            },
                            click:function()
                            {

                            }

                        },
                        {
                            iconClass:"icon-menus-icon-add",
                            tip:"ddd",
                            click:function()
                            {

                            }

                        },
                        {
                            iconClass:"icon-menus-icon-add",
                            tip:"test",
                            click:function()
                            {

                            }

                        },
                        {
                            isToggle:true,
                            click:function()
                            {

                            },
                            data:
                                [
                                    [
                                        {
                                            iconClass: "icon-menus-icon-edit",//显示第图标css样式
                                            tip: ef.util.getLocale("setting.user.edit.tip"),//提示文字
                                            id: '1',//标识的唯一id
                                            click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                                menu.owner.owner.goto(1)
                                            }
                                        }
                                    ],
                                    [
                                        {
                                            iconClass: "icon-menus-icon-cancel",//显示第图标css样式
                                            tip: ef.util.getLocale("setting.user.cancel.tip"),//提示文字
                                            id: '1',//标识的唯一id
                                            click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
                                                //console.log(menu);//输出{data:{当前数据,disable:false,dom:当前生成的dom节点,owner:IconMenus对象}}
                                                menu.owner.owner.goto(0);
                                            }
                                        }
                                    ]
                                ]

                        }
                    ]
                ]);
                $("#openDialog").click(function()
                {
                    $.messager.confirm(ef.alert.warning,'你确定要删除xx用户吗？',function(ok)
                    {

                    });
                });
                var _iconstep=$(".iconstep-box").iconstep(
                    [
                        {
                            text:ef.util.getLocale('host.addhost.dialog.iconstep.info.text'),//"基本信息",
                            iconClass:"step-base-icon",
                            iconSelectedClass:"step-base-icon",
                            selected:true
                        },
                        {
                            text:ef.util.getLocale('host.addhost.dialog.iconstep.setting.text'),//"配置选择",
                            iconClass:"step-setting-icon",
                            iconSelectedClass:"step-setting-icon-select",
                            selected:false
                        },
                        {
                            text:ef.util.getLocale('host.addhost.dialog.iconstep.network.text'),//"网络和主机",
                            iconClass:"step-net-icon",
                            iconSelectedClass:"step-net-icon-select",
                            selected:false
                        },
                        {
                            text:ef.util.getLocale('host.addhost.dialog.iconstep.finish.text'),//"完成",
                            iconClass:"step-complete-icon",
                            iconSelectedClass:"setp-complete-icon-select",
                            selected:false
                        }
                    ]).change(function(response)
                    {
                        console.log(response);
                    });
                $(".firstBtn").click(function()
                {
                    _iconstep.first();
                });
                $(".lastBtn").click(function()
                {
                    _iconstep.last();
                });
                $(".prevBtn").click(function()
                {
                    _iconstep.prev();
                });
                $(".nextBtn").click(function()
                {
                    _iconstep.next();
                });
                var _stack=$(".viewstack-box").viewstack().change(function(pos)
                {
                    console.log("viewstack",pos);
                    console.log(_stack.getStack(pos));
                });
                $(".vfirstBtn").click(function()
                {
                    _stack.first();
                });
                $(".vlastBtn").click(function()
                {
                    _stack.last();
                });
                $(".vprevBtn").click(function()
                {
                    _stack.prev();
                });
                $(".vnextBtn").click(function()
                {
                    _stack.next();
                });

            });
            var obj={name:20};
            var cidr=ef.util.getCidr("200.6.12.55/21");
            //console.log(cidr.ip,cidr.mask);
            //console.log(cidr.getNetAddress());
            //console.log(cidr.getNotMask());

            var _iconchange=$(".iconchange-box").iconchange(
                [
                    {
                        text:"[IP]信息",//"基本信息",
                        iconClass:"step-change-info",
                        iconAllClass:"step-change-all-info",
                        iconSelectedClass:"step-change-all-info-select",
                        selected:true
                    },
                    {
                        text:"选择配置",//"配置选择",
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
                        text:"数据盘",//"完成",
                        iconClass:"step-change-disk",
                        iconAllClass:"step-change-all-disk",
                        iconSelectedClass:"step-change-all-disk-select",
                        selected:false
                    },
                    {
                        text:"完成",//"完成",
                        iconClass:"step-change-over",
                        iconAllClass:"step-change-all-over",
                        iconSelectedClass:"step-change-all-over-select",
                        selected:false
                    }
                ],1000);
            $(".firstBtn").click(function()
            {
                _iconchange.first();
            });
            $(".lastBtn").click(function()
            {
                _iconchange.last();
            });
            $(".prevBtn").click(function()
            {

            });
            $(".nextBtn").click(function()
            {
                _iconchange.destroy();
            });
            //_iconchange.click();
            require(["api"],function(api)
            {
                //$.getJSON(api.getAPI("cal.host.getHostlist"),function(response)
                //{
                //    console.log("result",response);
                //});
                //$.getJSON(api.getAPI("cal.host.getHostlist"),function(response)
                //{
                //    console.log("result",response);
                //});

            });
            $(".winFormBtn").click(function()
            {
                var dialog=new ef.Dialog("winDialog",
                    {
                        width:600,
                        height:380,
                        closable:false,
                        noHeader:true,
                        href:"views/testDialog.html"
                    });
            });
            var dest={};
            var foo=
            {
                name:"test",
                age:3
            };
            var foo2=ef.util.copyProperty(dest,foo);
            console.log(foo2);//输出{name: "test", age: 3}
            console.log(dest==foo);//输出false
            console.log(dest==foo2);//返回true
            foo.age=15;
            console.log(dest.age);//输出3

            var extendCanvas=$("#extendCanvas")[0];
            var extendContext=extendCanvas.getContext("2d");
            extendContext.fillStyle="#0000ff";
            extendContext.strokeStyle="#ff0000";
            extendContext.roundRect(10,10,50,30,10,false,true);
            extendContext.dashedLineTo(50, 50, 120, 120, 5);
            extendContext.dashStorkeRect(130,130,100,100,5,false);
            extendContext.circle(70,220,50,false);
            extendContext.cross(70,220,50);
            //深复制
            var obj=
            {
                name:"deepCopy",
                contents:[1,2,3],
                attach:
                {
                    age:2
                }
            };
            var deepObj=ef.util.copyDeepProperty(obj);
            console.log(deepObj);//输出{name: "deepCopy", contents: [1, 2, 3], attach: {age: 2}}
            console.log(obj==deepObj)//输出false;
            obj.contents[1]=3;
            console.log(obj.contents,deepObj.contents);//输出 [1, 3, 3] ,[1,2,3]
            delete obj.attach;
            console.log(obj,deepObj);//输出 {name: "deepCopy", contents: [1, 3, 3]} ,{name: "deepCopy", contents: [1, 2, 3], attach: {age: 2}}

            console.log(ef.util.getInitRandom(10000));//输出随机整数 ，eg:5874

            console.log(ef.util.getUUID());//输出唯一的字符串 1449735051746_57883084

            console.log(ef.util.getRandomArrs([1,"a",201]));//随机输出数组中的一个值，eg:a

            var jsonObj={name:"abc",age:2};
            var str=JSON.stringify(jsonObj);
            console.log(str);//输出{"name":"abc","age":2}
            console.log(ef.util.escapeJSON(str));//输出%7B%22name%22%3A%22abc%22%2C%22age%22%3A2%7D
            //var dom=$('<div onclick="alert(\''+str+'\')">aaa</div>');
            //var dom2=$('<div style="height:30px" onclick="alert(\''+ef.util.escapeJSON(str)+'\')">aaa</div>');
            //$(document.body).append(dom);//点击字符串aaa后报错 ：提示SyntaxError: Unexpected EOF.意味着字符串打乱了dom结构
            //$(document.body).append(dom2);//弹出%7B%22name%22%3A%22abc%22%2C%22age%22%3A2%7D

            var str="%7B%22name%22%3A%22abc%22%2C%22age%22%3A2%7D";
            console.log(ef.util.unescapeJSON(str));//输出 {"name":"abc","age":2}

            console.log("xxx",ef.util.valueInRange(5,[1,233]));
            $("#showPlaBtn").click(function()
            {
                ef.placard.show("["+(new Date()).getTime()+"]"+"内容已经更改，请详细查看");
            });
            var coor=new ef.Coor(".icon-box","./theme/default/images/icons.png");
            //ef.placard.info("sss");
            ef.placard.info("welcome to test.html");
            $("#showWarnPlaBtn").click(function()
            {
                ef.placard.warn("This is warn!");
            });
            $("#showErrorPlaBtn").click(function()
            {
                ef.placard.error("This is error!");
            });
            $("#showMailPlaBtn").click(function()
            {
                ef.placard.mail("This is mail!");
            });
            $("#showTickPlaBtn").click(function()
            {
                ef.placard.tick("ticked msg");
            });
            $("#showDoingPlaBtn").click(function()
            {
                ef.placard.doing("doing msg");
            });
            $("#showCustomPlaBtn").click(function()
            {
                ef.placard.custom("自定义图标",undefined,"testIcon");
            });
            $("input#bo").keypress(function(e)
            {
                console.log("change",e);
            });
            console.log(ef.util.formatTime(1454568829,"Y-M-D",true));//输出2016-02-04
            $("#downloadBtn").click(function()
            {
                var download=new ef.Download();
                download.start("test.rar.zip");
            });
            var backup=$("#backupBox").backup({
                status:"available",
                backups:[
                    {
                        title:"云主机备份4",
                        time:1456477321100,
                        size:2,
                        unit:"GB",
                        des:"描述1dsfdsfdsfddsdsdsdsdssd",
                        status:"available"
                    },
                    {
                        title:"云主机备份5",
                        time:1456277321105,
                        size:200,
                        unit:"GB",
                        des:"描述2",
                        status:"error"
                    },
                    {
                        title:"云主机备份6",
                        time:1456277321105,
                        size:20,
                        unit:"GB",
                        des:"描述2",
                        status:"creating"
                    },
                    {
                        title:"云主机备份7",
                        time:1456277321105,
                        size:20,
                        unit:"GB",
                        des:"描述2",
                        status:"deleting"
                    }
                ]

            },{formatter:function(rowData)
            {
                return rowData.title;
            }}).click(function(rowData,btnData)
            {
                console.log(rowData,btnData);
            });
            backup.getRows()[0].menu.setStatus(1,true);
            var stooges = [{name: 'moe', age: "b"},{name: 'moe', age: 09}, {name: 'larry', age: 50}, {name: 'curly', age: 60},{name:"aa",age:06}]; console.log(_.sortBy(stooges,"age"));
            console.log(ef.util.getLocale("easyui.test.label",["a","b","c"]));
            $(".whitelist").textbox(
                {
                    width:400,
                    height:30,
                    prompt:"只能输入字母，数字，下划线(其他字符不可输入)",
                    type:"text",
                    validType: 'whitelist["a-zA-Z0-9_","只能输入字母，数字，下划线"]'
                });
            $(".blacklist").textbox(
                {
                    width:400,
                    height:30,
                    prompt:"不能输入中文(其他字符都可输入)",
                    type:"text",
                    validType: 'blacklist["\u4e00-\u9fa5","不能输入中文"]'
                });
            $(".reg").textbox(
                {
                    width:450,
                    height:30,
                    prompt:"用正则直接匹配(比如只能输入数字的正则，反斜杠要成对出现)",
                    type:"text",
                    validType: 'reg[/\\d+/]'
                });
            $(".regx").textbox(
                {
                    width:450,
                    height:30,
                    prompt:"用正则直接匹配,与reg区别是可以自定义提示问题",
                    type:"text",
                    validType: 'regx[/\\d+/,"我是定义提示信息，只能输入数字"]'
                });
            $(".len").textbox(
                {
                    width:450,
                    height:30,
                    prompt:"请输入长度2到8位",
                    type:"text",
                    required:true,
                    validType: 'length[2,8]'
                });
            $(".minlen").textbox(
                {
                    width:450,
                    height:30,
                    prompt:"最小长度2位",
                    type:"text",
                    validType: 'minlength[2]'
                });
            $(".email").textbox(
                {
                    width:450,
                    height:30,
                    prompt:"请输入email格式",
                    type:"text",
                    validType: 'email'
                });
            $(".url").textbox(
                {
                    width:450,
                    height:30,
                    prompt:"请输入url格式",
                    type:"text",
                    validType: 'url'
                });
            $(".remote").textbox(
                {
                    width:450,
                    height:30,
                    prompt:"服务端校验,每次输入都会调用服务端返回结果",
                    type:"text",
                    validType: 'remote["http://url:port"]'
                });
            $("#uploadBtn").click(function() {
               var formData = new FormData($("#uploadForm")[0]);
               $.ajax({
                   url: 'http://localhost/server/upload.php',
                   type: 'POST',
                   data: formData,
                   async: false,
                   cache: false,
                   contentType: false,
                   processData: false,
                   success: function (returndata) {
                       alert(returndata);
                   },
                   error: function (returndata) {
                       alert(returndata);
                   }
               });
            });
            $("#uploadBtn").click(function()
            {
                ef.getJSON
                (
                    {
                        isFormData:true,
                        async: false,
                        cache: false,
                        contentType: false,
                        processData: false,
                        url:"http://localhost/server/upload.php", //用于文件上传的服务器端请求地址
                        type: 'put',
                        isUpload:true,
                        fileFormId:"uploadForm",
                        fileElementId: 'fileUp', //文件上传域的ID
                        success: function (data, status)  //服务器成功响应处理函数
                        {
                            console.log(data);
                            console.log(status);
                        },
                        error: function (data, status, e)//服务器响应失败处理函数
                        {
                            alert(e);
                        }
                    }
                )
            });
            var upd=$("#uploadBox").upload
            ({
                id:"file",
                url:"http://localhost/server/upload.php",
                type:"POST",
                filters:[".txt"],
                formElements:[
                    {
                        type:"textbox",
                        id:"id",
                        prompt:"请输入license",
                        required:true,
                        width:320,
                        height:26,
                        validType: 'regx[/^\\d+$/,"只能输入数字"]'
                    }],
                success:function(response)
                {

                },
                fail:function(fail)
                {
                    console.log(arguments);
                }

            });
            $("#sssBtn").click(function()
            {
                console.log(upd);
                upd.upload.upload();
            });
            $(".buttonstep_box").buttonstep().confirm(function(btn)
            {
                console.log("sss");
                this.setEnabled(false);
            });
            $(".preload_box").preload();

            $(".sequenceBtn").click(function()
            {
                var dom=this;
                $(dom).next().empty();
                var sequence=new ef.SequenceLoader([
                    {
                        url:"http://www.baidu.com",
                        type:"GET",
                        success:function()
                        {

                        },
                        error:function()
                        {

                        }
                    },
                    {
                        url:"http://www.qq.com",
                        type:"GET",
                        success:function()
                        {

                        },
                        error:function()
                        {

                        }
                    }]).complete(function(result)
                    {
                        console.log("sequenceLoaderSuccess");
                        var sib=$("<p><ul>" +
                            "<li><label>请求的序号:</label><span></span></li>" +
                            "<li><label>请求url:</label><span></span></li>" +
                            "<li><label>本次加载是否成功:</label><span></span></li>" +
                            "<li><label>是否全部加载完毕:</label><span></span></li>" +
                            "</ul></p>");
                        sib.find("li:eq(3) span").text(result.loaded);
                        sib.find("li:eq(2) span").text(result.success);
                        sib.find("li:eq(0) span").text(result.index);
                        sib.find("li:eq(1) span").text(result.request.url);
                        $(dom).next().append(sib);
                    }).allExecuted(function()
                {
                    console.log("所有请求执行完毕");
                });;
            })
            var switcher=$(".switchBox").switch(
                {
                    checked:true,
                    disabled:false,
                    onTip:"关机",
                    offTip:"开机",
                    onLabel:"开",
                    offLabel:"关",
                    change:function(checked)
                    {
                        console.log("abc",this);
                        console.log(checked);
                    }});
            var squireData = [1,2,3,4,5,6];
            var dataTRwo = [1,2,3,4,5,6];
            var quota = $(".quotaBox").squire(
                {
                    data:squireData,
                    allBackClass:""
                    //selectClass:"selectSquireClass"
                }
            );
            quota.click(function (response) {
                console.log(response);
            });
            quota.setStatus(false);
            console.log(quota.select());
            $("#quotaClick").click(function () {
                quota.setStatus(true);
                console.log(quota.select());

            });
            quota.setSelect("1");
            quota.select(function (data) {
                console.log(data);
            });
            var applyBox = $(".applyBox").param(
                {
                    dataProvider:[{la:"all",value:"1"},{la:"po",value:"2"},{la:"uiui",value:"4"}],
                    labelField:"la",
                    valueField:"value"
                }
            );
            applyBox.click(function (response) {
                console.log(response);
            });
            $(".paramClickAdd").click(function () {
                applyBox.addParam({la:"1",value:"10"});
            });
            $(".paramClick").click(function () {
                console.log(applyBox.getAllData());
            });
            var appData = [
                {
                    name:"1",
                    value:2
                },{
                    name:"3",
                    value:3
                },
                {
                    name:"4",
                    value:4
                },
                {
                    name:"5",
                    value:5
                },
                {
                    name:"6",
                    value:6
                },
                {
                    name:"7",
                    value:7
                },
                {
                    name:"8",
                    value:8
                },
                {
                    name:"9",
                    value:9
                }];
            var app = $(".appBox").appBlock({
                icon:[
                    {
                        iconClass:"icon-menus-icon-add",
                        tip:"01"
                    },
                    {
                        iconClass:"icon-menus-icon-save",
                        tip:"02"
                    },{
                        iconClass:"icon-menus-icon-cancel",
                        tip:"03"
                    }],
                labelField:"name",
                valueField:"value",
                valueField:"value",
                data:appData
            });

            var tiles=$(".TilesBox").tiles(
                {
                    icon:[
                        {
                            iconClass:"icon-menus-icon-add",
                            tip:"01"
                        },
                        {
                            iconClass:"icon-menus-icon-save",
                            tip:"02"
                        },{
                            iconClass:"icon-menus-icon-cancel",
                            tip:"03"
                        }],
                    labelField:"name",
                    valueField:"value",
                    data:appData
                });
            var appdata = ["0","0","0","0","0","0","1"];
            app.iconClick(function (data,index) {
                console.log(data,index);
                if(index==0){
                    app.removeBlock(data.index);
                    //app.loadData(appData);
                }
            });
            $(".testUl").click(function(event)
            {
                console.log($(event.target).index());
                $(this).remove();
            });

            //editor.doc.markClean();
            ef.i18n.parse();

            var checkData = [{la:"qweerwer",val:"1"},{la:"tyuiyiuy",val:"2"},{la:"ghjkhk",val:"4"},{la:"zsdfdsf",val:"5"},{la:"kljhljh",val:"6",isAlwaysSelected:true}];
            var check = $(".checkBox").checkinfo({
                dataProvider:checkData,
                labelField:"la",
                valueField:"val",
                className:"checkInfo-test-class"
            }).click(function()
            {
                console.log(arguments);
            });

            var checkbox = $(".checkRadio").checkinfo({
                dataProvider:checkData,
                labelField:"la",
                valueField:"val",
                checkType:"radio"
            });
            check.click(function (data) {
                //check.add([{la:"aaa",val:"aaa"}]);
                //check.select(function (a) {
                //    console.log(a);
                //});
                //console.log(data);
            });
            //check.setStatus(false);
            check.setSelect('2');
            //check.setStatus(true);
            var load=$(".cover_box").coverlayer({loadingHeight:234},{opaque:true});
            /*var socket=new ef.server.Socket("ws://localhost","abc");
            socket.onclose=function(event)
            {
                console.log(event);
            };
            socket.onerror=function(event)
            {
                console.log(event);
            };*/
            console.log("search",ef.util.search([{name:"a",age:10},{name:"b",age:20},{name:"a"}],{key:"age",value:20}));
             var picker=$(".pickerBox").picker(
                {
                    dataProvider:[
                        {
                            icon:"icon-menus-icon-run",
                            selected:true
                        },
                        {
                            icon:"icon-menus-icon-delete"
                        },
                        {
                            icon:"icon-menus-icon-shutdown"
                        },
                        {
                            icon:"icon-menus-icon-edit"
                        },
                        {
                            icon:"icon-menus-icon-search"
                        },
                        {
                            icon:"icon-menus-icon-info"
                        },
                        {
                            icon:"icon-manor-add"
                        }

                    ]
                }
                );
            console.log(picker.getSelected());
            var editor=null;
            $(".code_mirror_select").combobox(
                {
                    textField:"label",
                    valueField:"value",
                    width:200,
                    height:30,
                    data:[
                        {
                            label:"shell",
                            value:"shell",
                            selected:true
                        },
                        {
                            label:"python",
                            value:"python"
                        }
                    ],
                    onChange:function(newValue,oldValue)
                    {
                        var lastValue;
                        if(editor)
                        {
                            lastValue=editor.getValue();
                        }
                        CodeMirror.commands.autocomplete = function(cm) {
                            cm.showHint({hint:CodeMirror.hint[newValue]});
                        };
                        $(".codeBox #code").siblings().remove();
                        editor=CodeMirror.fromTextArea($(".codeBox #code").get(0), {
                            mode: newValue,
                            lineNumbers: true,
                            lineWrapping: true,
                            extraKeys: {"Ctrl-/": "autocomplete"}
                        });
                        editor.setSize("100%",600);
                        if(lastValue)
                        {
                            editor.setValue(lastValue);
                        }
                    }
                });
            console.log("ageAPI",api.getAPI("manor.instance.list",true));
            $.parser.parse();

            //切片试验
            var load = $("#sliceUpload").sliceUpload({
                url:"test.php",
                isTrigger:false
            });
            load.change(function (data) {
                console.log(data);
            });
            $("#upload").click(function () {
                load.uploadClick(function (a,b) {
                    console.log(b);
                });
                //load.stopPost(function () {
                //    console.log("abc");
                //});
            });

            //$("#upload").click(function () {
            //    load.uploadClick();
            //});
           var loadUpload = $("#loadingUpload").uploadLoading({
              value:1,
               onChange:function(val)
               {
                   $("#loadingPercent").text(val);
               }
           });
            var inters=setInterval(function()
            {
                var val=loadUpload.data.value;
                if(val>=100)
                {
                    clearInterval(inters);
                    return;
                }
                var end=val+(100-val)/5;
                end=end>=100?100:end;
                end=Math.ceil(end);
                loadUpload.setValue(end);
            },300);
            $("#loadingUploadClick").click(function () {
                loadUpload.setValue(40);

            });
            //cidr_group
            var stack=null,cidr;
            var cidrWidget=$(".cidr_group").cidrWidget(
                {
                    onChange:function()
                    {
                        var that=this;
                        $(".pos1").text(this.pos1Value);
                        $(".pos2").text(this.pos2Value);
                        if(that.segments.length>1)
                        {
                            var min=that.segments[0];
                            var max=that.segments[that.segments.length-1];
                        }
                        var comboxData=ef.util.formatComboxData(this.segments);
                        $(".cidr_create_ip_box").empty();
                        stack=$(".cidr_create_ip_box").viewstack(comboxData,{killAutoSelected:true}).change(function(ind,item)
                        {
                            if(!item.ip)
                            {
                                cidr=that.getCidrBySegement(item.data.value);
                                item.ip=item.dom.ip(
                                    {
                                        cidr: cidr,
                                        isAll:true,
                                        exclude:0
                                    },{isEdit:true,isHideLengend:true,isOptimize:true}).change(function()
                                {
                                    // var gate=Math.floor(Math.random()*250);
                                    //
                                    // item.ip.setNetgate(gate,true);
                                    //console.log(this.getPreSelectSquares());
                                   ;
                                    var unselected_ips=ef.util.map(stack.children,function(il)
                                    {
                                        if(il.ip)
                                        {
                                            return il.ip.getUnSelectedSquares().length;
                                        }else
                                        {
                                            return 254;
                                        }
                                    });
                                    unselected_ips=ef.util.without(unselected_ips,undefined);
                                    console.log(ef.util.sum(unselected_ips));
                                    //console.log(ef.util.sum(unselected_ips));

                                });

                                $(".pos3").numberbox({readonly:that.segments.length==1});
                                if(that.segments.length>1)
                                {
                                    $(".pos3").numberbox({min:min,max:max});
                                    $(".pos3").next().tooltip(
                                        {
                                            content:ef.util.getLocale("cidr.input.range.tip",min,max)
                                        });


                                }else
                                {
                                    $(".pos3").next().tooltip(
                                        {
                                            content:ef.util.getLocale("cidr.input.range.one.tip",that.pos3Value)
                                        });
                                }
                                $(".pos4").numberbox(
                                    {
                                        min:item.ip.start,
                                        max:item.ip.end,
                                        readonly:false,
                                        value:that.pos4Value
                                    });
                                $(".pos4").next().tooltip(
                                    {
                                        content:ef.util.getLocale("cidr.input.range.tip",item.ip.start,item.ip.end)
                                    });
                                $(".pos4").numberbox({min:item.ip.start,max:item.ip.end});
                            }

                            var get3=$(".pos3").numberbox("getValue");
                            var getVal=$(".pos4").numberbox("getValue");
                            var currentSeg=item.data.value;
                            console.log(get3,currentSeg);
                            if(get3==currentSeg)
                            {
                                item.ip.setNetgate(getVal,true);
                            }

                        });
                        $("#pos3Sel").combobox(
                            {
                                width:55,
                                height:30,
                                valueField:'value',
                                textField:'label',
                                editable:false,
                                readonly:this.segments.length==1,
                                data:comboxData,
                                onChange:function(newValue)
                                {
                                    var finder=ef.util.find(comboxData,function(item)
                                    {
                                        return item.value==newValue;
                                    });
                                    var indexx=finder.index;
                                    stack.goto(indexx);
                                }
                            }
                        );
                        if(that.segments.length>1)
                        {
                            $("#pos3Sel").next().tooltip({content:ef.util.getLocale("cidr.input.range.tip",min,max)});
                        }else
                        {
                            $("#pos3Sel").next().tooltip({content:ef.util.getLocale("cidr.input.range.one.tip",this.pos3Value)});
                        }

                        $("#pos3Sel").combobox("setValue",this.pos3Value);
                        $("#gateValue").text(this.gateValue);

                        $(".pos3").numberbox({width:40,height:30,min:0,max:255,value:this.pos3Value,required:true,readonly:that.segments.length==1});
                        $(".pos4").numberbox({width:40,height:30,min:1,max:254,value:this.pos4Value,required:true,readonly:false,onChange:function(newVal)
                        {
                            // var fin=ef.util.find(stack.children,function(item)
                            // {
                            //
                            // })
                            var seger=$("#pos3Sel").combobox("getValue");
                            var fin=ef.util.find(comboxData,function(ib)
                            {
                                return ib.value==seger;
                            });
                            var index=fin.index;
                            var vstack=stack.children[index];
                            console.log();
                            vstack.ip.setNetgate(newVal,true);
                        }
                        });

                    }
                },
                {
                    pos1:
                    {
                        width:100
                    },
                    gate:
                    {
                        width:100
                    }
                });
            cidrWidget.setGateValue(28);

                $("#getIpsBtn").click(function()
                {
                    console.log(cidr);
                    var ips=ef.util.map(stack.children,function(item,index)
                    {
                        if(item.ip)
                        {
                            return ef.util.map(item.ip.getIps(),function(val)
                            {
                                return{
                                    ip:val,
                                    group:index
                                }
                            });
                        }
                        //return item.ip.getIps();
                    });
                    ips=_.without(ips,undefined);
                    ips=_.flatten(ips);
                    // ips=_.map(ips,function(item)
                    // {
                    //     return {ip:item}
                    // });
                    //显示为datalist
                    console.log(ips);
                    $(".ip_datalist").datalist(
                        {
                            textField:"ip",
                            valueField:"ip",
                            height:730,
                            data:ips
                        });
                });
            //viewstack new
            var stacker=$(".vs_box").viewstack([
                {
                    content:"a"
                },
                {
                    contentURL:"views/stackTest.html",
                    selected:true
                },
                {
                    content:"c"
                }
            ]);
            console.log(stacker.getStack(1));

            var iplegend=$(".ip_legend").ipLegend(
                {
                    unselect:18,
                    selected:10,
                    hostOccupy:2,
                    tenantOccupy:2,
                    dhcp:1,
                    gateway:2
                });
            iplegend.setData(
                {
                    gateway:3
                });

            $(".lift_box").lift();
            //ef.getJSON({
            //    url:'data/topoNew2.json',
            //    type:'get',
            //    useLocal:true,
            //    success: function (response) {
            //        console.log(response);
            //        var topoNew = $(".topo_new").topoNew({
            //            data:response
            //        });
            //        topoNew.subnetClick(function (id) {
            //            ef.getJSON({
            //                url:'data/topoNew.json',
            //                type:'get',
            //                useLocal:true,
            //                success: function (resp) {
            //                    var len;
            //                    if(resp.length>8){
            //                        len = resp.length*20+105;
            //                    }
            //                    else{len = 8*20+100;}
            //                    topoNew.vm(resp,len);
            //                }
            //            });
            //        });
            //    }
            //});
            var gridConfig = {
                singleSelect: false,
                pagination:true,
                pageSize:15,
                autoHeight:true,
                columns:[[
                    {field:'ck',checkbox:true,width:'10%'},
                    {field:'name',title:'用户名',formatter: function(val,row,index){
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
                    {field:'displayname',title:'姓名',width:'18%',formatter: function (val,row) {
                        return row.extra.displayname;
                    }},
                    {field:'email',title:'邮箱',width:'23%',formatter: function (val,row) {
                        return row.extra.email;
                    }},
                    {field:'phone',title:'电话',width:'20%',formatter: function (val,row) {
                        return row.extra.phone;
                    }},
                    {field:'role',title:'角色',width:'23%',formatter: function (val,row) {
                        return row.roles[0].name;
                    }}
                ]]
            };
            $('#tenantcontrollist').datagrid(gridConfig);



            $("#userlist").datagrid(gridConfig);
            $("#userlist").datagrid('loading');
            ef.getJSON({
                url:'data/datagrid_userlist.json',
                useLocal:true,
                type:'get',
                success: function (response) {
                    $('#tenantcontrollist').datagrid({
                        data:response
                    });
                    $(response).each(function (i,il) {
                        if(il.abc){il.checked = true;}
                    });
                    $("#userlist").datagrid({data:response,
                        onCheck:function(rowIndex,rowData)
                        {
                            rowData.checked = true;
                        }}).datagrid("clientPaging");
                }
            });


            //way.registerBindings(".way_cont");
            var $name=$("#wayName").textbox();
            $("#wayAge").combobox({
                textField:"text",
                valueField:"value",
                data: [
                    {
                        text:"abc"
                    }
                ]});
            $("#gender").numberspinner();
            //$name.siblings().find("input").attr("way-data","globalData.name");
            //way.registerBindings();
            $("#addNotiBtn").click(function()
            {
                ef.notification.show({
                    icon:"icon-bullhorn",
                    message:"新消息推来",
                    description:
                    {
                        name:"Anidssddsdsdsdafsaewdsdssdddsdsdsdsdsdsdsdsdsdgsrewrew2332323232ewewewweeweweew你啊好",
                        age:Math.random()*1000
                    },
                    render: function(desp)
                    {
                        var $dom=$('<span ></span>');
                        $dom.text(desp.name+"|"+desp.age);
                        return $dom;
                    }});
            });
            $("#resultListRender").resultList(
                {
                    id:"resultData",
                    title:"预览",
                    textField:"label",
                    valueField:"value",
                    groupField:"group",
                    data:[
                        {
                            label:"CPU",
                            value:"name",
                            group:"选择配置"
                        },
                        {
                            label:"容量",
                            value:"key1",
                            group:"选择配置"
                        },
                        {
                            label:"虚拟插槽数",
                            value:"key2",
                            group:"选择配置"
                        },
                        {
                            label:"def",
                            value:"key3",
                            group:"配置网卡"
                        },
                        {
                            label:"测试",
                            value:"bigs",
                            group:"测试集合",
                            columns:[
                                {filed:"name",title:"姓名"},
                                {filed:"title",title:"年龄"}
                            ]
                        },
                        {
                            label:'list测试',
                            value:'list',
                            group:'list测试组',
                            list:[{filed:'ip'}]
                        }

                    ]
                }
            );
            console.log(ef.util.getIpFirst("192.16.123.1"));
            console.log(ef.util.getIpTwo("192.16.123.1"));
            console.log(ef.util.getIpThree("192.16.123.1"));

            $("#scrollBarBox").scrollBar();

            var a = [1,2,3,5,7,8,9,0];
            var b = [];
            var c = [];
            $(a).each(function (i,il) {
                if(a[0]+1==a[1]){
                    b.push(a[0]);
                    b.push(a[1]);
                }else{c.push(a[0]);a = [];}
                a.splice(0,1);
            });
            console.log(a);
            console.log(ef.util.uniq(b));
            console.log(ef.util.difference(c,b));

            $(document.body)[0].onscroll=function () {
                $('input').each(function (i,il) {
                    if($(il).hasClass('combobox-f')&&$(il).siblings('span').find('input').is(":focus")){
                        $(this).combobox('hidePanel');
                        $(this).siblings('span').find('input').blur();
                    }
                })
            }


            var list = ["1.1.1.1","1.1.1.2","1.1.1.3","1.1.1.4","1.1.1.5","1.1.1.6","1.1.1.7","1.1.1.8","1.1.1.9","1.1.1.10","1.1.2.1","1.1.2.2","1.1.2.3","1.1.2.4","1.1.2.5","1.1.2.6","1.1.2.7","1.1.2.8","1.1.2.9","1.1.2.10","1.1.3.1","1.1.3.2","1.1.3.3","1.1.3.4","1.1.3.5","1.1.3.6","1.1.3.7","1.1.3.8","1.1.3.9","1.1.3.10"]
            function abc (ip) {
                //获取存有ip第三位的数组（去掉重复）
                var oneData = ef.util.map(ip, function (ol) {
                    return ef.util.getIpThree(ol);
                });
                oneData = ef.util.uniq(oneData);
                //获取第三位相同的ip的组
                var twoData = [];
                ef.util.map(oneData, function (thl) {
                    var t = ef.util.map(ip, function (tl) {
                        if(thl==ef.util.getIpThree(tl)){
                            return tl;
                        }
                    });
                    twoData.push(ef.util.without(t,undefined));
                });
                //第三位相同且第四位不连续的分组
                var threeData = [];
                $(twoData).each(function (i,il) {
                    var a = [],b= [],c= [];
                    $(il).each(function (e,el) {
                        if(Number(ef.util.getIpSufix(il[0]))+1==Number(ef.util.getIpSufix(il[1]))){
                            a.push(il[0]);
                            a.push(il[1]);
                            c.push(il[0]);
                            c.push(il[1]);
                        }else{
                            b.push(il[0]);
                            if(c.length!=0){
                                c = ef.util.uniq(c);
                                threeData.push(c);
                            }
                            c = [];
                        }
                        il.splice(0,1);
                    });
                    a = ef.util.uniq(a);
                    b = ef.util.difference(b,a);
                    $(b).each(function (i,il) {
                        threeData.push([il]);
                    });
                });
                //对第三位不同的数组的合并
                threeData = e(threeData);
                var ipData = ef.util.map(threeData, function (num) {
                    if(!num.type){
                        return num;
                    }
                });
                console.log(threeData);
                ipData = ef.util.without(ipData,undefined,[]);
                //返回最终的ip组
                var iplist=[];
                $(ipData).each(function(i,il){
                    iplist.push({start:il[0],end:il[il.length-1]})
                });
                return iplist;
            }
            abc(list);





        }
}
    );
});