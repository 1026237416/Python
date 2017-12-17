define(['easyui','domReady',"contextmenu","module","clientPaging","api","network.vlan","setting.param"],function(easyui,domReady,contextmenu,module,clientPaging,api,networkVlan,settingParam){
    var implement=new ef.Interface.implement();
    ef.localStorage.get("network.creatnet");
    implement.combo = function () {
        $("#nameinput").textbox({
            required: true,
            required: true,
            maxlength:15,
            prompt:'请输入名称',
            validType:'whitelist["a-zA-Z0-9_\u4E00-\u9FA5","中文,字母,数字和下划线"]',
            onChange:function(newValue,oldValue)
            {
                way.set("resultData.name",newValue);
            }
        });
        $("#IDinput").numberbox({
            required: true,
            prompt:'请输入数字1~4094',
            onChange:function(newValue,oldValue)
            {
                way.set("resultData.vlan_id",newValue);
            }
        });
        $("#typeinput").combobox({
            required:true,
            prompt:'请选择网络类型',
            maxlength:50,
            editable:false,
            data:[{text:"VLAN"},{text:"FLAT"}],
            textField:"text",
            valueField:"text",
            onChange: function (newValue) {
                way.set("resultData.vlan_type",newValue);
                if(newValue=="FLAT"){
                    $("#IDinput").numberbox({min:0});
                    $("#IDinput").numberbox('setValue',0);
                    way.set("resultData.vlan_id",0);
                    $("#IDinput").parent().hide();
                }else{
                    $("#IDinput").parent().show();
                    $("#IDinput").numberbox({min:1,max:4094});
                    $("#IDinput").numberbox('clear');
                }
            }
        });
        $('#phyNet').combobox({
            required:true,
            prompt:'请选择物理网络',
            editable:false,
            valueField:"name",
            textField:"name",
            onSelect:function(value){
                way.set("resultData.phy_network",value.name);
            }
        });
        implement.inter();
    };
    implement.inter = function () {
        ef.getJSON({
            url:api.getAPI("phynetworks"),
            type:"get",
            success: function (response) {
                $('#phyNet').combobox({data:response});
            }
        })
    };
    implement.utils={
        isValid:function(){
            if(!$("#nameinput").textbox('isValid')||!$("#IDinput").numberbox('isValid')||!$("#phyNet").combobox('isValid')||!$("#typeinput").combobox('isValid')){
                return false
             }else{
                ef.localStorage.get("network.creatnet").children[0].viewData={
                    'vlan_type': $("#typeinput").combobox('getValue'),
                    'name': $("#nameinput").textbox('getValue'),
                    'vlan_id':$("#IDinput").numberbox('getValue'),
                    'phy_network': $("#phyNet").combobox('getValue')
                };
                return true
            }
        }
    };
    implement.redraw=function()
    {
        $(document).ready(function() {
            implement.combo();
            implement.inter();
            /*ef.formatter['coresFormatter'] = function (val,row)
             {
             return  val+ef.util.getLocale("cal.host.util")+Math.ceil(row.memory_mb/1024)+ef.util.getLocale("cal.host.GB");
             };
             var hostgrid = null,newnet;
             var idRow = [];
             var b = [];

             _iconchange=$(".host-step-cont").iconchange(
             [
             {
             text:ef.util.getLocale("setting.user.addhost.dialog.title"),
             iconClass:"step-change-info",
             iconAllClass:"step-change-all-info",
             iconSelectedClass:"step-change-all-info-select"
             },
             {
             text:ef.util.getLocale("network.vlanDetail.blocklistlabel.hostlist"),
             iconClass:"icon-addVlan-disk",
             iconAllClass:"icon-addVlan-diskAll",
             iconSelectedClass:"icon-addVlan-diskAll-selected"
             },
             {
             text:ef.util.getLocale("network.vlan.createvlan.iconstep.finish.text"),
             iconClass:"step-change-over",
             iconAllClass:"step-change-all-over",
             iconSelectedClass:"step-change-all-over-select"
             }
             ],900);
             _iconchange.click(function (step) {
             _route.goto(step);
             _stack.goto(step);
             });
             var _stack=$(".viewstack-box2").viewstack();
             var reg = /^((\d{1,3}\.){3}(\d{1,3}))\/(\d{1,3})$/;
             var _route=$(".button-route").buttonstep({length:3}).change(function(pos)
             {
             _iconchange.goto(pos);
             _stack.goto(pos);
             if(!$("#nameinput").textbox('isValid')||!$("#IDinput").numberbox('isValid')||!$("#phyNet").combobox('isValid')||!$("#typeinput").combobox('isValid')){
             _route.goto(0);
             _stack.goto(0);
             _iconchange.goto(0);
             }
             if(pos==1)
             {
             if(!hostgrid)
             {
             ef.getJSON(
             {
             url:api.getAPI("network.vlan.addVlan.host"),
             type:"get",//get,post,put,delete
             isForce:true,
             success:function(response)
             {
             hostgrid = $("#vlanHostList111").datagrid({data:response});
             },
             error:function(error)
             {
             console.log(error);
             }
             });
             }
             }
             if(pos==2){
             $("#hosttd").empty();
             var selRows = $("#vlanHostList111").datagrid('getSelections');
             idRow.length=0;
             $(selRows).each(function (i,el) {
             idRow.push(el.id);
             $("#hosttd").append("<div style='margin-top: 10px;line-height: 20px;clear: both;'>"+el.name+"</div>");
             });
             $("#nametd").text($("#nameinput").textbox('getValue'));
             $("#IDtd").text($("#IDinput").numberbox('getValue'));
             $("#phyNetShow").text($("#phyNet").combobox('getValue'));
             $("#typetd").text($("#typeinput").combobox('getValue'));
             }
             }).confirm(function()
             {
             ef.loading.show();
             ef.getJSON(
             {
             url:api.getAPI("order.wait.Detail.combo.ip.xx"),
             type:"put",//get,post,put,delete
             data:{
             "name":$("#nametd").text(),
             "vlan_id":$("#IDtd").text(),
             "hosts":idRow,
             "vlan_type":($("#typetd").text()).toLowerCase(),
             "phy_network":$("#phyNet").combobox('getValue')
             },
             success:function(response)
             {
             ef.nav.reload();
             ef.loading.hide();
             ef.Dialog.close("vlan.addVlan");
             //ef.placard.tick(ef.util.getLocale("network.vlan.placard.addsuc"));
             },error:function(error) {
             ef.loading.hide();
             }
             });
             });
             ef.event.on("addVlanClose", function () {
             _iconchange.destroy();
             });
             });*/
        })
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});


