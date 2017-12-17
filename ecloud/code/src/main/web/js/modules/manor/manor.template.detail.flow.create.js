/**
 * Created by wangahui1 on 16/5/17.
 */
define(["module","exports","domReady","api"],function(module,exports,domReady,api)
{
    var impl=new ef.Interface.implement();
    var iconPicker;
    impl.getIcon=function(success,error)
    {
        ef.getJSON({
            url:api.getAPI("manorIcon"),
            useLocal:true,
            success:success|| $.noop,
            error:error|| $.noop
        })
    };
    impl.redraw=function()
    {
        ef.i18n.parse(".create_flow_dialog");
        var target=[
            {
                label:"cluster",
                value:"cluster",
                selected:true
            },
            {
                label:"group",
                value:"group"
            },
            {
                label:"node",
                value:"node"
            }
        ];
        $(".create_flow_dialog #flowName").textbox({width:220,height:30,required:true,maxlength:15,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'});
        $(".create_flow_dialog #flowRange").combobox({width:220,height:30,data:target,textField:"label",valueField:"value",editable:false});
        $(".create_flow_dialog #flowDes").textbox({width:340,height:98,multiline:true});
        this.getIcon(function(resp)
        {
            iconPicker=$(".manorMangeIconBox").picker({
                dataProvider: resp
            })
        });

        $(".create_flow_dialog #btnConfirm").click(function()
        {
            if(!$(".create_flow_dialog #flowName").textbox("isValid"))
            {
                ef.placard.warn(ef.util.getLocale("apply.template.detail.flow.create.name.valid.tip"));
                return;
            }
            ef.event.trigger("ManorEvent.detail.flow.create.build",
                {
                    name:"",
                    label:$(".create_flow_dialog #flowName").textbox("getValue"),
                    type:"manage",
                    target:$(".create_flow_dialog #flowRange").combobox("getValue"),
                    description:$(".create_flow_dialog #flowDes").textbox("getValue"),
                    icon:iconPicker.getSelected().data.icon
                });
        });
        $(".create_flow_dialog #btnCancel").click(function()
        {
            ef.event.trigger("ManorEvent.detail.flow.create.close");
        });
    };
    impl.destroy=function()
    {
        require.undef(module.id);
    };
    return impl;
});