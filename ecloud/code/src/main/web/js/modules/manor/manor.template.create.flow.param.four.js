/**
 * Created by hxf on 2016/5/27.
 */
define(["exports","module","domReady"],function(exports,module,domReady)
{
    var impl=new ef.Interface.implement();
    impl.deleteChoose = null;
    impl.deleteNameChoose = null;
    impl.owner=null;
    impl.init=function()
    {
        var data = [{label:ef.util.getLocale("apply.template.checkbox.data.hide"),value:"hide"},{label:ef.util.getLocale("apply.template.checkbox.data.readOnly"),value:"readOnly"}];
        $(".other_hide").hide();
        //$("#paramApp").combobox({
        //    height:30,
        //    width:200,
        //    editable:false,
        //    textField:"label",
        //    valueField:"value",
        //    disabled:impl.owner&&impl.owner.disable,
        //    required:true,
        //    data:[{label:"all",value:"all"},{label:"group",value:"group"}],
        //    onChange: function (newValue) {
        //        if(newValue=="group"){
        //            $(".other_hide").show();
        //        }
        //        if(newValue=="all"){
        //            $(".other_hide").hide();
        //        }
        //    }});
        $("#paramGroupNameDelete").textbox({
            height:30,
            width:200,
            required:true,
            disabled:impl.owner&&impl.owner.disable,
            validType: 'whitelist["0-9a-zA-Z_","字母,下划线和数字"]'
        });
        impl.deleteNameChoose = $("#deleteNameChoose").checkinfo({
            dataProvider:data,
            disabled:impl.owner&&impl.owner.disable,
            className:"checkInfo_choose"
        });
    };
    impl.redraw=function(param,owner)
    {
        this.owner=owner;
        this.init();
        if(param&&param!=undefined){
            var useData;
            if(param.data.body.data.nodes._data[param.id][param.id]){
                useData = param.data.body.data.nodes._data[param.id][param.id].params;
            }
            $(useData).each(function (i,il) {
                if(il.group_name){
                    $("#paramGroupNameDelete").textbox('setValue',il.group_name);
                    if(il.streamlet_params_properties_hide==true){impl.deleteChoose.setSelect("hide");}
                    if(il.streamlet_params_properties_read_only==true){impl.deleteChoose.setSelect("readOnly");}
                }
                //if(il.reboot_node_target){
                //    $("#paramApp").combobox('setValue',il.reboot_node_target);
                //    if(il.streamlet_params_properties_hide==true){impl.rebootNameChoose.setSelect("hide");}
                //    if(il.streamlet_params_properties_read_only==true){impl.rebootNameChoose.setSelect("readOnly");}
                //}
            });

        }
    };
    impl.destroy=function()
    {
        require.undef(module.id);
    };
    return impl;
});