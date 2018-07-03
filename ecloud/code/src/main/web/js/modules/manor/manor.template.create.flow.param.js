/**
 * Created by wangahui1 on 16/5/11.
 */
define(["exports","module","domReady","api"],function(exports,module,domReady,api)
{
    var impl=new ef.Interface.implement();
    impl.flow_param = null;
    impl.callback = $.noop;
    impl.owner=null;
    impl.context=null;
    var paramClickName;
    impl.init=function()
    {
        //$(".script_type_select",impl.context).combobox(
        //    {
        //        textField:"label",
        //        valueField:"value",
        //        width:200,
        //        height:30,
        //        editable:false,
        //        data:[
        //            {
        //                label:"shell",
        //                value:"shell"
        //            },
        //            {
        //                label:"python",
        //                value:"python"
        //            }
        //        ]
        //    });
        $(".flow_parm_name",impl.context).textbox({
            width:197,
            height:30,
            required:true,
            maxlength:15,
            disabled:impl.owner&&impl.owner.disable,
            validType: 'whitelist["0-9a-zA-Z_","字母,下划线和数字"]',
            onChange:function()
            {

                //if(!impl.flow_param.current)
                //{
                //    $(".icon-templates-save").parent().removeClass("disabled");
                //}
                //$(".icon-templates-save").parent().css({opacity: 1});

            }
        });
        $(".flow_parm_type",impl.context).combobox({
            width:197,
            height:30,
            editable:false,
            required:true,
            textField:"label",
            valueField:"value",
            disabled:impl.owner&&impl.owner.disable,
            data:[{label:"input",value:"input"},{label:"select",value:"select"},{label:"checkbox",value:"checkbox"}],
            onChange: function (newValue) {
                if(newValue=="default"||newValue==""){
                    $(".flow_param_item_ul_value",impl.context).hide();
                }
                else{$(".flow_param_item_ul_value",impl.context).show();}
                //$(".icon-templates-save").parent().css({opacity: 1});
                if(impl.flow_param.current)
                {
                    $(".icon-templates-save",impl.context).parent().removeClass("disabled");
                }
            }
        });
        $(".flow_parm_value",impl.context).textbox({
            width:192,
            height:100,
            multiline:true,
            required:true,
            maxlength:50,
            disabled:impl.owner&&impl.owner.disable,
            validType: 'whitelist["0-9a-zA-Z_,","字母,下划线和数字,checkbox、select类型请以逗号分隔"]',
            onChange:function()
            {
                if(impl.flow_param.current)
                {
                    $(".icon-templates-save",impl.context).parent().removeClass("disabled");
                }
            }
        });
        $(".flow_parm_description",impl.context).textbox({width:197,height:100,multiline:true,disabled:impl.owner&&impl.owner.disable,onChange:function()
        {
            //$(".icon-templates-save").parent().css({opacity:1});
            if(impl.flow_param.current)
            {
                $(".icon-templates-save",impl.context).parent().removeClass("disabled");
            }
        }});
        $(".icon-recycle-delete",impl.context).parent().addClass("disabled");
        $(".icon-templates-save",impl.context).parent().addClass("disabled");
        if(this.owner&&this.owner.disable)
        {
            $(".icon-recycle-delete",impl.context).parent().addClass("disabled");
            $(".icon-templates-save",impl.context).parent().addClass("disabled");
            $(".icon-templates-add",impl.context).parent().addClass("disabled");
        }
    };
    impl.clear = function (isReset) {
        $(".flow_parm_name",impl.context).textbox('clear');
        $(".flow_parm_type",impl.context).combobox('clear');
        $(".flow_parm_value",impl.context).textbox('clear');
        $(".flow_parm_description",impl.context).textbox('clear');
        $(".flow_param_item_ul_value",impl.context).hide();
        if(isReset)
        {
            $(".icon-recycle-delete",impl.context).parent().addClass("disabled");
            $(".icon-templates-save",impl.context).parent().addClass("disabled");
            $(".icon-templates-add",impl.context).parent().removeClass("disabled");
        }
    };
    impl.addParam = function (res) {
            if(!$(".flow_parm_name",impl.context).textbox('isValid')||!$(".flow_parm_type",impl.context).combobox('isValid')){return;}
            if($(".flow_param_item_ul_value",impl.context).css('display')!="none"){
                if(!$(".flow_parm_value",impl.context).textbox('isValid')){return;}
            }
            var name = $(".flow_parm_name",impl.context).textbox('getValue');
            var data = ef.util.pluck(impl.flow_param.getAllData(),"name");
            var c = null;
            $(data).each(function (i,il) {
                if(name==il){
                    ef.placard.warn(ef.util.getLocale("apply.template.script.name.null"));
                    c = true;
                    return;
                }
            });
            if(c==true){return;}
            var ui_value = $(".flow_parm_value",impl.context).textbox('getValue');
            var uiVal = ui_value.split(",");
            var defaultValue = uiVal[0];
            var uiValue = [];
            $(uiVal).each(function (i,il) {
                var item = {label:"",value:""};
                item.label = il;
                item.value = il;
                uiValue.push(item);
            });
            impl.flow_param.addParam({
                name:name,
                type:"system_normal",
                ui: $(".flow_parm_type",impl.context).combobox('getValue'),
                ui_value:uiValue,
                description:$(".flow_parm_description",impl.context).textbox('getValue'),
                default_value:defaultValue,
                value:""
            });
            impl.difRedraw(res);
            impl.clear(true);


    };
    impl.difRedraw = function (res) {
       $(".paramText",impl.context).each(function (i,il) {
           console.log($(il).text());
           if($.inArray($(il).text(),res)==-1){
               $(il).css({color:"black"});
           }
       });
    };
    impl.redraw=function(param,owner,context)
    {
        this.context=context||document;
        this.owner=owner;
        this.init();
        ef.getJSON({
            url:api.getAPI("manorTemplate")+"/streamlet/script/default",
            type:"get",
            success: function (response) {
                var res = ef.util.pluck(response,'name');
                $(response).each(function (i,il) {
                    il.ui = "default";
                });
                impl.flow_param = $(".flow_param_box",impl.context).param({
                    dataProvider:response,
                    labelField:"name",
                    valueField:""
                });
                impl.difRedraw(res);
                if(param)
                {
                    if(param.data.body.data.nodes._data[param.id]&&param.data.body.data.nodes._data[param.id][param.id]){
                        var useData = param.data.body.data.nodes._data[param.id][param.id].params;
                        if(useData[1].script_params.length!=0){
                            impl.flow_param.clear();
                            $(useData[1].script_params).each(function (i,il) {
                                impl.flow_param.addParam(il);
                            });
                            impl.difRedraw(res);
                        }
                    }
                }
                $(".icon-templates-add",impl.context).parent().click(function () {
                    if(impl.owner&&impl.owner.disable){return false;}
                    if($(this).hasClass("disabled"))return false;
                    impl.addParam(res);
                });
                $(".icon-templates-save",impl.context).parent().click(function () {
                    if(impl.owner&&impl.owner.disable){return false;}
                    if($(this).hasClass("disabled"))return false;
                    if($.inArray(paramClickName,res)!=-1){return false;}
                    impl.flow_param.deleteParam();
                    impl.addParam();
                });
                impl.flow_param.click(function (data) {
                    console.log(data);
                    impl.clear();
                    paramClickName = data.name;
                    $(".flow_parm_name",impl.context).textbox('setValue',data.name);
                    $(".flow_parm_description",impl.context).textbox('setValue',data.description);
                    if(data.ui){ $(".flow_parm_type",impl.context).combobox('setValue',data.ui);}
                    if(data.ui_value){
                        $(".flow_parm_value",impl.context).textbox('setValue',data.ui_value&&data.ui_value.length?ef.util.pluck(data.ui_value,"value").join(","):data.ui_value);
                    }
                    if($.inArray(paramClickName,res)!=-1){
                        $(".icon-recycle-delete",impl.context).parent().addClass("disabled");
                        $(".icon-templates-save",impl.context).parent().addClass("disabled");
                        $(".flow_parm_name",impl.context).textbox({
                            onChange: function (newValue,oldValue) {
                                var typeValue = $(".flow_parm_type",impl.context).combobox('getValue');
                                if(typeValue=="default"){
                                    $(".flow_parm_type",impl.context).combobox('clear');
                                }
                                $(".icon-templates-save",impl.context).parent().addClass("disabled");
                            }
                        });
                    }
                    else{
                        $(".icon-recycle-delete",impl.context).parent().removeClass("disabled");
                        $(".icon-templates-save",impl.context).parent().addClass("disabled");
                    }
                    if(impl.owner&&impl.owner.disable)
                    {
                        $(".icon-recycle-delete",impl.context).parent().addClass("disabled");
                        $(".icon-templates-save",impl.context).parent().addClass("disabled");
                        $(".icon-templates-add",impl.context).parent().addClass("disabled");
                    }

                });
                $(".icon-recycle-delete",impl.context).parent().click(function () {
                    if(impl.owner&&impl.owner.disable){return false;}
                    if($(this).hasClass("disabled"))return false;
                    if($.inArray(paramClickName,res)!=-1){return false;}
                    impl.flow_param.deleteParam();
                    impl.clear(true);
                });
                impl.callback();
            }
        });
    };
    impl.setCallback = function (fn) {
        this.callback=fn;
    };
    impl.destroy=function()
    {
        require.undef(module.id);
    };
    return impl;
});