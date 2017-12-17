define(['easyui','domReady',"contextmenu","module","clientPaging","api","network.vlan","network.vlanDetail"],function(easyui,domReady,contextmenu,module,clientPaging,api,networkVlan,networkDetail){
    var implement=new ef.Interface.implement();
    implement.cidrWidget = null;
    implement.legend = null;
    implement.resuleData = {};
    var stack = null,select,_ip;
    var ccc = [];
    var ipLengend = {
        unselect:0,
        selected:0,
        hostOccupy:0,
        tenantOccupy:0,
        dhcp:0,
        gateway:1
    };
    var segments;
    way.set("resultData",'');
    //初始化文本框，cidr，dns
    implement.combo = function () {
        $("#nameinput").textbox({
            required: true,
            maxlength:15,
            prompt:'请输入名称',
            validType:'whitelist["a-zA-Z0-9_\u4E00-\u9FA5","中文，字母，数字和下划线"]',
            onChange: function (newValue) {
                newValue=newValue?newValue:" ";
                way.set("resultData.name",newValue);
            }
        });
        $("#DNSinput").textbox({
            prompt:'e.g. 192.168.1.1',
            maxlength:50,
            validType:'reg[/^(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])$/]'
        });
        implement.legend = $(".ip_legend").ipLegend(ipLengend);
        implement.cidr();
        var a = $('<div><span class="add_dns" style="margin-left: 115px;line-height: 30px;"></span><i class="icon-menus-icon-vlan-dns-delete" style="cursor: pointer"></i></div>');
        a.find('i').click(function () {
            var dnsSimple = $(this).prev().text();
            var dns=ccc;
            $(ccc).each(function(i,il){
                if(il.dns.dom=="<div>"+dnsSimple+"</div>"){
                    dns.splice(i,1)
                }
            });
            ccc=dns;
            //ccc = ef.util.without(ccc,{"dns":dnsSimple});
            way.set("resultData.dns",dns);
            dns=[];
            $(this).parent().remove();
        });
        $('.icon-menus-icon-vlan-dns-add').click(function () {
            if($(".addDns").children().length>=5){ef.placard.warn(ef.util.getLocale("network.vlan.placard.dns.length"));return;}
            if(!$("#DNSinput").textbox('isValid')||!$("#DNSinput").textbox('getValue')){return;}
            var DNSvalue = $("#DNSinput").textbox('getValue');
            var tmp = a.clone(true);
            var boo=false;
            $("div.addDns span.add_dns").each(function(i,il){
                if($(il).text()==DNSvalue){
                    ef.placard.warn(ef.util.getLocale("network.vlan.placard.dns.repeat"));
                     boo=true;
                    return ;
                }
            });
            if(!boo){
                tmp.find('span').text(DNSvalue);
                $(".addDns").append(tmp);
                $(".DNSadd").val(DNSvalue);
                $("#DNSinput").textbox('clear');
                ccc.push({dns:{dom:"<div>"+DNSvalue+"</div>"}});
                way.set("resultData.dns",ccc);
            }
        });
    };
    //cidr关联操作
    var min,max,pos4min,pos4max;
    implement.cidr = function () {
        implement.posValue = {
            pos1Value:10,
            pos2Value:0,
            pos3Value:0,
            pos4Value:1
        };
        way.set("resultData.cidr","10.0.0.0/24");
        var intdNum = 0,netPiece,netValue,v;
        implement.cidrWidget = $(".cidr_group").cidrWidget({
            onChange: function () {
                //向图例中加数据
                implement.legend.setData(ipLengend);
                var that=this;
                segments = that.segments;
                $(".pos1").text(this.pos1Value);
                $(".pos2").text(this.pos2Value);
                $(".pos3").numberbox({height:30,width:50,value:this.pos3Value,required:true,readonly:that.segments.length==1});
                $(".pos3-text").text(this.pos3Value);
                way.set("resultData.cidr",this.pos1Value+"."+this.pos2Value+"."+this.pos3Value+"."+this.pos4Value+"/"+this.gateValue);
                way.set("resultData.ip",[{ip:{}}]);
                //way.set("resultData.ip","");
                if(that.segments.length>1)
                {
                    min=that.segments[0];
                    max=that.segments[that.segments.length-1];
                }
                var comboxData=ef.util.formatComboxData(this.segments);
                $(".ip_box_set").empty();
                select = 0;
                var selected_ips,all_ips,wait_selected_ips,ipRange = [],ips = [];
                //生成ip viewstack
                stack=$(".ip_box_set").viewstack(comboxData,{killAutoSelected:true}).change(function(ind,item)
                {
                    intdNum = ind;
                    var legendData = {};
                    var ip_sect;
                    var isAall=false,exclude=null;//保存根据segments长度判断是否显示255的属性值
                    v = comboxData[0].value?comboxData[0].value:0;
                    if(!item.ip)
                    {
                        //way.set("resultData.ip",[]);
                        $("#ipSelectAll").prop("checked",false);
                        implement.cidrValue=that.getCidrBySegement(item.data.value);
                        //根据cidr计算ip
                        function selectChange(){
                            //ip预选，选中时legend的改变
                            ips = [];
                            selected_ips=ef.util.map(stack.children,function(il) {
                                if (il.ip) {
                                    return il.ip.getSelectedSquare().length;
                                }
                            });
                            if((Number(ip_sect)-v)==stack.current){
                                if(!net){net=1};
                                netValue = net||0;
                                    if(selected_ips[stack.current]!=stack.children[ind].ip.squares.length-netValue){
                                        $("#ipSelectAll").prop("checked",false)
                                    }else{
                                        $("#ipSelectAll").prop("checked",true)
                                    }
                            }else {
                                    if(stack.children[stack.current].ip.getSelectedSquare().length!=stack.children[ind].ip.squares.length){
                                        $("#ipSelectAll").prop("checked",false);
                                    }else{
                                        $("#ipSelectAll").prop("checked",true);
                                    }
                            }
                            wait_selected_ips=ef.util.map(stack.children,function(il) {
                                if (il.ip) {
                                    return il.ip.getPreSelectSquares().length;
                                }
                            });
                                //if(wait_selected_ips[ind]==stack.children[ind].ip.getSelectedSquare().length){

                               // }
                                selected_ips=ef.util.without(selected_ips,undefined);
                            wait_selected_ips=ef.util.without(wait_selected_ips,undefined);
                            wait_selected_ips=ef.util.without(wait_selected_ips,0);
                            $(".ip-wait-selected").text(Number(wait_selected_ips));
                            var sel = 0;
                            for(var i=0;i<selected_ips.length;i++){
                                sel = sel+selected_ips[i];
                            }
                            select = sel;
                            legendData.selected = sel;
                            legendData.unselect = all_ips - Number(sel);
                            implement.legend.setData(legendData);
                            $(".ip-selected").text(select);
                            var ipR = [];
                            var ipRange = implement.ipRange();
                            $(ipRange).each(function (i,il) {
                                $(il.data).each(function (e,el) {
                                    if(el.length>1){
                                        //ipR.push({ip:il.ip+"."+el[0]+"~"+il.ip+"."+el[el.length-1]});
                                        //ipR.push(il.ip+"."+el[0]+"~"+il.ip+"."+el[el.length-1]+"\n");
                                        ipR.push({
                                                ip:{dom:'<div>' + '<span>' + il.ip+"."+el[0]+"~"+il.ip+"."+el[el.length-1] + '</span>' + '</div>'}
                                        })
                                    } else{
                                        //ipR.push({ip:il.ip+"."+el[0]});
                                        //ipR.push(il.ip+"."+el[0]+"\n");
                                        ipR.push({
                                            ip:{dom:'<div>' + '<span>' +il.ip+"."+el[0] + '</span>' + '</div>'}
                                        })
                                    }
                                });
                            });
                            way.set("resultData.ip",ipR);
                        };
                        $(".ip-selected").text(select);
                        $(".pos3").text({readonly:that.segments.length==1});
                        //根据segments的长度值改变文本框值
                        if(that.segments.length>1)
                        {
                            if(item.data.value==that.segments[0]){
                                exclude=0;
                            }else if(item.data.value==that.segments[that.segments.length-1]){
                                exclude=255;
                            }
                            isAall=true;
                            $(".pos3").parent().show();
                            $(".pos3-text").hide();
                            //$(".pos3").numberbox({min:min,max:max});
                            $(".pos3").next().tooltip(
                                {
                                    content:ef.util.getLocale("cidr.input.range.tip",min,max)
                                });

                        }else
                        {
                            isAall=false;
                            //exclude=255;
                            $(".pos3").parent().hide();
                            $(".pos3-text").show();
                            $(".pos3").next().tooltip(
                                {
                                    content:ef.util.getLocale("cidr.input.range.one.tip",that.pos3Value)
                                });
                        }
                        item.ip=item.dom.ip(
                            {
                                cidr: implement.cidrValue,
                                isAll:isAall,
                                exclude:exclude
                            },{
                                isEdit:true,
                                isHideLengend:true
                            }).change(
                            function(){selectChange()});
                        //$("#netPos4").numberbox(
                        //    {
                        //        min:item.ip.start,
                        //        max:item.ip.end,
                        //        readonly:false
                        //    });
                        pos4max = item.ip.end;
                        pos4min = item.ip.start;
                        $("#netPos4").next().tooltip(
                            {
                                content:ef.util.getLocale("cidr.input.range.tip",pos4min,pos4max)
                            });
                        //$("#netPos4").numberbox({min:item.ip.start,max:item.ip.end});
                    }
                    var selectedIps=ef.util.map(stack.children,function(il) {
                        if (il.ip) {
                            return il.ip.getSelectedSquare().length;
                        }
                    });
                    if(that.segments.length>1){
                        all_ips =256*that.segments.length-2-1;
                    }else{
                        all_ips = Number($(".ip_box_set").find(".viewstack-li.selected").find('span').length)*Number(that.segments.length)-1;
                    }
                    legendData.unselect = all_ips-select;
                    implement.legend.setData(legendData);
                    _ip = item.ip;

                    if($(".pos3-text").css('display')=='none'){
                        ip_sect = $(".pos3").numberbox('getValue');
                    }else{ip_sect = $(".pos3-text").text();}
                    var net = $("#netPos4").numberbox('getValue');
                    //item.ip.setNetgate(Number(netValue),false);
                    //if(Number(ip_sect)==ind){
                    //    netPiece = ind;
                    //    netValue = net;
                    //    item.ip.setNetgate(Number(net),true);
                    //}
                    if((Number(ip_sect)-v)==stack.current){
                        netPiece = ind;
                        netValue = net;
                        item.ip.setNetgate(Number(net),true);
                        if(selectedIps[ind]==item.ip.squares.length-netValue){
                            $("#ipSelectAll").prop("checked",true);
                        }else{
                            $("#ipSelectAll").prop("checked",false);
                        }
                    }else if(selectedIps[ind]==item.ip.squares.length){
                            $("#ipSelectAll").prop("checked",true);
                    }else{
                        $("#ipSelectAll").prop("checked",false);
                    }
                    //_box_set
                   /* var currentSelect=0;*/
                    /*$(".ip_square").change(function(){
                        if($(this).hasClass("ip_square_selected")){
                            stack.children[stack.current].ip.getSelectedSquare().length=stack.children[stack.current].ip.getSelectedSquare().length+1
                        }else{
                            stack.children[stack.current].ip.getSelectedSquare().length=stack.children[stack.current].ip.getSelectedSquare().length-1
                        }
                    });*/
                    /*$(".ip").change(function(){
                        var selectedIps=ef.util.map(stack.children,function(il) {
                            if (il.ip) {
                                return il.ip.getSelectedSquare().length;
                            }
                        });
                        if((Number(ip_sect)-v)==stack.current){
                            if(!net){net=1};
                            netValue = net||0;
                            if($("#ipSelectAll").prop("checked")){
                                if(selectedIps[stack.current]!=254-netValue){
                                    $("#ipSelectAll").prop("checked",false)
                                }else{
                                    $("#ipSelectAll").prop("checked",true)
                                }
                                //stack.children[stack.current].ip.getSelectedSquare().length
                            }else{
                                if(selectedIps[stack.current]==254-netValue){
                                    $("#ipSelectAll").prop("checked",true)
                                }else{
                                    $("#ipSelectAll").prop("checked",false)
                                }
                            }
                        }else {
                            if($("#ipSelectAll").prop("checked")){
                                if(stack.children[stack.current].ip.getSelectedSquare().length!=254){
                                    $("#ipSelectAll").prop("checked",true);
                                }else{
                                    $("#ipSelectAll").prop("checked",false);
                                }
                         }else{
                                if(stack.children[stack.current].ip.getSelectedSquare().length==254){
                                    $("#ipSelectAll").prop("checked",true);
                                }else{
                                    $("#ipSelectAll").prop("checked",false);
                                }
                         }
                        }
                    });*/
                    /*$("ip_square").click(function(){

                    });*/

                    $('#ipSelectAll').click(function () {
                        if($(this).is(':checked')) {
                            item.ip.selectAll();
                            implement.checkChange(ind,all_ips)
                        }else{
                            item.ip.unSelectAll();
                            implement.checkChange(ind,all_ips)
                        }
                    });
                });

                $("#pos3Sel").combobox(
                    {
                        width:60,
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
                            $("#ipSelectAll").unbind("click");
                            stack.goto(indexx);
                            /*if(){
                                $("#ipSelectAll").prop("checked",false);
                            }else{*/
                            //$("#ipSelectAll").prop("checked",true);

                        }
                    }
                );
                if(that.segments.length>1)
                {
                    $("#pos3").show();
                    $("#pos3Text").hide();
                    $("#pos3Sel").next().tooltip({content:ef.util.getLocale("cidr.input.range.tip",min,max)});
                }else
                {
                    $("#pos3").hide();
                    $("#pos3Text").show();
                    $("#pos3Text").text(this.pos3Value);
                    $("#pos3Sel").next().tooltip({content:ef.util.getLocale("cidr.input.range.one.tip",this.pos3Value)});
                }
                $("#pos3Sel").combobox("setValue",this.pos3Value);
                $("#netPos4").numberbox({width:50,height:30,min:1,required:true,readonly:false});
                $("#netPos4").numberbox('setValue',this.pos4Value);
                implement.posValue = {
                    pos1Value:this.pos1Value,
                    pos2Value:this.pos2Value,
                    pos3Value:$("#netPos3").numberbox('getValue'),
                    pos4Value:$("#netPos4").numberbox('getValue')
                };
                way.set("resultData.gateway",implement.posValue.pos1Value+"."+implement.posValue.pos2Value+"."+implement.posValue.pos3Value+"."+implement.posValue.pos4Value);

            }
        },{
            pos1:{width:50},pos2:{width:50},pos3:{width:50},pos4:{width:50},gate:{width:60}
        });
        $("#netPos4").numberbox({
            onChange: function (newValue,oldValue) {
                var ip_sect,netPos3;
                if($(".pos3-text").css('display')=='none'){
                    netPos3 = ip_sect = $("#netPos3").numberbox('getValue');
                }else{netPos3 = ip_sect = $(".pos3-text").text();}
                if(Number(ip_sect)-v==stack.current){
                    _ip.setNetgate(Number(newValue),true);
                    netValue = Number(newValue);
                    netPiece = ip_sect;
                }
                way.set("resultData.gateway",implement.posValue.pos1Value+"."+implement.posValue.pos2Value+"."+netPos3+"."+newValue);
            }
        });
        $("#netPos3").numberbox({
            onChange: function (newValue,oldValue) {
                var ip_sect = $("#netPos4").numberbox('getValue');
                //if(Number(netPiece)==Number(newValue)==intdNum){
                    _ip.setNetgate(Number(netValue),false);
                //}
                if(Number(newValue)-v==stack.current){
                    _ip.setNetgate(Number(ip_sect),true);
                    netValue = ip_sect;
                    netPiece = Number(newValue);
                }
                way.set("resultData.gateway",implement.posValue.pos1Value+"."+implement.posValue.pos2Value+"."+newValue+"."+$("#netPos4").numberbox('getValue'));
            }
        });
    };
    implement.checkChange=function(ind,all_ips){

        var selected_ips=ef.util.map(stack.children,function(il) {
            if (il.ip) {
                return il.ip.getSelectedSquare().length;
            }
        });
        var legendData={};
        var currentSelIp=selected_ips[ind];
        selected_ips=ef.util.without(selected_ips,undefined);
        var sel = 0;
        for(var i=0;i<selected_ips.length;i++){
            sel = sel+selected_ips[i];
        }
        select = sel;
        legendData.selected = sel;
        legendData.unselect = all_ips - Number(sel);
        implement.legend.setData(legendData);
        $(".ip-selected").text(select);
        var ipR = [];
        var ipRange = implement.ipRange();
        $(ipRange).each(function (i,il) {
            $(il.data).each(function (e,el) {
                /*if(el.length>1){
                    ipR.push({ip:il.ip+"."+el[0]+"~"+il.ip+"."+el[el.length-1]});
                } else{ipR.push({ip:il.ip+"."+el[0]});}*/
                if(el.length>1){
                    //ipR.push({ip:il.ip+"."+el[0]+"~"+il.ip+"."+el[el.length-1]});
                    //ipR.push(il.ip+"."+el[0]+"~"+il.ip+"."+el[el.length-1]+"\n");
                    ipR.push({
                        ip:{dom:'<div>' + '<span>' + il.ip+"."+el[0]+"~"+il.ip+"."+el[el.length-1] + '</span>' + '</div>'}
                    })
                } else{
                    //ipR.push({ip:il.ip+"."+el[0]});
                    //ipR.push(il.ip+"."+el[0]+"\n");
                    ipR.push({
                        ip:{dom:'<div>' + '<span>' +il.ip+"."+el[0] + '</span>' + '</div>'}
                    })
                }
            });
        });
        way.set("resultData.ip",ipR);
    };
    var _iconchange;
    //获取选中的IP
    implement.getAllSelectedIp = function () {
        var ips = ef.util.map(stack.children,function(item,index)
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
        });
        ips=_.without(ips,undefined);
        ips=_.flatten(ips);
        return ips;
    };
    //获取选中ip的范围
    implement.ipRange = function () {
        var response = [];
        var res = implement.getAllSelectedIp();
        var item = {cidr:implement.cidrValue,ips:[]};
        $(res).each(function (i,il) {
            item.ips.push(il);
        });
        var dataValue = networkVlan.resultSplice(item).value;
        var tmp;
        for(var a in dataValue){
            var data = [],rest = [],three;
            $(dataValue[a].ips).each(function (i,il) {
                three = ef.util.getIpPrefix(il.ip);
                data.push(Number(il.ip.substring(il.ip.lastIndexOf(".")+1, il.ip.length)));
            });
            if(data[0]==0){
                rest.push([data.shift()]);
            }
            while(tmp = data.shift()){
                if(rest.length == 0){
                    rest.push([tmp]);
                    continue;
                }
                var e = rest[rest.length - 1];
                if(tmp == e[e.length - 1] + 1){
                    e.push(tmp);
                }else{
                    rest.push([tmp]);
                }
            }
            response.push({ip:three,data:rest});
        }
        return response;
    };
    implement.redraw=function()
    {
        $(document).ready(function()
        {
            implement.combo();
            implement.cidrWidget.setGateValue(24);
            var hostgrid = null,newnet;
            var idRow = [];
            var b = [];
            var _stack=$(".viewstack-box2").viewstack();
            var iconStep=$(".host-step-cont").iconstep([
                {
                    text:ef.util.getLocale('host.addhost.dialog.iconstep.info.text'),
                    iconClass:"svm-step-base-icon",
                    iconSelectedClass:"svm-step-base-icon-select",
                    selected:true
                },
                {
                    text:ef.util.getLocale('network.valn.addSubnet.ip'),
                    iconClass:"subnet-add-ip",
                    iconSelectedClass:"subnet-add-ip-select",
                    selected:false
                }
            ]).click(function (step) {
                _route.goto(step);
                _stack.goto(step);
            });
            $(".basic-result-box").resultList( {
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
                        label:"CIDR",
                        value:"cidr",
                        group:"基本信息"
                    },
                    {
                        label:"网关",
                        value:"gateway",
                        group:"基本信息"
                    },
                    {
                        label:"DNS",
                        value:"dns",
                        group:"基本信息",
                        list:[{filed:'dns'}]
                    },

                    {
                        label:"IP",
                        value:"ip",
                        group:"IP范围",
                        list:[{filed:'ip'}]
                    }
                ]
            });
            var reg = /^((\d{1,3}\.){3}(\d{1,3}))\/(\d{1,3})$/;
            var _route=$(".button-route").buttonstep({length:2}).change(function(pos)
            {
                iconStep.goto(pos);
                _stack.goto(pos);
                var len = $(".addDns").children().length;
                if(!$("#nameinput").textbox('isValid')){
                    _route.goto(0);
                    _stack.goto(0);
                    iconStep.goto(0);
                }
                else if(len>5){
                    _route.goto(0);
                    _stack.goto(0);
                    iconStep.goto(0);
                    ef.placard.warn(ef.util.getLocale("network.vlan.placard.dns.length"));
                }
                else if($('.ef-cidr-pos').find('.numberbox-f')){
                    var a = 0;
                    $('.ef-cidr-pos').find('.numberbox-f').each(function (i,il) {
                        if(!$(il).numberbox('isValid')){
                            a = 1;
                            _route.goto(0);
                            _stack.goto(0);
                            iconStep.goto(0);
                        }
                    });
                    if(a == 1){return;}
                if(segments.length>1){
                        var netPos4 = $("#netPos4").textbox('getValue');
                        if(!$("#netPos3").textbox('isValid')||!$("#netPos4").textbox('isValid')){
                            _route.goto(0);
                            _stack.goto(0);
                            iconStep.goto(0);
                            return;
                        }
                        var netPos3 = $("#netPos3").textbox('getValue');
                        if(netPos3<min||netPos3>max){
                            _route.goto(0);
                            _stack.goto(0);
                            iconStep.goto(0);
                            ef.placard.warn("网关输入不正确!");
                            return;
                        }
                        if(netPos4<pos4min||netPos4>pos4max){
                            _route.goto(0);
                            _stack.goto(0);
                            iconStep.goto(0);
                            ef.placard.warn("网关输入不正确!");
                            return;
                        }
                    }
                    else if(segments.length<=1){
                        if(!$("#netPos4").textbox('isValid')){
                            _route.goto(0);
                            _stack.goto(0);
                            iconStep.goto(0);
                            return;
                        }
                        netPos4 = $("#netPos4").textbox('getValue');
                        if(netPos4<pos4min||netPos4>pos4max){
                            _route.goto(0);
                            _stack.goto(0);
                            iconStep.goto(0);
                            ef.placard.warn("网关输入不正确!");
                            return;
                        }
                    }
                }
            }).confirm(function()
            {

                if(select<1){
                    _route.goto(1);
                    _stack.goto(1);
                    iconStep.goto(1);
                    ef.placard.warn(ef.util.getLocale("network.vlan.placard.ip.len"));
                    return;
                }
                //$("#DNStd").empty();
                //$(".addDns span").each(function (i,il) {
                //    $("#DNStd").append('<div style="line-height: 30px;width: 100%;">'+$(this).text()+'</div>');
                //});
                //$("#IPtd").empty();
                //var netId;
                //if(segments.length>1){
                //    netId = $("#netPos1").text()+'.'+$("#netPos2").text()+'.'+$("#netPos3").numberbox('getValue')+'.'+$("#netPos4").numberbox('getValue');
                //}
                //else{
                //    netId = $("#netPos1").text()+'.'+$("#netPos2").text()+'.'+$(".pos3-text").text()+'.'+$("#netPos4").numberbox('getValue');
                //}
                //var c = implement.cidrWidget.pos1Value+"."+implement.cidrWidget.pos2Value+"."+implement.cidrWidget.pos3Value+"."+implement.cidrWidget.pos4Value+"/"+implement.cidrWidget.gateValue;
                //$("#Cidrtd").text(c);
                //$("#nametd").empty().append($("#nameinput").textbox('getValue'));
                //$("#nettd").empty().append(netId);
                //var ipRange = implement.ipRange();
                //$(ipRange).each(function (i,il) {
                //    $(il.data).each(function (e,el) {
                //        if(el.length>1){
                //            $("#IPtd").append('<div style="line-height: 30px;width: 100%;">'+il.ip+"."+el[0]+"~"+il.ip+"."+el[el.length-1]+'</div>');
                //        } else{$("#IPtd").append('<div style="line-height: 30px;width: 100%;">'+il.ip+"."+el[0]+'</div>');}
                //    });
                //});
                $(".addDns span").each(function (i,il) {
                    b.push($(this).text());
                });
                var name = way.data.resultData.name;
                var net = way.data.resultData.gateway;
                var ip = [];
                var ips =  implement.getAllSelectedIp();
                $(ips).each(function (i,il) {
                    ip.push(il.ip);
                });
                var dns = [];
                for(var j=0;j<b.length;j++)
                {
                    dns.push(b[j]);
                }
                dns=_.uniq(dns);
                ef.loading.show();
                var ipData = ef.util.getIpGroupsData(ip);
                ef.getJSON(
                    {
                        url:api.getAPI("order.wait.Detail.combo.vlan")+"/subnet",
                        type:"put",//get,post,put,delete
                        data:{
                            "name":name,
                            "network_id":ef.localStorage.get("vlanDetailId"),
                            "cidr":way.data.resultData.cidr,
                            "gateway":net,
                            "dns":dns,
                            "ips":ipData
                        },
                        success:function(response)
                        {
                            networkDetail.getVlanSubnet(ef.localStorage.get("vlanDetailId"),false);
                            ef.loading.hide();
                            ef.Dialog.closeAll();
                            ef.placard.tick(ef.util.getLocale("network.vlan.placard.addsuc"));
                        },error:function(error) {
                        ef.loading.hide();
                    }
                    });
            });
            way.registerTransform('listTrans',function(data){
                if(data){
                    return data.dom;
                }
            });
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});


