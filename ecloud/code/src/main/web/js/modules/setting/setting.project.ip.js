define(["module","api","network.vlanDetail","user","network.vlan"],function (module,api,vlanDetail,user,networkVlan) {
    var implement=new ef.Interface.implement();
    implement.edit=false;
    implement.divIp = $("#bar_ip_box");
    var res,_ip,cidrX,resCopy = [];
    var legendData = {
        unselect: 0,
        selected: 0,
        hostOccupy: 0
        /*tenantOccupy: 0,
        dhcp: 0,
        gateway: 1*/
    },legendDataCopy;
    implement.legend = function () {
        implement.ipLegend = $(".ip_legend").ipLegend(legendData);
    };
    implement.ipInit = function (result,isTrue,callback) {
        if(result.ips.length==0){
            $("#getIpList").find(".ip-legend").hide();
            $("#getIpList").find(".ip_sect").hide();
            $("#getIpList").find(".bar_ip_box.viewstack").hide();
            $("#getIpList").find(".ip-list-block-none").show().text("暂无数据");
            return;
        }
        $("#getIpList").find(".ip-list-block-none").hide();
        $("#getIpList").find(".block-list").show();
        res = networkVlan.resultSplice(result);
        cidrX = new ef.CidrX(result.cidr);
        $(".pos1").text(cidrX.pos1);
        $(".pos2").text(cidrX.pos2);
        $(".bar_ip_box").empty();
        var comboxData;
        comboxData = ef.util.formatComboxData(res.key);
        var selected_ips,all_ips,wait_selected_ips,select = 0;
        implement.stack = $(".bar_ip_box").viewstack(comboxData, {killAutoSelected: true}).change(function (ind, item) {
            var _ip = null;
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
                        isFilter:true,
                        isEdit: true,
                        isHideLengend: true
                    });
                /*var count=item.ip.squares.length;
                count=Math.floor(count/15);
                for(var e=1;e<=count;e++){
                    $("li.viewstack-li.selected>div .ip span.ip_square:nth-child("+15*e+")").css("padding-right","0px !important");
                }*/
            }
            $(implement.stack.children).each(function(i,il){
                if(!il.ip){
                    var data;
                    if(res.value[Number(il.data.value)]){
                        data = res.value[Number(il.data.value)];
                    }else{data = {cidr:result.cidr};}
                    il.ip = il.dom.ip(
                        data,
                        {
                            isFilter:true,
                            isEdit: true,
                            isHideLengend: true
                        });
                };
            });
            _ip = item.ip;
            if(isTrue){
                _ip.setMode(true);
                $(".ip-selected-text").show();
            }
            else{_ip.setMode(false);$(".ip-selected-text").hide();}
            //implement.ipchange(result,_ip,ind);
            if(callback){
                callback(_ip,ind);
            }
           // var a = ip.getIpRangeJustSelected();
            var tenantIP=item.ip.getTenantOccupySquare().length;
            var dhcpIP=item.ip.getDhcpSuqare().length;
            var hostIP=item.ip.getHostOccupySquare().length;
            var netGateIP=item.ip.getGatewaySquare().length;
            var range=implement.stack.children[ind].ip.range.length;
            if(item.ip.getSelectedSquare().length==range-tenantIP-dhcpIP-hostIP-netGateIP){
                $("#ipSelectAll").prop("checked",true);
            }else{
                $("#ipSelectAll").prop("checked",false);
            }
            $('#ipSelectAll').click(function () {
                if($(this).is(':checked')) {
                    item.ip.selectAll();
                    implement.checkChange(ind,result);
                }else{
                    item.ip.unSelectAll();
                    implement.checkChange(ind,result);
                }
            });
        });
        if(cidrX.segments.length == 1){
            if(Number(comboxData[0].value)<10){
                $("#pos3Text").combobox({
                    width:15
                });
            }else if(Number(comboxData[0].value)<100){
                $("#pos3Text").combobox({
                    width:24
                });
            }else if(Number(comboxData[0].value)>100){
                $("#pos3Text").combobox({
                    width:30
                });
            }
        }else{
            $("#pos3Text").combobox({
                width:60
            });
        }
        $("#pos3Text").combobox(
                {
                    /*width: (function(boo){
                        if(boo){
                            $("div.ip_sect span.textbox.textbox-readonly.combo").css("padding-left","0");
                            return 24
                        }else{
                            return 60
                        }
                    })(cidrX.segments.length == 1),*/
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
                        implement.stack.goto(indexx);
                    }
                }
        );
        $("#pos3Text").combobox("setValue", comboxData[0].value);
        var ipSectData = [];
        $(ef.util.formatComboxData(res.key)).each(function (i,il) {
            var item = {text:il.value};
            ipSectData.push(item);
        });
        $("#ipSect").combobox({data:ipSectData});

    };
    implement.checkChange=function(ind,all_ips){
        var keyVal = $("#pos3Text").combobox('getValue');
        var se = [];
        if(res.value[keyVal]){
            for(var j = 0;j< res.value[keyVal].ips.length;j++){
                if(!ef.util.isEmpty(res.value[keyVal].ips[j].tenant)||res.value[keyVal].ips[j].vm!=""||res.value[keyVal].ips[j].dhcp==true||res.value[keyVal].ips[j].gateway){
                    res.value[keyVal].ips[j].isSelf = true;
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
                name:implement.data.name,
                tenant:{},
                isSelf:true,
                used:0,
                vm:""
            };
            res.value[keyVal].ips.push(item);
        });
        res.value[keyVal].ips = ef.util.uniq(res.value[keyVal].ips);
        resCopy.length = 0;
        for(var b in res.value){
            ef.util.map(res.value[b].ips, function (il) {
                if(il.isSelf&&il.isSelf==true&&il.dhcp==false&&!il.gateway||il.vm!="")
                {
                    resCopy.push(il.ip);
                }
            })
        }
        //上面是新添
        var selected_ips=ef.util.map(implement.stack.children,function(il) {
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
        legendData.selected = sel;
        legendData.unselect = all_ips.ips.length - legendData.selected;
        implement.ipLegend.setData(legendData);
        $(".ip-selected").text(sel);
        if(legendData.selected!=legendDataCopy.selected){
            implement._hostList.setStatus("2",false);
        }
        /*var ipR = [];
         var ipRange = implement.ipRange();
         $(ipRange).each(function (i,il) {
         $(il.data).each(function (e,el) {
         if(el.length>1){
         ipR.push({ip:il.ip+"."+el[0]+"~"+il.ip+"."+el[el.length-1]});
         } else{ipR.push({ip:il.ip+"."+el[0]});}
         });
         });*/
    };
    implement.ipLegendValue = function (result) {
        implement.all_ips =result.ips.length;
        var tenant = [],vm = [],dhcp=[];
        $(result.ips).each(function (i,il) {
            if(il.vm&&il.vm!=""){
                vm.push(il);
            }
            //if(il.tenant.id&&il.tenant.id==ef.localStorage.get("projectDetail.id")){tenant.push(il);}
            //if(!il.dhcp){
            //    dhcp.push(il);
            //}
        });
        //legendData.selected =tenant.length;
        legendData.hostOccupy = vm.length;
        //legendData.tenantOccupy = tenant.length;
        legendData.unselect = implement.all_ips-legendData.selected-legendData.hostOccupy<0?0:implement.all_ips-legendData.selected-legendData.hostOccupy;
        implement.ipLegend.setData(legendData);
        $(".ip-selected").text(legendData.selected);
        legendDataCopy = ef.util.copyDeepProperty(legendData);
    };
    //拷贝数据，初始化
    implement.doCallback = function (result) {
        implement.ipresp = ef.util.copyDeepProperty(result);
        implement.ipInit(result);
        implement.ipLegendValue(result);
    };
    //刷新ip数据
    implement.refreshIp = function (callback) {
        ef.getJSON(
            {
                url: api.getAPI("subnet") + "/" + implement.data.id + "/ips",
                type: "get",//get,post,put,delete
                data: {tenant: ef.localStorage.get("projectDetail.id")},
                success: function (response) {
                    response=ef.util.getTotalIP(response);
                    var result = {};
                    result.cidr = implement.data.cidr;
                    //response.push({gateway: true, ip: implement.data.gateway, vm: "", tenant: {}});
                    var r = ef.util.map(response, function (num) {
                        if((ef.util.isEmpty(num.tenant)||num.tenant.id==ef.localStorage.get("projectDetail.id"))&&!num.dhcp){
                            return num;
                        }
                    });
                    var tenant=[];
                    $(response).each(function(i,num) {
                        if (num.tenant.id && num.tenant.id == ef.localStorage.get("projectDetail.id")&&!num.vm) {
                            tenant.push(num);
                        };
                    });
                    legendData.selected=tenant.length;
                    result.ips = r;//ef.util.copyDeepProperty(r);
                    result.ips = ef.util.without(result.ips,undefined);
                    //legendData.unselect = result.ips.length-legendData.hostOccupy-legendData.selected;
                    implement.ipLegend.setData(legendData);
                    $(result.ips).each(function (i,il) {
                        if(!il.vm)
                        {
                            delete il.tenant;
                            il.isSelf = true;
                        }
                        //il.isSelf = true;
                    });
                    if(result.length==0){
                        $("#getIpList").text("请选择IP");
                        return;
                    }
                    callback(result);
                },
                error: function (error) {
                    console.log(error);
                }
            });
    };
    implement.redraw=function(data) {
        //if(!ipData){return;}
        $(".iptotal").css("display","none");
        $(".ipSelectAll-content").css("display","none");
        implement.data = data;
        implement.refreshIp(implement.doCallback);
        implement.legend();
        //var _ip;
        //_ip=$("#bar_ip_box").ip(ef.util.copyDeepProperty(ipData),config);
        //var isEdit=ef.Dialog.getDialog("getIpList").param.param.isEdit;
        //_ip.setMode(false);
        if(user.isSuper()||user.isSys()){
            $(".ip_legend").append('<div class="icons-host-list" style="height: 40px;float: right;width: 50px;margin-top: -23px;margin-right: 4px;"></div>');
        }
        implement._hostList = $(".icons-host-list").togglebutton([
            [
                {
                    iconClass: "icon-menus-icon-edit",
                    tip: ef.util.getLocale("setting.user.edit.tip"),//编辑
                    id: '1',
                    access:[8,88],
                    click: function (menu)
                    {
                        $("#getIpList").find(".ip-legend").show();
                        $("#getIpList").find(".ip_sect").show();
                        $("#getIpList").find(".bar_ip_box.viewstack").show();
                        $("#getIpList").find(".ip-list-block-none").hide();
                        $(".iptotal").css("display","inline-block");
                        $(".ipSelectAll-content").css("display","inline");
                        implement._hostList.goto(1);
                        ef.getJSON({
                            url:api.getAPI("subnet")+"/"+implement.data.id+"/ips",
                            type:"get",
                            //data: {tenant: ef.localStorage.get("projectDetail.id")},
                            success: function (response) {
                                response=ef.util.getTotalIP(response);
                                var result = {};
                                result.cidr = implement.data.cidr;

                                //response.push({gateway: true, ip: implement.data.gateway, vm: "", tenant: {}});
                                var r = ef.util.map(response, function (num) {
                                    if((ef.util.isEmpty(num.tenant)||num.tenant.id==ef.localStorage.get("projectDetail.id"))&&!num.dhcp){
                                        return num;
                                    }
                                });
                                result.ips = r;
                                result.ips = ef.util.without(result.ips,undefined);
                                legendData.unselect = result.ips.length-legendData.hostOccupy-legendData.selected;
                                implement.ipLegend.setData(legendData);
                                $(result.ips).each(function (i,il) {
                                    if((!il.vm||il.vm=="")&&!ef.util.isEmpty(il.tenant))
                                    {
                                        il.tenant = {};
                                        il.isSelf = true;
                                    }
                                });
                                var o = [];
                                implement.ipInit(result,true, function (ip,ind) {
                                    ip.change(function()
                                    {
                                        implement._hostList.setStatus("2",false);
                                        var keyVal = $("#pos3Text").combobox('getValue');
                                        if(o.indexOf(keyVal)==-1){o.push(keyVal);}
                                        var wait_selected_ips=ef.util.map(implement.stack.children,function(il) {
                                            if (il.ip) {
                                                return il.ip.getPreSelectSquares().length;
                                            }
                                        });
                                        var selected_ips=ef.util.map(implement.stack.children,function(il) {
                                            if (il.ip) {
                                                return il.ip.getSelectedSquare().length;
                                            }
                                        });
                                        wait_selected_ips=ef.util.without(wait_selected_ips,undefined);
                                        wait_selected_ips=ef.util.without(wait_selected_ips,0);
                                        var se = [];
                                        if(res.value[keyVal]){
                                            for(var j = 0;j< res.value[keyVal].ips.length;j++){
                                                if(!ef.util.isEmpty(res.value[keyVal].ips[j].tenant)||res.value[keyVal].ips[j].vm!=""||res.value[keyVal].ips[j].dhcp==true||res.value[keyVal].ips[j].gateway){
                                                    res.value[keyVal].ips[j].isSelf = true;
                                                    se.push(res.value[keyVal].ips[j]);
                                                }
                                            }
                                            res.value[keyVal].ips = se;
                                        }else{
                                            res.key.push(keyVal);
                                            res.value[keyVal] = {cidr:implement.cidr,ips:[]};
                                        }
                                        var a = ip.getIpRangeJustSelected();
                                        $(a).each(function (e,el) {
                                            var ip_three = cidrX.pos1+"."+cidrX.pos2+"."+keyVal+"."+el;
                                            var item = {
                                                dhcp:false,
                                                ip:ip_three,
                                                name:implement.data.name,
                                                tenant:{},
                                                isSelf:true,
                                                used:0,
                                                vm:""
                                            };
                                            res.value[keyVal].ips.push(item);
                                        });
                                        res.value[keyVal].ips = ef.util.uniq(res.value[keyVal].ips);
                                        //resCopy = ef.util.copyDeepProperty(res);
                                        //var v = ef.util.difference(resCopy.key,o);
                                        //$(v).each(function (i,il) {
                                        //    resCopy.value[il].ips = [];
                                        //});
                                        var select = 0;resCopy.length = 0;
                                        for(var b in res.value){
                                            ef.util.map(res.value[b].ips, function (il) {
                                                if(il.isSelf&&il.isSelf==true&&il.dhcp==false&&!il.gateway||il.vm!="")
                                                {
                                                    resCopy.push(il.ip);
                                                }
                                            })
                                        }
                                        //for(var i in resCopy.value){
                                        //    select+=resCopy.value[i].ips.length;
                                        //}
                                        var tenantIP=ip.getTenantOccupySquare().length;
                                        var dhcpIP=ip.getDhcpSuqare().length;
                                        var hostIP=ip.getHostOccupySquare().length;
                                        var netGateIP=ip.getGatewaySquare().length;
                                        var range=implement.stack.children[ind].ip.range.length;
                                        if(implement.stack.children[ind].ip.getSelectedSquare().length==range-tenantIP-dhcpIP-hostIP-netGateIP){
                                            $("#ipSelectAll").prop("checked",true);
                                        }else{
                                            $("#ipSelectAll").prop("checked",false);
                                        }
                                        //legendData.selected = (resCopy.length-legendData.hostOccupy==-1)?0:resCopy.length-legendData.hostOccupy;
                                        var sel=0;
                                        for(var s=0;s<selected_ips.length;s++){
                                            sel+=selected_ips[s]
                                        }
                                        legendData.selected=sel;
                                        legendData.unselect = result.ips.length - legendData.selected;
                                        implement.ipLegend.setData(legendData);
                                        $(".ip-wait-selected").text(Number(wait_selected_ips));
                                        $(".ip-selected").text(legendData.selected);
                                    });
                                });
                            }
                        });

                    }
                }
            ],
            [
                {
                    iconClass: "icon-menus-icon-save",
                    tip: ef.util.getLocale("setting.user.save.tip"),//保存
                    id: "2",
                    access:[8,88],
                    click: function (menu) {
                        var ipsSelect = [];
                        //for(var i in resCopy.value){
                        //    $(resCopy.value[i].ips).each(function (e,el) {
                        //        if((!el.gateway||el.gateway==false)&&(el.dhcp!=true)){
                        //            ipsSelect.push(el.ip);
                        //        }
                        //    });
                        //}
                        var ipData = ef.util.getIpGroupsData(resCopy);
                        ef.getJSON({
                            url:api.getAPI("subnet")+"/"+implement.data.id+"/tenant/"+ef.localStorage.get("projectDetail.id")+"/ips",
                            type:"post",
                            data:{ips:ipData},
                            success: function (response) {
                                implement._hostList.goto(0);
                                ef.placard.tick(ef.util.getLocale("setting.project.placard.editip"));
                                ef.Dialog.close("getIpList");
                            }
                        });
                    }
                }
            ]
        ]);
        implement._hostList.setStatus(2,true);
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
