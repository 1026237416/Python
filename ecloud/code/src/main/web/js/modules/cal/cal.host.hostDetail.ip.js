/**
 * Created by ��ѩ�� on 2015/11/20.
 */
/**
 * Created by qiaozhi on 2015/11/20.
 */
define(["easyui", "clientPaging", "echart","module","user","api","setting.param","cal.host.hostDetail","domReady"], function (eu,client,ec,module,user,api,settingParam,calHostHostDetail,domReady) {
    var implement = new ef.Interface.implement();
    implement.clickNum = 0;
    implement.init = function () {
        $(".add").click(function () {
            if(!$(".add").hasClass("icon-add-done")){
                return ;
            }
            if($("#hostDetailTable").datagrid('getRows').length>=10){ef.placard.warn("网卡数量已经超过上限！");return;}
            if(implement.clickNum==0){return;}
            ef.loading.show();
            var ip;
            if($("#hostDetailIp3").combobox('getText')=="*"||$("#hostDetailIp4").combobox('getText')=="*"){
                ip = "";
            }else{
                var num1=$(".hostDetailIp1").text();
                var num2=$(".hostDetailIp2").text();
                var num3=$(".hostDetailIp3").text()==""?$("#hostDetailIp3").combobox('getText'):$(".hostDetailIp3").text();
                var num4=$("#hostDetailIp4").combobox('getValue');
                ip = num1+"."+num2+"."+num3+"."+num4}
            implement.postIPData(ip)
        });
        implement.EasyUI();
    };
    //网卡数据信息
    implement.getDataNics = function (removeFlag) {
        ef.getJSON({
            url:api.getAPI("cal.host.getHostlist")+"/"+ef.localStorage.get("hostDetail_id")+"/nics",
            type:"get",
            success: function (response) {
                $(response).each(function (i,il) {
                    il.subnet = il.fixed_ips[0].subnet_name;
                    il.ip = il.fixed_ips[0].ip_address;
                });
                $("#hostDetailTable").datagrid({data:response});
                if(removeFlag){
                    implement.reStoreNetHost();
                }

                ef.loading.hide();
            },error: function () {
                ef.loading.hide();
            }
        });
    };
    //设置下拉框的不可用
    implement.comboDisabled = function () {
        $("#hostDetailPhynet").combobox('clear');
        $("#hostDetailNet").combobox({disabled:true,data:[]});
        $("#hostDetailSubnet").combobox({disabled:true,data:[]});
        $("#hostDetailIp1").parent().show();
        $("#hostDetailIp2").parent().show();
        $(".hostDetailIp1").hide();
        $(".hostDetailIp2").hide();
        $("#hostDetailIp3").parent().show();
        $(".hostDetailIp3").hide().text("");
        $("#hostDetailIp3").combobox({disabled:true,data:[]});
        $("#hostDetailIp4").combobox({disabled:true,data:[]});
        //$("#hostDetailMac").textbox('clear');
    };
    implement.EasyUI = function () {
        $("#hostDetailTable").datagrid({
            singleSelect: true,
            pagination: false,
            columns:[[
                {field:'btn',title:'',width:'5%',formatter: function (val,row,index) {
                    var dom = $('<i class="js-delete nothover"></i>');
                    dom.click(function () {
                        $.messager.confirm(ef.alert.warning, ef.util.getLocale('host.network.delete.message')+"：'"+row.ip+"'"+'?', function (ok) {//是否删除云硬盘  所有相关备份同时删除
                            if (ok) {
                                ef.loading.show();
                                ef.getJSON({
                                    url: api.getAPI("cal.host.getHostlist") + "/" + ef.localStorage.get("hostDetail_id") + "/nic" + "/" + row.port_id,
                                    type: "delete",
                                    success: function (response) {
                                        implement.getDataNics(true);
                                        ef.loading.hide();
                                    }, error: function () {
                                        ef.loading.hide();
                                    }
                                });
                            }
                        });
                    });
                    return dom;
                }},
                {field:'ip',title:'IP',width:'26%'},
                {field:'name',title:'网络',width:'26%'},
                {field:'subnet',title:'子网',width:'26%'},
                {field:'phy_network',title:'物理网络',width:'26%'}/*,
                {field:'mac_addr',title:'物理地址',width:'25%'}*/
            ]]
        });
        ef.getJSON({
            url: api.getAPI("network.host.datagrid_host"),
            type:'get',
            success: function (response) {
                $("#hostDetailPhynet").combobox({data:response});
            }
        });
        $("#hostDetailPhynet").combobox({
            prompt:ef.util.getLocale('framework.component.addvlans.phnet.prompt'),
            editable:false,
            textField:'name',
            valueField:'name',
            onChange: function (newValue) {
                $("#hostDetailNet").combobox("clear");
                $("#hostDetailSubnet").combobox("clear").combobox({disabled:true});
                //$("#hostDetailMac").textbox({disabled:true});
                $("#hostDetailIp1").parent().show();
                $("#hostDetailIp2").parent().show();
                $(".hostDetailIp1").hide();
                $(".hostDetailIp2").hide();
                $("#hostDetailIp3").parent().show();
                $(".hostDetailIp3").hide().text("");
                $("#hostDetailIp3").combobox({disabled:true,width:46,data:[]});
                $("#hostDetailIp4").combobox({disabled:true,width:46,data:[]});
                //$("#hostDetailMac").textbox('clear');
                $("i.add").removeClass("icon-add-done").addClass("icon-add-disable");
                if(newValue!="") {
                    ef.getJSON({
                        url: api.getAPI("network.vlan.datagrid_vlan"),
                        data: {
                            phy_network: newValue
                        },
                        success: function (response) {
                            var leftData = implement.removeSameVlan(response);
                            $("#hostDetailNet").combobox({data: leftData, disabled: false});
                        }
                    });
                }
            }
        });
        $("#hostDetailNet").combobox({
            prompt:ef.util.getLocale("order.wait.validate.vlan"),
            editable:false,
            textField:'name',
            valueField:'id',
            disabled:true,
            onChange: function (newValue) {
                $("#hostDetailSubnet").combobox("clear");
                //$("#hostDetailMac").textbox({disabled:true});
                $("#hostDetailIp1").parent().show();
                $("#hostDetailIp2").parent().show();
                $(".hostDetailIp1").hide();
                $(".hostDetailIp2").hide();
                $("#hostDetailIp3").parent().show();
                $(".hostDetailIp3").hide().text("");
                $("#hostDetailIp3").combobox({disabled:true,width:46,data:[]});
                $("#hostDetailIp4").combobox({disabled:true,width:46,data:[]});
                //$("#hostDetailMac").textbox('clear');
                $("i.add").removeClass("icon-add-done").addClass("icon-add-disable");
                if(newValue!="") {
                    var row = $("#hostDetailTable").datagrid('getRows');
                    var name = ef.util.map(row, function (il) {
                        return il.net_id;
                    });
                    if(name.indexOf(newValue)!=-1){
                        ef.placard.warn("网络不能重复");
                        $("#hostDetailNet").combobox('clear');
                        return;
                    }
                    ef.getJSON({
                        url: api.getAPI("network.vlan.datagrid_vlan_child"),
                        data: {
                            tenant: ef.localStorage.get("tenantid"),
                            network_id: newValue
                        },
                        success: function (response) {
                            $("#hostDetailSubnet").combobox({data: response, disabled: false});
                        }
                    });
                }
            }
        });
        $("#hostDetailSubnet").combobox({
            prompt:ef.util.getLocale("framework.component.addvlans.childnet.prompt"),
            editable:false,
            disabled:true,
            textField:'name',
            valueField:'id',
            onChange: function (newValue) {
                //$("#hostDetailMac").textbox({disabled:false});
                $("#hostDetailIp1").parent().show();
                $("#hostDetailIp2").parent().show();
                $(".hostDetailIp1").hide();
                $(".hostDetailIp2").hide();
                $("#hostDetailIp3").parent().show();
                $(".hostDetailIp3").hide().text("");
                //$("#hostDetailMac").textbox('clear');
                $("#hostDetailIp3").combobox({disabled:true,width:46,data:[]});
                $("#hostDetailIp4").combobox({disabled:true,width:46,data:[]});
                if(newValue!="") {
                    /*$(".hostDetailMac").find(".textbox-text").focus(function () {
                        $(this).attr("placeholder","请输入mac地址");
                    }).blur(function () {
                        $(this).attr("placeholder","不指定");
                    });*/
                    ef.getJSON({
                        url: api.getAPI("order.wait.Detail.combo.ip") + "/" + newValue + "/ips",
                        data: {
                            tenant: ef.localStorage.get("tenantid"),
                            used: 0
                        },
                        success: function (response) {
                            //var arr=ef.util.getTotalIP(response);
                            var arr = ef.util.getAvailableIP(response);
                            console.log(arr);
                            if(arr.length==0){
                                ef.placard.warn(ef.util.getLocale("host.ip.null"));
                                return ;
                            }
                            implement.ipSetValue(arr);

                        }
                    });
                }
            }
        });
        $("#hostDetailIp1").combobox({
            editable:false,
            disabled:true

        });
        $("#hostDetailIp2").combobox({
            editable:false,
            disabled:true
        });
        $("#hostDetailIp3").combobox({
            editable:false,
            disabled:true,
            valueField:"value",
            textField:"text",
            onChange: function (newValue) {
                if(newValue!=-1){
                    var ipFour =[];
                    $(implement.ip).each(function(i,il){
                        if(ef.util.getIpThree(il)==newValue){
                            ipFour.push({
                                value:ef.util.getIpSufix(il),
                                text:ef.util.getIpSufix(il)
                            })
                        }
                    });
                    //ipFour.unshift({value:0,text:"*"});
                    console.log(ipFour);
                    $("#hostDetailIp4").combobox({disabled:false,data:ipFour,width:55,required:true});
                    $("i.add").removeClass("icon-add-done").addClass("icon-add-disable");
                }else{
                    $("#hostDetailIp4").combobox({disabled:true,data:[],width:55});
                }
            }
        });
        $("#hostDetailIp4").combobox({
            editable:false,
            disabled:true,
            valueField:"value",
            textField:"text",
            onChange: function (newValue) {
                if(newValue!=""){
                    $("i.add").addClass("icon-add-done").removeClass("icon-add-disable");
                    implement.clickNum = 1;

                }
            }
        });
        /*$("#hostDetailMac").textbox({
            disabled:true,
            prompt:'不指定',
            required:false,
            validType: 'regx[/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,"e.g. 00:26:C7:43:F5:2A"]'
        });*/

    };
    implement.postIPData=function(ip){
        ef.getJSON({
            url:api.getAPI("cal.host.getHostlist")+"/"+ef.localStorage.get("hostDetail_id")+"/nic",
            type:"put",
            data:{
                ip:ip,
                subnet_id:$("#hostDetailSubnet").combobox('getValue'),
                vlan_id:$("#hostDetailNet").combobox('getValue'),
                mac:""/*$("#hostDetailMac").textbox('getValue')*/
            },
            success: function (response) {
                implement.clickNum = 0;
                $("i.add").removeClass("icon-add-done").addClass("icon-add-disable");
                implement.getDataNics();
                implement.comboDisabled();
            },error: function () {
                ef.loading.hide();
            }
        });
    }
    implement.reStoreNetHost = function(){
        var newValue = $('#hostDetailPhynet').combobox('getValue');
        if(!newValue){
            return;
        }
        ef.getJSON({
            url: api.getAPI("network.vlan.datagrid_vlan"),
            data: {
                phy_network: newValue
            },
            success: function (response) {
                var leftData = implement.removeSameVlan(response);
                var selectedValue = $("#hostDetailNet").combobox('getValue');
                if(!!selectedValue){
                    var index = _.findIndex(leftData,function(item,indexValue){
                        return item.id == selectedValue;
                    });
                    if(index > -1){
                        leftData[index].selected = true;
                    }
                }
                
                $("#hostDetailNet").combobox({data: leftData, disabled: false});
            }
        });
    };
    implement.removeSameVlan = function(dataArray){
        var gridData = $("#hostDetailTable").datagrid('getData') || {};
        var networks = gridData.rows;
        if(!_.isArray(networks) || !networks.length){
            return dataArray;
        }
        var ids = _.chain(networks)
                    .pluck('net_id')
                    .flatten().value();
        if(ids.length){
            _.each(ids,function(idValue){
                var index = _.findIndex(dataArray,function(value){
                    return value.id == idValue;
                });
                if(index > -1){
                    dataArray.splice(index,1);
                }
            });
        }
        return dataArray;
    };
    //获取ip之后分别设置ip框内的值
    implement.ipSetValue = function (data) {
        $("i.add").addClass("icon-add-done").removeClass("icon-add-disable");
        implement.clickNum = 1;
        implement.ip = ef.util.map(data, function (il) {
            return il.ip;
        });
        $("#hostDetailIp1").parent().hide();
        $("#hostDetailIp2").parent().hide();
        $(".hostDetailIp1").show().text(ef.util.getIpFirst(implement.ip[0]));
        $(".hostDetailIp2").show().text(ef.util.getIpTwo(implement.ip[0]));
        $("#hostDetailIp4").combobox({width:55});
        var ipThree = ef.util.map(implement.ip, function (il) {
           return  ef.util.getIpThree(il);
        });
        ipThree=_.uniq(ipThree);
        console.log(ipThree);
        if(ipThree.length>1){
            var iparr=[];
            for(var i=0;i<ipThree.length;i++){
                iparr.push({value:ipThree[i],text:ipThree[i]})
            }
            iparr.unshift({value:-1,text:"*"});
            console.log( iparr);
            $("#hostDetailIp3").combobox({disabled:false,data:iparr,width:55}).combobox('setValue',-1);
            $("#hostDetailIp4").combobox({disabled:true,width:55});
        }else{
            $("#hostDetailIp3").parent().hide();
            $(".hostDetailIp3").show().text(ipThree[0]);
            var ipFour = ef.util.map(implement.ip, function (il) {
                return {value:ef.util.getIpSufix(il),text:ef.util.getIpSufix(il)};
            });
            ipFour.unshift({value:0,text:"*"});
            $("#hostDetailIp4").combobox({disabled:false,data:ipFour,width:55}).combobox('setValue',0);
        }

    };
    implement.redraw = function (){
        domReady(function () {
            implement.init();
            implement.getDataNics();
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});