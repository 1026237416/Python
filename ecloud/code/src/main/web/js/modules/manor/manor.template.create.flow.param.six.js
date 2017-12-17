/**
 * Created by hxf on 2016/5/27.
 */
define(["exports","module","domReady","manor.template.detail"],function(exports,module,domReady,templateDetail)
{
    var impl=new ef.Interface.implement();
    impl.stopNameChoose = null;
    impl.stopChoose=null;
    impl.owner=null;
    impl.context=null;
    impl.init=function()
    {
        var groups=impl.owner&&impl.owner.owner.owner.getGroupNames(true)||[];
        var arrs=[];
        groups=ef.util.uniq(groups);
        $(groups).each(function(i,item)
        {
            arrs.push(
                {
                    label:item,value:item
                });
        });
        var data = [{label:ef.util.getLocale("apply.template.checkbox.data.hide"),value:"hide"},{label:ef.util.getLocale("apply.template.checkbox.data.readOnly"),value:"readOnly"}];
        impl.stopChoose=$("#paramGroupNameStop",impl.context).combobox({
            height:30,
            width:200,
            required:true,
            disabled:impl.owner&&impl.owner.disable,
            "textField":"label",
            "valueField":"value",
            editable:false,
            data:arrs
        });
        impl.stopNameChoose = $("#stopNameChoose",impl.context).checkinfo({
            dataProvider:data,
            disabled:impl.owner&&impl.owner.disable,
            className:"checkInfo_choose"
        });
        ef.event.on("manor.group.change",function(event,data)
        {
            var arrs=data.owner.getFlows();
            var result=[];
            $(arrs).each(function(i,il)
            {
                if(il.isInstall)
                {
                    result=il.getGroupNames(true);
                }
            });
            var val=$("#paramGroupNameStop",impl.context).combobox("getValue");
            $("#paramGroupNameStop",impl.context).combobox("loadData",impl.createComboboxData(result));
            if(!ef.util.find(result,function(item)
                {
                    return item==val;
                }))
            {
                $("#paramGroupNameStop",impl.context).combobox("setValue","");
            }
        });
    };
    impl.createComboboxData=function(data)
    {
        var result=[];
        $(data).each(function(i,il)
        {
            result.push(
                {
                    label:il,
                    value:il
                });
        });

        return result;
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
                if(il.group_name){
                    $("#paramGroupNameStop",impl.context).combobox('setValue',il.group_name);
                    if(il.streamlet_params_properties_hide==true){impl.stopNameChoose.setSelect("hide");}
                    if(il.streamlet_params_properties_read_only==true){impl.stopNameChoose.setSelect("readOnly");}
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