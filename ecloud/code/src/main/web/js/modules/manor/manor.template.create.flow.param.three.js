/**
 * Created by hxf on 2016/5/27.
 */
define(["exports","module","domReady"],function(exports,module,domReady)
{
    var impl=new ef.Interface.implement();
    impl.rebootChoose = null;
    impl.rebootNameChoose = null;
    impl.owner=null;
    impl.context=null;
    impl.init=function()
    {
        var data = [{label:ef.util.getLocale("apply.template.checkbox.data.readOnly"),value:"readOnly"},{label:ef.util.getLocale("apply.template.checkbox.data.hide"),value:"hide"}];
        $(".other_hide",impl.context).hide();
        $("#paramApp",impl.context).combobox({
            height:30,
            width:200,
            editable:false,
            textField:"label",
            valueField:"value",
            disabled:impl.owner&&impl.owner.disable,
            required:true,
            data:[{label:"all",value:"all"},{label:"group",value:"group"}],
            onChange: function (newValue) {
                if(newValue=="group"){
                    $(".other_hide",impl.context).show();
                }
                if(newValue=="all"){
                    $(".other_hide",impl.context).hide();
                }
        }});
        $("#paramGroupNameReboot",impl.context).textbox({
            height:30,
            width:200,
            required:true,
            disabled:impl.owner&&impl.owner.disable,
            validType: 'whitelist["0-9a-zA-Z_","字母,下划线和数字"]'
        });
        impl.rebootChoose = $("#rebootChoose",impl.context).checkinfo({
            dataProvider:data,
            disabled:impl.owner&&impl.owner.disable,
            className:"checkInfo_choose"
        });
        impl.rebootNameChoose = $("#rebootNameChoose",impl.context).checkinfo({
            dataProvider:data,
            disabled:impl.owner&&impl.owner.disable,
            className:"checkInfo_choose"
        });
        if(!this.owner.isInstall&&this.owner.isMange)
        {
            $("#rebootChoose",impl.context).hide();
            $("#rebootNameChoose",impl.context).hide();
        }
    };
    impl.redraw=function(param,owner,context)
    {
        this.context=context||document;
        this.owner=owner;
        this.init();
        if(param&&param!=undefined){
            var useData;
            if(param.data.body.data.nodes._data[param.id][param.id]){
                useData = param.data.body.data.nodes._data[param.id][param.id].params;
            }
            $(useData).each(function (i,il) {
                if(i==0)
                {
                    if(il.streamlet_params_properties_hide==true){impl.rebootNameChoose.setSelect("hide");}
                    if(il.streamlet_params_properties_read_only==true){impl.rebootNameChoose.setSelect("readOnly");}
                    if(il.group_name){
                        $("#paramGroupNameReboot",impl.context).textbox('setValue',il.group_name);
                    }
                    //$(".other_hide",impl.context).show();
                }
                if(i==1){
                    $("#paramApp",impl.context).combobox('setValue',il.reboot_node_target);
                    if(il.streamlet_params_properties_hide==true){impl.rebootChoose.setSelect("hide");}
                    if(il.streamlet_params_properties_read_only==true){impl.rebootChoose.setSelect("readOnly");}
                    if(il.reboot_node_target=="group")
                    {
                        $(".other_hide",impl.context).show();
                    }
                }
            });

        }
    };
    impl.destroy=function()
    {
        require.undef(module.id);
    };
    return impl;
});