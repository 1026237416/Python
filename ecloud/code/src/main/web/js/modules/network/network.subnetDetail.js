define(['user','domReady','easyui','clientPaging',"module","api","network.vlan"],function(user,domReady,easyui,clientPaging,module,api,networkVlan) {
    var implement = new ef.Interface.implement();
    var _data,_ip,ipresp,net,ipID=[],ips=[];
    implement.ipLegend = undefined;
    implement.stack = undefined;
    implement.ipOccpyData = null;
    var cidrX,ipsSave,res;
    //ip过滤
    implement.filter = function () {
        var ip = $("#ipSearchFour").textbox('getValue');
        var occupy = $("#occCom").combobox('getValue');
        var sect = $("#ipSearchThree").combobox('getValue');
        $('#vlandetailip_grid').datagrid({
            loadFilter: function(data){
                var tmp = {total:0,rows:[]};
                $(data).each(function (i,il) {
                    var a = ef.util.getIpPrefix(il.ip);
                    var sectGet = a.substring(a.lastIndexOf(".")+1, a.length);
                    if(!ip){ip = ef.util.getIpSufix(il.ip);}
                    if(!occupy){occupy = il.type;}
                    if(!sect){sect = sectGet;}
                    if(ef.util.getIpSufix(il.ip).indexOf(ip)!=-1&&occupy == il.type&&sect==sectGet){
                        tmp.total = tmp.total+1;
                        tmp.rows.push(il);
                    }
                    ip = $("#ipSearchFour").textbox('getValue');
                    occupy = $("#occCom").combobox('getValue');
                    sect = $("#ipSearchThree").combobox('getValue');
                });
                return tmp;
            }
        }).datagrid('clientPaging');
    };
    //文本框初始化
    implement.text = function (value) {
        $("#vlanDetailname").textbox({
            maxlength:15,
            required:true,
            value:value,
            validType: 'whitelist["0-9a-zA-Z_\u4E00-\u9FA5","中文,字母,数字和下划线"]'
        });
        $("#vlanDetailDNS").textbox({
            maxlength:50,
            validType:'whitelist["0-9.,","e.g.192.168.1.1,192.168.2.4"]'
        });
        //$("#ipCom").textbox({
        //    prompt:'请输入IP',
        //    iconCls:'icon-search',
        //    iconAlign:'right' ,
        //    onChange: function (newValue,oldValue) {
        //        implement.filter();
        //    }
        //});
        $("#occCom").combobox({
            prompt:'请选择占用情况',
            url: 'data/netvlanipocc.json',
            method: 'get',
            valueField:'value',
            textField:'label',
            onChange: function (newValue,oldValue) {
                implement.filter();
            }
        });
        //$("#ipSect").combobox({
        //    prompt:'请选择IP段',
        //    valueField:'text',
        //    textField:'text',
        //    onChange: function (newValue,oldValue) {
        //        implement.filter();
        //    }
        //});
        $("#ipSearchThree").combobox({
            valueField:'text',
            textField:'text',
            onChange: function (newValue,oldValue) {
                implement.filter();
            }
        });
        $("#ipSearchFour").textbox({
            onChange: function (newValue,oldValue) {
                implement.filter();
            }
        });
        $("#reset").click(function () {
            $("#ipSearchFour").textbox('clear');
            $("#occCom").combobox('clear');
            $("#ipSearchThree").combobox('clear');
            implement.refreshIp(_data.id,_data,implement.isForce,implement.doCallback);
        });
        $("#vlandetailip_grid").datagrid({
            onSelect:function(rowIndex,rowData){
                if(implement._iconMenu){
                    implement._iconMenu.setStatus("4",true);
                }
                if(!!rowData.port && !rowData.dhcp && rowData.vm == 'emptyvm'){
                    if(implement._iconMenu){
                        implement._iconMenu.setStatus("4",false);
                    }
                }
            },
            columns:[[
                {field: "ip", width: "55%", title: "地址"},
                {field: "occupy", width: "53%", title: "占用情况",formatter: function (val) {
                    if(val==null){return "";}
                    if(val=="emptyvm"){return "-"}
                    return val;
                }}
            ]]
        }).datagrid('clientPaging');
    };

    implement.getFormatSendIps=function(currentIps)
    {
        var arrs=[];
        var tmpIps=currentIps;
        for(var j=0;j<tmpIps.length;j++)
        {
            arrs.push(tmpIps[j]);
        }
        return arrs;
    };
    //设置VLAN的IP
    implement.setVlanIp=function(vlanId,vlanIps,isForce,callback)
    {
        if(ef.config.isServer||isForce){
            ef.getJSON(
                {
                    url:api.getAPI("subnet")+"/"+vlanId+"/ips",
                    type:"post",//get,post,put,delete
                    isForce:isForce,
                    data:{
                        "ips":vlanIps
                    },
                    success:function(response)
                    {
                        if(callback)
                        {
                            callback(response);
                        }
                    },
                    error:function(error)
                    {
                        console.log(error);
                    }
                });
        }
    };
    implement.isForce=true;
    //ip搜索列表
    implement.ip_host=function(result){
        var resp = [],showResp=[];
        $(result.ips).each(function (i,il) {
            var item = {ip:il.ip,occupy:"",type:"2",port:''};
            if(il.dhcp==true){item.occupy = "DHCP";item.type = '1'}
            if(il.tenant.name){item.occupy = null;}
            if(il.gateway){item.occupy = '3';}
            if(il.vm!=""&&il.vm){item.occupy = il.vm;item.type = '1'}
            if(item.occupy!="3"){
                showResp.push(item);
            }
            item.vm = il.vm;
            item.port = il.port;
            item.dhcp  = il.dhcp;
            resp.push(item);
        });
        try
        {
            $('#vlandetailip_grid').datagrid({data:showResp}).datagrid("clientPaging");
        }catch(err)
        {
            $('#vlandetailip_grid').datagrid("loadData",resp).datagrid("goto",1);
        }
        //$('#vlandetailip_grid').datagrid({data:resp}).datagrid("clientPaging");
        implement.ipOccpyData = ef.util.copyDeepProperty(resp);

    };
    //图例数据
    var legendData = {
        unselect: 0,
        selected: 0,
        hostOccupy: 0,
        tenantOccupy: 0,
        dhcp: 1,
        gateway: 1
    },legendDataCopy;
    //ip图例初始化
    implement.legend = function () {
        implement.ipLegend = $(".ip_legend").ipLegend(legendData);
    };
    //获取所有选中的ip，主机占用的ip和项目占用的ip
    implement.getAllSelectIp = function () {
        var ipsSelect=ef.util.map(implement.stack.children,function(item,index)
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
        var ipsVm=ef.util.map(implement.stack.children,function(item,index)
        {
            if(item.ip)
            {
                return ef.util.map(item.ip.getHostOccupySquare(),function(val)
                {
                    return{
                        ip:val,
                        group:index
                    }
                });
            }
        });
        var ipsTenant=ef.util.map(implement.stack.children,function(item,index)
        {
            if(item.ip)
            {
                return ef.util.map(item.ip.getTenantOccupySquare(),function(val)
                {
                    return{
                        ip:val,
                        group:index
                    }
                });
            }
        });
        ipsSelect=_.without(ipsSelect,undefined);
        ipsSelect=_.flatten(ipsSelect);
        ipsVm=_.without(ipsVm,undefined);
        ipsVm=_.flatten(ipsVm);
        ipsTenant=_.without(ipsTenant,undefined);
        ipsTenant=_.flatten(ipsTenant);
        return {selected:ipsSelect,vm:ipsVm,tenant:ipsTenant};
    };
    //ip初始化
    implement.ipInit = function (result,isTrue,callback) {
        res = networkVlan.resultSplice(result);
        cidrX = new ef.CidrX(result.cidr);
        $(".pos1").text(cidrX.pos1);
        $(".pos2").text(cidrX.pos2);
        var comboxData;
        if(isTrue){
            comboxData = ef.util.formatComboxData(cidrX.segments);
        }else{
            $(res.key).each(function(i,il){
                if(il[0]=="0"&&il.length!="3"&&il[1]!="0"){
                    var a=il[il.length-1];
                    res.key[i]=a;
                }else if(il[0]=="0"&&il[1]=="0"){
                    res.key[i]=String(il[il.length-1])
                }
            });
            comboxData = ef.util.formatComboxData(res.key);
        }
        $(".ip_box").empty();
        var selected_ips,all_ips,wait_selected_ips,select = 0;
        implement.stack = $(".ip_box").viewstack(comboxData, {killAutoSelected: true}).change(function (ind, item) {
            _ip = null;
            if (!item.ip) {
                var data;
                if(res.value[Number(item.data.value)]){
                    data = res.value[Number(item.data.value)];
                }else{
                    data = {cidr:result.cidr};
                }
                if(cidrX.segments.length>1){
                    data.isAll=true;
                    if(item.data.value==cidrX.segments[0]){
                        data.exclude=0;
                    }else if(item.data.value==cidrX.segments[cidrX.segments.length-1]){
                        data.exclude=255;
                    }
                }else{
                    data.isAll=false;
                    data.exclude=null;
                }
                item.ip = item.dom.ip(
                    data,
                    {
                        isEdit: true,
                        isHideLengend: true
                    });
            }
            var tenantIP=item.ip.getTenantOccupySquare().length;
             var dhcpIP=item.ip.getDhcpSuqare().length;
             var hostIP=item.ip.getHostOccupySquare().length;
             var netGateIP=item.ip.getGatewaySquare().length;
             if(implement.stack.children[ind].ip.getSelectedSquare().length==implement.stack.children[ind].ip.squares.length-tenantIP-dhcpIP-hostIP-netGateIP){
                 $("#ipSelectAll").prop("checked",true);
             }else{
                $("#ipSelectAll").prop("checked",false);
             }
            _ip = item.ip;
            if(isTrue){
                _ip.setMode(true);
                $(".ip-selected-text").show();
                $(".ipSelectAll-content").show();
                $(".ipSelectAll-text").show();
            }
            else{_ip.setMode(false);$(".ip-selected-text").hide();$(".ipSelectAll-content").hide();
                $(".ipSelectAll-text").hide();}
            if(callback){
                callback(_ip,ind);
            }
            /*$('#ipSelectAll').click(function () {
                if($(this).is(':checked')) {
                    item.ip.selectAll();
                }else{item.ip.unSelectAll();}
            });*/
            $('#ipSelectAll').click(function () {
                if($(this).is(':checked')) {
                    item.ip.selectAll();
                    implement.checkChange(ind,implement.all_ips);
                }else{
                    item.ip.unSelectAll();
                    implement.checkChange(ind,implement.all_ips);
                }
            });
        });
        $("#pos3Text").combobox(
            {
                width: 60,
                height: 30,
                valueField: 'value',
                textField: 'label',
                editable: false,
                readonly: cidrX.segments.length == 1,
                data: comboxData,
                onChange: function (newValue) {
                    var finder = ef.util.find(comboxData, function (item) {
                        return item.value == newValue;
                    });
                    var indexx = finder.index;
                    $('#ipSelectAll').unbind("click");
                    //$("#ipselectAll").prop("checked",false);
                    implement.stack.goto(indexx);
                }
            }
        );
        $("#pos3Text").combobox("setValue", String(comboxData[0].value));
        var ipSectData = [];
        $(ef.util.formatComboxData(res.key)).each(function (i,il) {
            var item = {text:il.value};
            ipSectData.push(item);
        });
        $("#ipSearchThree").combobox({data:ipSectData});
    };
    implement.checkChange=function(ind,all_ips){
        /*var selected_ips=ef.util.map(implement.stack.children,function(i,il) {
            if (il.ip) {
                return il.ip.getSelectedSquare().length;
            }
        });
        var unselected_ips=ef.util.map(implement.stack.children,function(il){
            if(il.ip){
                return il.ip.getUnSelectedSquares().length
            }
        });
        var legendData={};
        //var currentSelIp=selected_ips[ind];
        selected_ips=ef.util.without(selected_ips,undefined);
        unselected_ips=ef.util.without(unselected_ips,undefined);
        var sel = 0;
        for(var i=0;i<selected_ips.length;i++){
            sel+=sel+selected_ips[i];
        }
        var unselected=0;
        for(var e=0;e<unselected_ips.length;e++){
            unselected+=unselected_ips[e]
        }
        legendData.selected = sel;
        legendData.unselect =unselected;
        implement.ipLegend.setData(legendData);
        $(".ip-selected").text(sel+legendDataCopy.dhcp+legendDataCopy.hostOccupy);
        if(legendData.selected!=legendDataCopy.selected){
            implement._ipBtns.setStatus("0",false);
        }*/
        var keyVal = $("#pos3Text").combobox('getValue');
        var se = [];
        if(res.value[keyVal]){
            for(var j = 0;j< res.value[keyVal].ips.length;j++){
                if(!ef.util.isEmpty(res.value[keyVal].ips[j].tenant)||res.value[keyVal].ips[j].vm!=""||res.value[keyVal].ips[j].dhcp==true||res.value[keyVal].ips[j].gateway){
                    se.push(res.value[keyVal].ips[j]);
                }
            }
            res.value[keyVal].ips = se;
        }else{
            res.key.push(keyVal);
            res.value[keyVal] = {cidr:implement.cidr,ips:[]};
        }
        var a = implement.stack.children[ind].ip.getIpRangeJustSelected();
        $(a).each(function (e,el) {
            var ip_three = cidrX.pos1+"."+cidrX.pos2+"."+keyVal+"."+el;
            var item = {
                dhcp:false,
                ip:ip_three,
                name:$("#vlanDetailname").textbox('getValue'),
                tenant:{},
                used:0,
                vm:""
            };
            res.value[keyVal].ips.push(item);
        });
        res.value[keyVal].ips = ef.util.uniq(res.value[keyVal].ips);
        var result=[];
        for(var i in res.value){
            result=result.concat(res.value[i].ips);
        }
        implement.ipLegendValue(result);
    };
    implement.ipLegendValue = function (result,isdefaultSelect) {
        if(cidrX.segments.length>1){
            implement.all_ips =256*cidrX.segments.length-2;
        }else{
            //implement.all_ips = Number($(".ip_box_set").find(".viewstack-li.selected").find('span').length)*Number(cidrX.segments.length);
            implement.all_ips = result.ips?result.ips.length:result.length;
        }
        //implement.all_ips = Number($(".viewstack-li.selected").find('span').length)*Number(cidrX.segments.length);
        var tenant = [],vm = [],dhcp=[],freeip=[],tenant_host=0;
        result.ips=result.ips?result.ips:result;
        $(result.ips).each(function (i,il) {
            if(il.vm!=""&&il.vm){
                vm.push(il);
            }
            if(!ef.util.isEmpty(il.tenant)){tenant.push(il);}
            if(il.dhcp){
                dhcp.push(il);
            };
            if(ef.util.isEmpty(il.tenant)&&!il.vm&&!il.dhcp&&il.used==0){
                freeip.push(il);
            }
        });
        $(tenant).each(function(t,tl){
            $(vm).each(function(v,vl){
                if(tl.ip==vl.ip&&tl.tenant.id==vl.tenant.id){
                    tenant_host+=1
                }
            });
        });
        legendData.selected = result.ips.length-2-tenant.length;
        legendData.selected=freeip.length;
        legendData.hostOccupy = vm.length;
        legendData.tenantOccupy = tenant.length;
        legendData.dhcp=dhcp.length;
        legendData.gateway=1;
        legendData.unselect = implement.all_ips-legendData.selected-legendData.tenantOccupy-legendData.hostOccupy-dhcp.length-1+tenant_host;
        implement.ipLegend.setData(legendData);
       // $(".ip-selected").text(legendData.selected+legendData.hostOccupy+legendData.dhcp+legendData.tenantOccupy);
        $(".ip-selected").text(implement.all_ips-legendData.unselect-1);
        if(isdefaultSelect){
            legendDataCopy = ef.util.copyDeepProperty(legendData);
        }
        if(legendData.selected!=legendDataCopy.selected){
            implement._ipBtns.setStatus("0",false);
        }
    };
    //拷贝数据，初始化
    implement.doCallback = function (result) {
        ipresp = ef.util.copyDeepProperty(result);
        implement.ipInit(result);
        implement.ip_host(result);
        implement.ipLegendValue(result,true);
    };
    //刷新ip数据
    implement.refreshIp=function(vlanId,data,isForce,callback)
    {
        if(ef.config.isServer||isForce){
            ef.getJSON(
                {
                    url:api.getAPI("subnet")+"/"+vlanId+"/ips",
                    type:"get",//get,post,put,delete
                    isForce:isForce,
                    success:function(response)
                    {
                        response=ef.util.getTotalIP(response);
                        var result={};
                        result.cidr=data.cidr;
                        response.push({gateway:true,ip:data.gateway,vm:"",tenant:{}});
                        result.ips=ef.util.copyDeepProperty(response);
                        callback(result);
                    },
                    error:function(error)
                    {
                        console.log(error);
                    }
                });
        }
    };
    //重绘
    implement.redraw = function () {
        $(".ip_box").preload(400);
        $("#vlandetailip_grid").preload(200);
        domReady(function(){
            $(".subnetDetail-tabs").tabs({border:false});
            implement.legend();
            $(".data_dns").addClass("selfflow");
            ef.util.ready(function(dom)
            {
                $("#description").append(ef.util.getLocale('network.vlanDetail.blocklistlabel.description'));
                $("#iplist").append(ef.util.getLocale('network.vlanDetail.blocklistlabel.iplist'));
                $("#iprange").append(ef.util.getLocale('network.vlanDetail.blocklistlabel.iprange'));
                $("#hostlist").append(ef.util.getLocale('network.vlanDetail.blocklistlabel.hostlist'));

                $(".data_dns .validatebox-text").css("color","#aaa");
                $(".ipSelectAll-content").hide();
                $(".ipSelectAll-text").hide();
                _data=dom.data("pageData");
                _data=ef.util.unescapeJSON(_data);
                _data=_data?JSON.parse(_data):null;
                ef.getJSON({
                    url:api.getAPI("subnet")+"/"+_data.id,
                    type:'get',
                    success: function (response) {
                        _data = response;
                        var _descriptData=ef.util.copyProperty({},_data);
                        $(".vlandetail-icon-box").iconmenu([{
                            iconClass: "icon-menus-icon-back",
                            tip: ef.util.getLocale('framework.component.iconmenu.back.tip'),
                            "access":[8,9,10,88],
                            click: function () {
                                ef.nav.goto("netvalndetail.html","network.vlanDetail",ef.localStorage.get("vlanDetail.data"),null,'net.vlan');
                            }
                        }]);
                        implement.cidr = _descriptData["cidr"];
                        var firstName;
                        if(_data)
                        {
                            for(var i in _data)
                            {
                                if(_data["enable"]==true){
                                    _data["enable"] = ef.util.getLocale('cal.hostalave.status.able');
                                    $("#vlanState").css({color:"green"});
                                }
                                if(_data["enable"]==false){
                                    _data["enable"] = ef.util.getLocale('cal.hostalave.status.disable');
                                    $("#vlanState").css({color:"red"});
                                }
                                var _val=_data[i];
                                $(".vlan-detail-descript").find(".data_"+i+" input").empty();
                                if(i=="dns"&&_data["dns"].length==0){
                                    $(".vlan-detail-descript").find(".data_"+i+" input").val("-");
                                }else{
                                    $(".vlan-detail-descript").find(".data_"+i+" input").val(_val);
                                }
                                firstName = _data["name"];
                            }
                        }
                        implement.text(firstName);
                        if(!$("#vlanDetailDNS").textbox('options').disabled){
                            var DNSText = $("#vlanDetailDNS").textbox('getValue');
                            if(DNSText&&DNSText!="-"){
                                $('.data_dns span').tooltip({
                                    content: '<span style="color:#fff">'+DNSText+'</span>',
                                    onShow: function () {
                                        $(".tooltip-bottom").css("left", 300);
                                    }
                                });
                            }
                        }
                        ef.localStorage.put("vlanDetailId",_data.id);
                        ef.localStorage.put("vlanDetailName",_data.name);
                        var netValue = _data.gateway;
                        net = netValue.substr(netValue.lastIndexOf(".")+1,netValue.length);
                        implement.refreshIp(_data.id,_data,implement.isForce,implement.doCallback);
                        ef.getJSON(
                            {
                                url: api.getAPI("network.vlan.datagrid_vlan"),
                                type: "get",//get,post,put,delete

                                success: function (response) {
                                },
                                error: function (error) {
                                    console.log(error);
                                }
                            });
                        $(".vlan-detail-descript .textbox").addClass("noborder");
                        $(".data_name input").attr("disabled","disabled");
                        $(".data_dns input").attr("disabled","disabled");
                        //获取保存后的数据
                        function saveDescriptData()
                        {
                            for(var i in _descriptData)
                            {
                                _descriptData[i]=$(".vlan-detail-descript").find(".data_"+i+" .textbox-text").val();
                            }
                        }
                        //描述
                        if(user.isSys()||user.isSuper()){
                            var name,namesave,DNSsave,netsave;
                            var vlanname = ef.localStorage.get("vlanDetail.subnet.table.name");
                            vlanname.splice(vlanname.indexOf(_data.name),1);//判断是否有重复的名称
                            var _descriptBtns=$(".descriptBtns").togglebutton([
                                [
                                    {
                                        iconClass: "icon-menus-icon-edit",
                                        tip: ef.util.getLocale("setting.user.edit.tip"),
                                        id: "0",
                                        click:function()
                                        {
                                            ef.placard.hide();
                                            if(namesave){
                                                $("#vlanDetailname").textbox("setValue",namesave);
                                                $("#vlanDetailDNS").textbox("setValue",DNSsave);
                                                $("#netgate").textbox("setValue",netsave);
                                            }
                                            else
                                            {
                                                $("#vlanDetailname").textbox("setValue",_data.name);
                                                $("#vlanDetailDNS").textbox("setValue",_data.dns);
                                                $("#netgate").textbox("setValue",_data.gateway);
                                            }
                                            _descriptBtns.setStatus("2",true);
                                            _descriptBtns.goto(1);
                                            $("#vlanDetailname").textbox({"disabled":false});
                                            $("#vlanDetailDNS").textbox({"disabled":false});
                                            $('.data_dns span').tooltip("destroy");
                                            //$("#netgate").textbox({"disabled":false});
                                            $(".data_gateway").find("span.textbox").addClass("noborder");
                                            $(".data_id").find("span.textbox").addClass("noborder");
                                            $(".data_cidr").find("span.textbox").addClass("noborder");
                                            $(".data_name .textbox").removeClass('noborder');
                                            $(".data_dns .textbox").removeClass('noborder');
                                            $(".data_gateway .textbox").removeClass('noborder');
                                            $("#vlanDetailname").textbox({
                                                onChange: function () {
                                                    _descriptBtns.setStatus("2",false);
                                                }
                                            });
                                            $("#vlanDetailDNS").textbox({
                                                validType:'reg[/^(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])$/]',
                                                onChange: function () {
                                                    _descriptBtns.setStatus("2",false);
                                                }
                                            });
                                            $("#netgate").textbox({
                                                disabled:false,
                                                validType:'reg[/^(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])$/]',
                                                onChange: function () {
                                                    _descriptBtns.setStatus("2",false);
                                                }
                                            });

                                        }
                                    }
                                ],
                                [
                                    {
                                        iconClass: "icon-menus-icon-save",
                                        tip: ef.util.getLocale("setting.user.save.tip"),
                                        id:"2",
                                        click:function()
                                        {
                                            if(!$("#vlanDetailname").textbox('isValid')||!$("#vlanDetailDNS").textbox('isValid')||!$("#netgate").textbox("isValid")){
                                                return;
                                            }
                                            ef.loading.show();
                                            var isForce=true;
                                            ef.placard.hide();
                                            var choose = [];
                                            name = $("#vlanDetailname").textbox("getValue");
                                            var DNSsaveOne = $("#vlanDetailDNS").textbox("getValue");//DNS
                                            var netgate = $("#netgate").textbox('getValue');
                                            $('.data_dns span').tooltip({
                                                content: '<span style="color:#fff">'+DNSsaveOne+'</span>',
                                                onShow: function () {
                                                    $(".tooltip-bottom").css("left", 300);
                                                }
                                            });
                                            var GateWay=$("#netgate").textbox("getValue");//wangguan
                                            var namesaveOne = $("#vlanDetailname").textbox("getValue");//
                                            var d = ef.util.map(implement.ipOccpyData, function (num) {
                                                if(num.occupy!="3"){
                                                    return num.ip;
                                                }
                                            });
                                            var DnsAll;
                                            if(!DNSsaveOne){
                                                DnsAll=[];
                                            }
                                            else{
                                                DnsAll=DNSsaveOne.split(",");
                                            }
                                            for(var i=0;i<vlanname.length;i++){
                                                choose.push(name==vlanname[i]);
                                            }
                                            if(choose.indexOf(true)!=-1){
                                                ef.loading.hide();
                                                ef.placard.show(ef.util.getLocale("network.Detail.name"));
                                            }
                                            else if(d.indexOf(netgate)!=-1){
                                                ef.loading.hide();
                                                ef.placard.show(ef.util.getLocale("network.Detail.gateway"));
                                            }
                                            else if(DnsAll.length>5){
                                                ef.loading.hide();
                                                ef.placard.show(ef.util.getLocale("network.vlan.placard.dns.length"));
                                            }
                                            else{
                                                ef.getJSON(
                                                    {
                                                        url:api.getAPI("subnet")+"/"+_data.id,
                                                        type:"post",//get,post,put,delete
                                                        isForce:isForce,
                                                        data:{
                                                            "name":namesaveOne,
                                                            "dns":DnsAll,
                                                            "gateway": netgate
                                                        },
                                                        success:function(response)
                                                        {
                                                            ef.nav.reload();
                                                            //ef.loading.hide();
                                                            //DNSsave = $("#vlanDetailDNS").textbox("getValue");
                                                            namesave = $("#vlanDetailname").textbox("getValue");
                                                            //netsave = netgate;
                                                            //$(".data_name input").attr("disabled","disabled");
                                                            //$(".data_name .textbox").addClass('noborder');
                                                            //$(".data_dns input").attr("disabled","disabled");
                                                            //$(".data_dns .textbox").addClass('noborder');
                                                            //$(".data_gateway input").attr("disabled","disabled");
                                                            //$(".data_gateway .textbox").addClass('noborder');
                                                            //_descriptBtns.goto(0);
                                                            //saveDescriptData();
                                                        },
                                                        error:function(error)
                                                        {
                                                            ef.loading.hide();
                                                            console.log(error);
                                                        }
                                                    });
                                            }
                                        }
                                    },
                                    {
                                        iconClass: "icon-menus-icon-cancel",
                                        tip: ef.util.getLocale("setting.user.cancel.tip"),
                                        click:function()
                                        {
                                            ef.placard.hide();
                                            if(namesave){
                                                $("#vlanDetailname").textbox("setValue",namesave);
                                                $("#vlanDetailDNS").textbox("setValue",DNSsave);
                                                $("#netgate").textbox('setValue',netsave);

                                            }
                                            else
                                            {
                                                $("#vlanDetailname").textbox("setValue",_data.name);
                                                $("#vlanDetailDNS").textbox("setValue",_data.dns);
                                                $("#netgate").textbox('setValue',_data.gateway);
                                                $('.data_dns>span').tooltip({
                                                    content: '<span style="color:#fff">'+_data.dns+'</span>'
                                                });
                                            }
                                            $(".data_name input").attr("disabled","disabled");
                                            $(".data_name .textbox").addClass('noborder');
                                            $(".data_dns input").attr("disabled","disabled");
                                            $(".data_dns .textbox").addClass('noborder');
                                            $(".data_gateway input").attr("disabled","disabled");
                                            $(".data_gateway .textbox").addClass('noborder');
                                            _descriptBtns.goto(0);
                                        }
                                    }
                                ]
                            ]).setStatus("2",true);
                        }
                        //IP
                        if(user.isSys()||user.isSuper()) {
                            implement._ipBtns = $(".ipBtns").togglebutton([
                                [
                                    {
                                        iconClass: "icon-menus-icon-edit",
                                        tip: ef.util.getLocale("setting.user.edit.tip"),
                                        id: '1',
                                        click: function () {
                                            implement._ipBtns.goto(1);
                                            implement._ipBtns.setStatus("0",true);
                                            $(".ip-selected").text(legendDataCopy.selected+legendDataCopy.tenantOccupy+legendDataCopy.dhcp);
                                            if(legendDataCopy.tenantOccupy==0){
                                                $(".ip-selected").text(legendDataCopy.selected+legendDataCopy.hostOccupy+legendDataCopy.dhcp);
                                            }
                                            implement.ipInit(ipresp,true, function (ip,ind) {
                                                ip.change(function()
                                                {
                                                    implement._ipBtns.setStatus("0",false);
                                                    var keyVal = $("#pos3Text").combobox('getValue');
                                                    var wait_selected_ips=ef.util.map(implement.stack.children,function(il) {
                                                        if (il.ip) {
                                                            return il.ip.getPreSelectSquares().length;
                                                        }
                                                    });
                                                    wait_selected_ips=ef.util.without(wait_selected_ips,undefined);
                                                    wait_selected_ips=ef.util.without(wait_selected_ips,0);
                                                    var se = [];
                                                    if(res.value[keyVal]){
                                                        for(var j = 0;j< res.value[keyVal].ips.length;j++){
                                                            if(!ef.util.isEmpty(res.value[keyVal].ips[j].tenant)||res.value[keyVal].ips[j].vm!=""||res.value[keyVal].ips[j].dhcp==true||res.value[keyVal].ips[j].gateway){
                                                                se.push(res.value[keyVal].ips[j]);
                                                            }
                                                        }
                                                        res.value[keyVal].ips = se;
                                                    }else{
                                                        res.key.push(keyVal);
                                                        res.value[keyVal] = {cidr:implement.cidr,ips:[]};
                                                    }
                                                    var a = ip.getIpRangeJustSelected();
                                                    //var ipunselected=ip.getUnSelectedSquares();
                                                    var tenantIP=ip.getTenantOccupySquare().length;
                                                    var dhcpIP=ip.getDhcpSuqare().length;
                                                    var hostIP=ip.getHostOccupySquare().length;
                                                    var netGateIP=ip.getGatewaySquare().length;
                                                    if(implement.stack.children[ind].ip.getSelectedSquare().length==implement.stack.children[ind].ip.squares.length-tenantIP-dhcpIP-hostIP-netGateIP){
                                                        $("#ipSelectAll").prop("checked",true);
                                                    }else{
                                                        $("#ipSelectAll").prop("checked",false);
                                                    }
                                                    $(a).each(function (e,el) {
                                                        var ip_three = cidrX.pos1+"."+cidrX.pos2+"."+keyVal+"."+el;
                                                        var item = {
                                                            dhcp:false,
                                                            ip:ip_three,
                                                            name:$("#vlanDetailname").textbox('getValue'),
                                                            tenant:{},
                                                            used:0,
                                                            vm:""
                                                        };
                                                        res.value[keyVal].ips.push(item);
                                                    });
                                                    res.value[keyVal].ips = ef.util.uniq(res.value[keyVal].ips);
                                                    var result=[];
                                                    for(var i in res.value){
                                                        result=result.concat(res.value[i].ips);
                                                    }
                                                    implement.ipLegendValue(result);
                                                    /*var select = 0,unselected= 0,selected=0;
                                                    for(var e=0;e<implement.stack.children.length;e++){
                                                        selected+=implement.stack.children[e].ip.getIpRangeJustSelected().length;
                                                        unselected+=implement.stack.children[e].ip.getUnSelectedSquares().length
                                                    }
                                                    for(var i in res.value){
                                                        select+=res.value[i].ips.length;
                                                    }
                                                    legendData.selected =selected;
                                                    legendData.unselect = unselected;
                                                    implement.ipLegend.setData(legendData);*/
                                                    $(".ip-wait-selected").text(Number(wait_selected_ips));
                                                    //$(".ip-selected").text(legendData.selected+legendData.dhcp+legendData.hostOccupy);
                                                });
                                            });
                                        }
                                    }
                                ],
                                [
                                    {
                                        iconClass: "icon-menus-icon-save",
                                        tip: ef.util.getLocale("setting.user.save.tip"),
                                        id:"0",
                                        click: function () {
                                            var isForce=true;
                                            var ipsSelect = [];
                                            var dhcp,netGate;
                                            for(var i in res.value){
                                                $(res.value[i].ips).each(function (e,el) {
                                                    if(el.gateway){netGate = el.ip;}
                                                    if(el.dhcp==true){dhcp = el.ip;}
                                                    if(!el.gateway){ipsSelect.push(el.ip);}
                                                });
                                            }
                                            var ipData = ef.util.getIpGroupsData(ipsSelect);
                                            implement.setVlanIp(_data.id,ipData,implement.isForce,function(response)
                                            {
                                                //implement._ipBtns.goto(0);
                                                //implement.refreshIp(_data.id,_data,implement.isForce,implement.doCallback);
                                                ef.placard.tick(ef.util.getLocale("network.vlan.placard.editIpsuc"));
                                                //legendDataCopy = ef.util.copyDeepProperty(legendData);
                                                ef.nav.reload();
                                            });
                                        }
                                    },
                                    {
                                        iconClass: "icon-menus-icon-cancel",
                                        tip: ef.util.getLocale("setting.user.cancel.tip"),
                                        click: function () {
                                            ipresp.cidr=_data.cidr;
                                            implement.ipInit(ipresp);
                                            implement._ipBtns.goto(0);
                                            implement.ipLegend.setData(legendDataCopy);
                                        }
                                    }
                                ]
                            ]).setStatus("0",true);
                        }
                        //IP主机占用删除
                        if(user.isSys()||user.isSuper()){
                            implement._iconMenu=$(".delVmOcupyBtns").iconmenu([
                                {
                                    iconClass:"icon-menus-icon-delete-port",
                                    tip:ef.util.getLocale('host.iconmenu.delete.tip'),//"删除"
                                    id:"4",
                                    "access":[6,7,8,88],
                                    click:function()
                                    {
                                        if($("#vlandetailip_grid").length){
                                            var row=$("#vlandetailip_grid").datagrid("getSelected");
                                            var index = $("#vlandetailip_grid").datagrid("getRowIndex",row);
                                            //dhcp== false port == 'xxxxxx'
                                            if(row && !!row.port && !row.dhcp && row.vm == 'emptyvm'){
                                                implement.utils.deletePort(row.port,index);
                                            }
                                        }
                                    }
                                }
                            ]);
                            implement._iconMenu.setStatus("4",true)
                        }
                    }
                });
            })
        });
    };
    implement.utils = {
        deletePort:function(port,index){
            ef.loading.show();
            ef.getJSON({
                url:api.getAPI('subnet.delete.port')+'/'+port,
                type:'DELETE',
                dataType:'json',
                success:function(response){
                    $("#vlandetailip_grid").datagrid('unselectAll');
                    implement._iconMenu.setStatus("4",true);
                    ef.nav.reload();
                    ef.loading.hide();
                },
                error:function(error){
                    $("#vlandetailip_grid").datagrid('unselectAll');
                    implement._iconMenu.setStatus("4",true);
                    ef.loading.hide();
                }
            });
        }
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});