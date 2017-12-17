/**
 * Created by wangahui1 on 16/5/11.
 */
define(["exports","module","domReady","api"],function(exports,module,domReady,api)
{
    var impl=new ef.Interface.implement();
    impl.callback= $.noop;
    impl.closeCallback = $.noop;
    impl.stepType = null;
    impl.stepName = null;
    impl.isMange=false;
    impl.context=null;
    impl.init=function()
    {
        this.stepType = $(".manor_flow_set_step [name='stepType']",this.context);
        this.stepName = $(".manor_flow_set_step [name='stepName']",this.context);
        this.stepType.combobox({
            width:197,
            height:30,
            textField:'label',
            valueField:'value',
            editable:false,
            required:true
        });
        var url=api.getAPI("manorTemplate")+"/streamlet/list/"+(impl.isMange?"manage":"deploy");
        ef.getJSON({
            url:url,
            type:"get",
            crossDomain:true,
            success: function (response) {
                var result = [];
                $(response).each(function (i,il) {
                    var item = {label:"",value:""};
                    item.label = il;
                    item.value = il;
                    result.push(item);
                });
                impl.stepType.combobox({data:result});
                impl.cover.hide();
            },
            error:function()
            {
                impl.cover.hide();
            }
        });
        this.stepName.textbox({
            width:197,
            height:30,
            required:true,
            validType: 'whitelist["0-9a-zA-Z_","字母,下划线和数字"]'
        });
    };
    impl.redraw=function(context,isManage)
    {
        this.context=context||document;
        this.isMange=Boolean(isManage);
        this.cover=$(".manor_flow_box",context).coverlayer({loadingHeight:400});
        this.init();
        $(".manor_flow_step_right_btn",context).iconmenu([
            {
                iconClass: "icon-gray-right",
                tip: ef.util.getLocale("global.button.save.label"),
                id: "0",
                click:function()
                {
                    var id = impl.stepType.combobox('getValue')+"$"+ef.util.getUUID();
                    var data = {id:id,type:impl.stepType.combobox('getValue'),label:impl.stepName.textbox('getValue'),shape:"box",value:id};
                    $(context).find(".tab-box").show();
                    $(context).find(".noContent").hide();
                    impl.callback(data);
                }
            },
            {
                iconClass: "icon-manorTemplate-param-delete",
                tip: ef.util.getLocale("global.button.cancel.label"),
                id: "0",
                click:function()
                {
                    impl.closeCallback();
                }
            }
        ]);
    };
    impl.setCallback=function(fn)
    {
        this.callback=fn;
    };
    impl.setCloseCallback= function (fn) {
        this.closeCallback=fn;
    };
    impl.destroy=function()
    {
        require.undef(module.id);
    };
    return impl;
});